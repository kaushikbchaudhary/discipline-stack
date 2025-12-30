"use server";

import { revalidatePath } from "next/cache";

import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createDefaultPlan } from "@/lib/setup";
import { refreshDailyCompletion } from "@/lib/progress";
import { isPastDay } from "@/lib/time";

const assertEditable = async (userId: string, date: Date) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error("User not found.");
  }

  if (isPastDay(date) && !user.pastEditUnlocked) {
    throw new Error("Past days are locked. Toggle unlock to edit.");
  }
};

export const togglePastEdit = async () => {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return { ok: false, error: "Not authenticated." };
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return { ok: false, error: "User not found." };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { pastEditUnlocked: !user.pastEditUnlocked },
  });

  revalidatePath("/plan");
  return { ok: true, unlocked: !user.pastEditUnlocked };
};

export const toggleTaskCompletion = async (taskId: string) => {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return { ok: false, error: "Not authenticated." };
  }

  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      planDay: { plan: { userId: session.user.id } },
    },
    include: { planDay: true },
  });

  if (!task) {
    return { ok: false, error: "Task not found." };
  }

  try {
    await assertEditable(session.user.id, task.planDay.date);
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }

  await prisma.task.update({
    where: { id: task.id },
    data: { completedAt: task.completedAt ? null : new Date() },
  });

  await refreshDailyCompletion(session.user.id, task.planDay.date);
  revalidatePath("/plan");
  return { ok: true };
};

export const updateTask = async (formData: FormData) => {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return { ok: false, error: "Not authenticated." };
  }

  const taskId = String(formData.get("id"));
  const title = String(formData.get("title"));
  const category = String(formData.get("category"));
  const mandatory = formData.get("mandatory") !== null;

  const task = await prisma.task.findFirst({
    where: { id: taskId, planDay: { plan: { userId: session.user.id } } },
    include: { planDay: true },
  });

  if (!task) {
    return { ok: false, error: "Task not found." };
  }

  try {
    await assertEditable(session.user.id, task.planDay.date);
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }

  await prisma.task.update({
    where: { id: taskId },
    data: { title, category, mandatory },
  });

  await refreshDailyCompletion(session.user.id, task.planDay.date);
  revalidatePath("/plan");
  return { ok: true };
};

export const addTask = async (formData: FormData) => {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return { ok: false, error: "Not authenticated." };
  }

  const planDayId = String(formData.get("planDayId"));
  const title = String(formData.get("title"));
  const category = String(formData.get("category"));
  const mandatory = formData.get("mandatory") !== null;

  const planDay = await prisma.planDay.findFirst({
    where: { id: planDayId, plan: { userId: session.user.id } },
  });

  if (!planDay) {
    return { ok: false, error: "Plan day not found." };
  }

  try {
    await assertEditable(session.user.id, planDay.date);
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }

  const existingCount = await prisma.task.count({ where: { planDayId } });

  await prisma.task.create({
    data: {
      planDayId,
      title,
      category,
      mandatory,
      sortOrder: existingCount + 1,
    },
  });

  await refreshDailyCompletion(session.user.id, planDay.date);
  revalidatePath("/plan");
  return { ok: true };
};

export const deleteTask = async (formData: FormData) => {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return { ok: false, error: "Not authenticated." };
  }

  const taskId = String(formData.get("id"));

  const task = await prisma.task.findFirst({
    where: { id: taskId, planDay: { plan: { userId: session.user.id } } },
    include: { planDay: true },
  });

  if (!task) {
    return { ok: false, error: "Task not found." };
  }

  try {
    await assertEditable(session.user.id, task.planDay.date);
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }

  await prisma.task.delete({ where: { id: taskId } });

  await refreshDailyCompletion(session.user.id, task.planDay.date);
  revalidatePath("/plan");
  return { ok: true };
};

export const regeneratePlan = async () => {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return { ok: false, error: "Not authenticated." };
  }

  await createDefaultPlan(session.user.id, new Date());
  revalidatePath("/plan");
  return { ok: true };
};
