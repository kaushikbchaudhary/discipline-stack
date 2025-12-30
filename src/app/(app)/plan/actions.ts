"use server";

import { revalidatePath } from "next/cache";

import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createDefaultPlan } from "@/lib/setup";
import { refreshDailyCompletion } from "@/lib/progress";
import { startOfDay } from "@/lib/time";

export const toggleTaskCompletion = async (taskId: string) => {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return { ok: false, error: "Not authenticated." };
  }

  const task = await prisma.task.findFirst({
    where: { id: taskId, plan: { userId: session.user.id } },
  });

  if (!task) {
    return { ok: false, error: "Task not found." };
  }

  await prisma.task.update({
    where: { id: task.id },
    data: { completed: !task.completed },
  });

  await refreshDailyCompletion(session.user.id, task.date);
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
  const description = String(formData.get("description") ?? "");
  const startTime = String(formData.get("startTime") ?? "");
  const endTime = String(formData.get("endTime") ?? "");
  const durationMinutes = Number(formData.get("durationMinutes") ?? 0);
  const incompleteReason = String(formData.get("incompleteReason") ?? "");

  const task = await prisma.task.findFirst({
    where: { id: taskId, plan: { userId: session.user.id } },
  });

  if (!task) {
    return { ok: false, error: "Task not found." };
  }

  await prisma.task.update({
    where: { id: taskId },
    data: {
      title,
      description,
      startTime: startTime || null,
      endTime: endTime || null,
      durationMinutes: Number.isNaN(durationMinutes) ? null : durationMinutes,
      incompleteReason: incompleteReason.trim() || null,
    },
  });

  await refreshDailyCompletion(session.user.id, task.date);
  revalidatePath("/plan");
  return { ok: true };
};

export const addTask = async (formData: FormData) => {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return { ok: false, error: "Not authenticated." };
  }

  const title = String(formData.get("title"));
  const description = String(formData.get("description") ?? "");
  const startTime = String(formData.get("startTime") ?? "");
  const endTime = String(formData.get("endTime") ?? "");
  const durationMinutes = Number(formData.get("durationMinutes") ?? 0);
  const incompleteReason = String(formData.get("incompleteReason") ?? "");
  const dateValue = String(formData.get("date") ?? "");

  if (!dateValue) {
    return { ok: false, error: "Date is required." };
  }

  const plan = await prisma.plan.findFirst({
    where: { userId: session.user.id },
    orderBy: { startDate: "desc" },
  });

  if (!plan) {
    return { ok: false, error: "Plan not found." };
  }

  const date = startOfDay(new Date(dateValue));

  await prisma.task.create({
    data: {
      planId: plan.id,
      title,
      description,
      date,
      startTime: startTime || null,
      endTime: endTime || null,
      durationMinutes: Number.isNaN(durationMinutes) ? null : durationMinutes,
      completed: false,
      incompleteReason: incompleteReason.trim() || null,
    },
  });

  await refreshDailyCompletion(session.user.id, date);
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
    where: { id: taskId, plan: { userId: session.user.id } },
  });

  if (!task) {
    return { ok: false, error: "Task not found." };
  }

  await prisma.task.delete({ where: { id: taskId } });

  await refreshDailyCompletion(session.user.id, task.date);
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
