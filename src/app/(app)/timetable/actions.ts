"use server";

import { revalidatePath } from "next/cache";

import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { scheduleBlockSchema } from "@/lib/validation";
import { isOverlapping, timeStringToMinutes } from "@/lib/time";

const assertNoOverlap = (
  blocks: { id: string; startTime: number; endTime: number }[],
  candidate: { startTime: number; endTime: number },
  ignoreId?: string,
) => {
  const overlaps = blocks.some((block) => {
    if (ignoreId && block.id === ignoreId) {
      return false;
    }
    return isOverlapping(candidate, block);
  });

  if (overlaps) {
    throw new Error("This block overlaps another block.");
  }
};

const requireConfirm = async (userId: string, confirmed?: boolean) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user?.scheduleLocked && !confirmed) {
    throw new Error("Schedule is locked. Confirm to edit.");
  }
  return user;
};

export const createBlock = async (formData: FormData) => {
  try {
    const session = await getServerAuthSession();
    if (!session?.user?.id) {
      return { ok: false, error: "Not authenticated." };
    }

    const parsed = scheduleBlockSchema.safeParse({
      name: formData.get("name"),
      startTime: formData.get("startTime"),
      endTime: formData.get("endTime"),
      category: formData.get("category"),
      mandatory: formData.get("mandatory"),
    });

    if (!parsed.success) {
      return { ok: false, error: "Provide valid block details." };
    }

    const startTime = timeStringToMinutes(parsed.data.startTime);
    const endTime = timeStringToMinutes(parsed.data.endTime);

    if (startTime >= endTime) {
      return { ok: false, error: "Start time must be before end time." };
    }

    const confirmed = formData.get("confirmed") === "true";
    const user = await requireConfirm(session.user.id, confirmed);

    const existing = await prisma.scheduleBlock.findMany({
      where: { userId: session.user.id },
    });

    assertNoOverlap(existing, { startTime, endTime });

    await prisma.scheduleBlock.create({
      data: {
        userId: session.user.id,
        name: parsed.data.name,
        startTime,
        endTime,
        category: parsed.data.category,
        mandatory: parsed.data.mandatory,
        lockedVersion: user?.scheduleLockVersion ?? 1,
      },
    });

    revalidatePath("/timetable");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
};

export const updateBlock = async (formData: FormData) => {
  try {
    const session = await getServerAuthSession();
    if (!session?.user?.id) {
      return { ok: false, error: "Not authenticated." };
    }

    const id = String(formData.get("id"));
    const parsed = scheduleBlockSchema.safeParse({
      name: formData.get("name"),
      startTime: formData.get("startTime"),
      endTime: formData.get("endTime"),
      category: formData.get("category"),
      mandatory: formData.get("mandatory"),
    });

    if (!parsed.success) {
      return { ok: false, error: "Provide valid block details." };
    }

    const startTime = timeStringToMinutes(parsed.data.startTime);
    const endTime = timeStringToMinutes(parsed.data.endTime);

    if (startTime >= endTime) {
      return { ok: false, error: "Start time must be before end time." };
    }

    const confirmed = formData.get("confirmed") === "true";
    await requireConfirm(session.user.id, confirmed);

    const existing = await prisma.scheduleBlock.findMany({
      where: { userId: session.user.id },
    });

    assertNoOverlap(existing, { startTime, endTime }, id);

    await prisma.scheduleBlock.update({
      where: { id },
      data: {
        name: parsed.data.name,
        startTime,
        endTime,
        category: parsed.data.category,
        mandatory: parsed.data.mandatory,
      },
    });

    revalidatePath("/timetable");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
};

export const deleteBlock = async (formData: FormData) => {
  try {
    const session = await getServerAuthSession();
    if (!session?.user?.id) {
      return { ok: false, error: "Not authenticated." };
    }

    const id = String(formData.get("id"));
    const confirmed = formData.get("confirmed") === "true";
    await requireConfirm(session.user.id, confirmed);

    await prisma.scheduleBlock.delete({ where: { id } });
    revalidatePath("/timetable");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
};

export const toggleScheduleLock = async () => {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return { ok: false, error: "Not authenticated." };
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return { ok: false, error: "User not found." };
  }

  const nextLocked = !user.scheduleLocked;
  await prisma.user.update({
    where: { id: user.id },
    data: {
      scheduleLocked: nextLocked,
      scheduleLockVersion: nextLocked ? user.scheduleLockVersion + 1 : user.scheduleLockVersion,
    },
  });

  revalidatePath("/timetable");
  return { ok: true, locked: nextLocked };
};
