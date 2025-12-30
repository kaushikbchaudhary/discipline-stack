"use server";

import { revalidatePath } from "next/cache";
import { mkdir, writeFile } from "fs/promises";
import { randomUUID } from "crypto";
import path from "path";

import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { outputSchema } from "@/lib/validation";
import { refreshDailyCompletion } from "@/lib/progress";
import { startOfDay } from "@/lib/time";

export const toggleTaskCompletion = async (taskId: string) => {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return { ok: false, error: "Not authenticated." };
  }

  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      plan: { userId: session.user.id },
    },
  });

  if (!task) {
    return { ok: false, error: "Task not found." };
  }

  await prisma.task.update({
    where: { id: task.id },
    data: { completed: !task.completed },
  });

  await refreshDailyCompletion(session.user.id, task.date);
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
    return { ok: false, error: parsed.error.issues[0]?.message || "Add a valid artifact entry." };
  }

  const date = startOfDay(new Date());

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { activeGoalId: true },
  });

  if (!user?.activeGoalId) {
    return { ok: false, error: "Set a primary goal before adding artifacts." };
  }

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

  await prisma.goalArtifact.create({
    data: {
      userId: session.user.id,
      goalId: user.activeGoalId,
      blockId: null,
      date,
      type: parsed.data.outputType,
      content: parsed.data.outputContent,
    },
  });

  await refreshDailyCompletion(session.user.id, date);
  revalidatePath("/today");
  return { ok: true };
};

export const saveArtifactFile = async (formData: FormData) => {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return { ok: false, error: "Not authenticated." };
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { ok: false, error: "Select a file to upload." };
  }

  if (file.size === 0) {
    return { ok: false, error: "File is empty." };
  }

  const maxBytes = 20 * 1024 * 1024;
  if (file.size > maxBytes) {
    return { ok: false, error: "File exceeds 20MB limit." };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { activeGoalId: true },
  });

  if (!user?.activeGoalId) {
    return { ok: false, error: "Set a primary goal before adding artifacts." };
  }

  const date = startOfDay(new Date());
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  const safeName = `${randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const filePath = path.join(uploadDir, safeName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);
  const fileUrl = `/uploads/${safeName}`;

  await prisma.dailyCompletion.upsert({
    where: { userId_date: { userId: session.user.id, date } },
    create: {
      userId: session.user.id,
      date,
      outputType: "FILE",
      outputContent: file.name,
    },
    update: {
      outputType: "FILE",
      outputContent: file.name,
    },
  });

  await prisma.goalArtifact.create({
    data: {
      userId: session.user.id,
      goalId: user.activeGoalId,
      blockId: null,
      date,
      type: "FILE",
      fileUrl,
      content: file.name,
    },
  });

  await refreshDailyCompletion(session.user.id, date);
  revalidatePath("/today");
  return { ok: true, fileUrl };
};
