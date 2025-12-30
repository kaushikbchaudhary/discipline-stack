"use server";

import { revalidatePath } from "next/cache";

import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { outputSchema } from "@/lib/validation";
import { refreshDailyCompletion } from "@/lib/progress";
import { startOfDay } from "@/lib/time";
import { resolveDebt as resolveDebtRecord } from "@/lib/debt";

export const toggleBlockCompletion = async (blockId: string) => {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return { ok: false, error: "Not authenticated." };
  }

  const block = await prisma.scheduleBlock.findFirst({
    where: { id: blockId, userId: session.user.id },
  });

  if (!block) {
    return { ok: false, error: "Block not found." };
  }

  const date = startOfDay(new Date());
  const existing = await prisma.blockCompletion.findUnique({
    where: { userId_scheduleBlockId_date: { userId: session.user.id, scheduleBlockId: blockId, date } },
  });

  if (existing) {
    await prisma.blockCompletion.delete({ where: { id: existing.id } });
  } else {
    await prisma.blockCompletion.create({
      data: { userId: session.user.id, scheduleBlockId: blockId, date },
    });
  }

  await refreshDailyCompletion(session.user.id, date);
  revalidatePath("/today");
  return { ok: true };
};

export const toggleTaskCompletion = async (taskId: string) => {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return { ok: false, error: "Not authenticated." };
  }

  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      planDay: {
        plan: {
          userId: session.user.id,
        },
      },
    },
    include: { planDay: true },
  });

  if (!task) {
    return { ok: false, error: "Task not found." };
  }

  await prisma.task.update({
    where: { id: task.id },
    data: { completedAt: task.completedAt ? null : new Date() },
  });

  await refreshDailyCompletion(session.user.id, task.planDay.date);
  revalidatePath("/today");
  return { ok: true };
};

export const saveOutput = async (formData: FormData) => {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return { ok: false, error: "Not authenticated." };
  }

  const parsed = outputSchema.safeParse({
    outputType: formData.get("outputType"),
    outputContent: formData.get("outputContent"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "Add a valid output entry." };
  }

  const date = startOfDay(new Date());

  await prisma.dailyCompletion.upsert({
    where: { userId_date: { userId: session.user.id, date } },
    create: {
      userId: session.user.id,
      date,
      outputType: parsed.data.outputType,
      outputContent: parsed.data.outputContent,
    },
    update: {
      outputType: parsed.data.outputType,
      outputContent: parsed.data.outputContent,
    },
  });

  await refreshDailyCompletion(session.user.id, date);
  revalidatePath("/today");
  return { ok: true };
};

export const resolveDebt = async (payload: {
  debtId: string;
  resolutionType: "extra_time" | "extra_output";
  resolutionNote: string;
}) => {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return { ok: false, error: "Not authenticated." };
  }

  if (!payload.resolutionNote.trim()) {
    return { ok: false, error: "Resolution note is required." };
  }

  try {
    await resolveDebtRecord(
      session.user.id,
      payload.debtId,
      payload.resolutionType,
      payload.resolutionNote,
    );
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }

  await refreshDailyCompletion(session.user.id, startOfDay(new Date()));
  revalidatePath("/today");
  return { ok: true };
};

export const markFailureDay = async (formData: FormData) => {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return { ok: false, error: "Not authenticated." };
  }

  const note = String(formData.get("note") ?? "").trim();
  if (!note) {
    return { ok: false, error: "Failure day note is required." };
  }

  const today = startOfDay(new Date());

  const existing = await prisma.failureDay.findUnique({
    where: { userId_date: { userId: session.user.id, date: today } },
  });

  if (existing) {
    return { ok: false, error: "Failure day already logged for today." };
  }

  const plan = await prisma.plan.findFirst({
    where: { userId: session.user.id },
    orderBy: { startDate: "desc" },
  });

  if (plan) {
    const end = new Date(plan.startDate);
    end.setDate(end.getDate() + plan.durationDays);
    const failureCount = await prisma.failureDay.count({
      where: { userId: session.user.id, date: { gte: plan.startDate, lt: end } },
    });
    if (failureCount >= 2) {
      return { ok: false, error: "Failure day limit reached for this cycle." };
    }
  }

  await prisma.failureDay.create({
    data: { userId: session.user.id, date: today, note },
  });

  await prisma.executionDebt.deleteMany({
    where: { userId: session.user.id, missedDate: today },
  });

  await refreshDailyCompletion(session.user.id, today);
  revalidatePath("/today");
  return { ok: true };
};
