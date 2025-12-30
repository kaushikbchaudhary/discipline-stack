"use server";

import { revalidatePath } from "next/cache";

import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { outputSchema } from "@/lib/validation";
import { refreshDailyCompletion } from "@/lib/progress";
import { startOfDay } from "@/lib/time";

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
    return { ok: false, error: "Add a valid output entry." };
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
