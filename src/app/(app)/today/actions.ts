"use server";

import { revalidatePath } from "next/cache";

import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { outputSchema } from "@/lib/validation";
import { refreshDailyCompletion } from "@/lib/progress";
import { startOfDay } from "@/lib/time";
import { resolveDebt as resolveDebtRecord } from "@/lib/debt";
import { getDailyWinConfig, setDailyWinConfig, upsertDailyWin } from "@/lib/dailyWin";
import { canEnableQuietWeek, enableQuietWeek } from "@/lib/quiet";

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
    const nextAction = await prisma.nextAction.findUnique({
      where: {
        userId_blockId_date: {
          userId: session.user.id,
          blockId,
          date,
        },
      },
    });
    if (!nextAction) {
      return { ok: false, error: "Next action required before starting this block." };
    }
    await prisma.blockCompletion.create({
      data: { userId: session.user.id, scheduleBlockId: blockId, date },
    });

    const winConfig = await getDailyWinConfig(session.user.id);
    if (
      (winConfig.type === "block" || winConfig.type === "either") &&
      winConfig.blockId === blockId
    ) {
      await upsertDailyWin(session.user.id, date, `block:${blockId}`);
    }
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

  const winConfig = await getDailyWinConfig(session.user.id);
  if (winConfig.type === "output" || winConfig.type === "either") {
    await upsertDailyWin(session.user.id, date, "output");
  }

  await refreshDailyCompletion(session.user.id, date);
  revalidatePath("/today");
  return { ok: true };
};

export const saveDailyWinConfig = async (formData: FormData) => {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return { ok: false, error: "Not authenticated." };
  }

  const type = String(formData.get("winType"));
  const blockId = String(formData.get("blockId") ?? "");

  if (type !== "output" && type !== "block" && type !== "either") {
    return { ok: false, error: "Invalid daily win selection." };
  }

  if ((type === "block" || type === "either") && !blockId) {
    return { ok: false, error: "Select a block for Daily Win." };
  }

  await setDailyWinConfig(session.user.id, {
    type: type as "block" | "output" | "either",
    blockId: type === "block" || type === "either" ? blockId : null,
  });

  revalidatePath("/today");
  return { ok: true };
};

export const saveNextAction = async (formData: FormData) => {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return { ok: false, error: "Not authenticated." };
  }

  const blockId = String(formData.get("blockId") ?? "");
  const text = String(formData.get("text") ?? "").trim();

  if (!blockId) {
    return { ok: false, error: "Block is required." };
  }

  if (!text || text.length > 120) {
    return { ok: false, error: "Next action must be 1-120 characters." };
  }

  const date = startOfDay(new Date());

  const block = await prisma.scheduleBlock.findFirst({
    where: { id: blockId, userId: session.user.id },
  });

  if (!block) {
    return { ok: false, error: "Block not found." };
  }

  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  if (minutes >= block.startTime) {
    return { ok: false, error: "Next action can only be edited before block start." };
  }

  await prisma.nextAction.upsert({
    where: { userId_blockId_date: { userId: session.user.id, blockId, date } },
    create: { userId: session.user.id, blockId, date, text },
    update: { text },
  });

  revalidatePath("/today");
  return { ok: true };
};

export const logResistance = async (formData: FormData) => {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return { ok: false, error: "Not authenticated." };
  }

  const blockId = String(formData.get("blockId") ?? "");
  const reason = String(formData.get("reason") ?? "");
  const date = startOfDay(new Date());

  if (!blockId) {
    return { ok: false, error: "Block is required." };
  }

  const allowed = [
    "TOO_TIRED",
    "AVOIDANCE",
    "UNCLEAR_NEXT_STEP",
    "EXTERNAL_INTERRUPTION",
    "OVERPLANNED",
  ];

  if (!allowed.includes(reason)) {
    return { ok: false, error: "Select a valid reason." };
  }

  const block = await prisma.scheduleBlock.findFirst({
    where: { id: blockId, userId: session.user.id },
  });
  if (!block?.mandatory) {
    return { ok: false, error: "Resistance logging is only for mandatory blocks." };
  }

  await prisma.blockCompletion.deleteMany({
    where: { userId: session.user.id, scheduleBlockId: blockId, date },
  });

  await prisma.blockResistance.upsert({
    where: { userId_blockId_date: { userId: session.user.id, blockId, date } },
    create: { userId: session.user.id, blockId, date, reason: reason as any },
    update: { reason: reason as any },
  });

  await refreshDailyCompletion(session.user.id, date);
  revalidatePath("/today");
  return { ok: true };
};

export const toggleQuietWeek = async () => {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return { ok: false, error: "Not authenticated." };
  }

  const canEnable = await canEnableQuietWeek(session.user.id);
  if (!canEnable) {
    return { ok: false, error: "Quiet Mode can be enabled once every 2 weeks." };
  }

  await enableQuietWeek(session.user.id);
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
