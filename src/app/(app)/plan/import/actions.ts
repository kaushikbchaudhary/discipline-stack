"use server";

import { revalidatePath } from "next/cache";

import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { planImportSchema, validatePlanImport } from "@/lib/planImport";
import { startOfDay } from "@/lib/time";

export const validatePlanJson = async (payload: { json: string; hoursPerDay: number }) => {
  try {
    const parsed = JSON.parse(payload.json);
    const plan = planImportSchema.parse(parsed);
    const issues = validatePlanImport(plan, payload.hoursPerDay);
    if (issues.length > 0) {
      return { ok: false, error: issues[0] };
    }
    return { ok: true };
  } catch (error) {
    if (error instanceof Error) {
      return { ok: false, error: error.message };
    }
    return { ok: false, error: "Invalid JSON." };
  }
};

export const importPlanJson = async (payload: { json: string; hoursPerDay: number }) => {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return { ok: false, error: "Not authenticated." };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(payload.json);
  } catch {
    return { ok: false, error: "Invalid JSON." };
  }

  const plan = planImportSchema.safeParse(parsed);
  if (!plan.success) {
    return { ok: false, error: plan.error.issues[0]?.message ?? "Invalid plan." };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true },
  });
  if (!user) {
    return { ok: false, error: "Session expired. Please log in again." };
  }

  const issues = validatePlanImport(plan.data, payload.hoursPerDay);
  if (issues.length > 0) {
    return { ok: false, error: issues[0] };
  }

  const startDate = startOfDay(new Date(plan.data.startDate));

  const result = await prisma.$transaction(async (tx) => {
    const planEnd = new Date(startDate);
    planEnd.setDate(planEnd.getDate() + plan.data.durationDays - 1);

    await tx.task.deleteMany({
      where: {
        plan: { userId: session.user.id },
        date: { gte: startDate, lte: planEnd },
      },
    });

    const emptyPlans = await tx.plan.findMany({
      where: {
        userId: session.user.id,
        tasks: { none: {} },
      },
      select: { id: true },
    });

    if (emptyPlans.length > 0) {
      await tx.plan.deleteMany({
        where: { id: { in: emptyPlans.map((plan) => plan.id) } },
      });
    }

    const newPlan = await tx.plan.create({
      data: {
        userId: session.user.id,
        name: plan.data.name,
        startDate,
        durationDays: plan.data.durationDays,
        locked: true,
      },
    });

    const tasks = plan.data.days.flatMap((day) =>
      day.tasks.map((task) => ({
        planId: newPlan.id,
        title: task.title,
        description: task.description,
        date: startOfDay(new Date(task.date)),
        startTime: task.startTime,
        endTime: task.endTime,
        durationMinutes: task.durationMinutes,
        completed: false,
        incompleteReason: null,
      })),
    );

    await tx.task.createMany({ data: tasks });

    const totalTasks = plan.data.days.reduce((sum, day) => sum + day.tasks.length, 0);
    const totalMinutes = plan.data.days.reduce(
      (sum, day) => sum + day.tasks.reduce((inner, task) => inner + task.durationMinutes, 0),
      0,
    );
    const totalHours = Math.round(totalMinutes / 60);

    return { newPlan, totalTasks, totalHours };
  });

  revalidatePath("/plan");
  return {
    ok: true,
    summary: {
      days: plan.data.durationDays,
      tasks: result.totalTasks,
      hours: result.totalHours,
    },
  };
};
