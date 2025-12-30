import { prisma } from "@/lib/prisma";
import { startOfDay } from "@/lib/time";

export type DailyWinConfig = {
  type: "block" | "output" | "either";
  blockId?: string | null;
};

export const getDailyWinConfig = async (userId: string): Promise<DailyWinConfig> => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.dailyWinType) {
    const incomeBlock = await prisma.scheduleBlock.findFirst({
      where: { userId, category: "Income" },
    });
    if (incomeBlock) {
      return { type: "either", blockId: incomeBlock.id };
    }
    return { type: "output" };
  }
  if (user?.dailyWinType === "block" && user.dailyWinBlockId) {
    return { type: "block", blockId: user.dailyWinBlockId };
  }
  if (user?.dailyWinType === "either") {
    return { type: "either", blockId: user.dailyWinBlockId };
  }
  return { type: "output" };
};

export const setDailyWinConfig = async (userId: string, config: DailyWinConfig) => {
  await prisma.user.update({
    where: { id: userId },
    data: {
      dailyWinType: config.type,
      dailyWinBlockId: config.type === "block" || config.type === "either" ? config.blockId : null,
    },
  });
};

export const upsertDailyWin = async (
  userId: string,
  date: Date,
  satisfiedBy: string,
) => {
  const day = startOfDay(date);
  return prisma.dailyWin.upsert({
    where: { userId_date: { userId, date: day } },
    create: { userId, date: day, satisfiedBy },
    update: { satisfiedBy, satisfiedAt: new Date() },
  });
};

export const getDailyWin = async (userId: string, date: Date) => {
  const day = startOfDay(date);
  return prisma.dailyWin.findUnique({
    where: { userId_date: { userId, date: day } },
  });
};

export const isDailyWinSatisfied = async (
  userId: string,
  date: Date,
  config: DailyWinConfig,
) => {
  const win = await getDailyWin(userId, date);
  if (win) {
    return true;
  }

  if (config.type === "output") {
    const completion = await prisma.dailyCompletion.findUnique({
      where: { userId_date: { userId, date: startOfDay(date) } },
    });
    return Boolean(completion?.outputContent);
  }

  if (config.type === "block" && config.blockId) {
    const completion = await prisma.blockCompletion.findFirst({
      where: { userId, scheduleBlockId: config.blockId, date: startOfDay(date) },
    });
    return Boolean(completion);
  }

  return false;
};
