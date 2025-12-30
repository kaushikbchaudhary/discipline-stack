import { prisma } from "@/lib/prisma";
import { startOfDay, addDays } from "@/lib/time";

export const ensureDebtForMissedDay = async (userId: string, date: Date) => {
  const targetDate = startOfDay(date);
  const today = startOfDay(new Date());
  if (targetDate.getTime() >= today.getTime()) {
    return null;
  }

  const failureDay = await prisma.failureDay.findUnique({
    where: { userId_date: { userId, date: targetDate } },
  });

  if (failureDay) {
    return null;
  }

  const existingDebt = await prisma.executionDebt.findFirst({
    where: { userId, missedDate: targetDate },
  });

  if (existingDebt) {
    return existingDebt;
  }

  const mandatoryBlocks = await prisma.scheduleBlock.findMany({
    where: { userId, mandatory: true },
  });

  if (mandatoryBlocks.length === 0) {
    return null;
  }

  const completions = await prisma.blockCompletion.findMany({
    where: { userId, date: targetDate },
  });

  const completedBlockIds = new Set(completions.map((item) => item.scheduleBlockId));
  const missedBlocks = mandatoryBlocks.filter((block) => !completedBlockIds.has(block.id));

  if (missedBlocks.length === 0) {
    return null;
  }

  const reason = `Missed mandatory blocks: ${missedBlocks
    .slice(0, 3)
    .map((block) => block.name)
    .join(", ")}${missedBlocks.length > 3 ? "" : ""}`;

  return prisma.executionDebt.create({
    data: {
      userId,
      missedDate: targetDate,
      reason,
    },
  });
};

export const getUnresolvedDebt = async (userId: string) => {
  return prisma.executionDebt.findMany({
    where: { userId, resolvedAt: null },
    orderBy: { createdAt: "asc" },
  });
};

export const resolveDebt = async (
  userId: string,
  debtId: string,
  resolutionType: "extra_time" | "extra_output",
  resolutionNote: string,
) => {
  const debt = await prisma.executionDebt.findFirst({
    where: { id: debtId, userId },
  });
  if (!debt) {
    throw new Error("Debt not found.");
  }
  return prisma.executionDebt.update({
    where: { id: debtId },
    data: {
      resolvedAt: new Date(),
      resolutionType,
      resolutionNote,
    },
  });
};

export const getDebtDueDate = (missedDate: Date) => {
  return addDays(startOfDay(missedDate), 1);
};
