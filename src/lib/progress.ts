import { prisma } from "@/lib/prisma";
import { startOfDay } from "@/lib/time";

export const getPlanForDate = async (userId: string, date: Date) => {
  const target = startOfDay(date);
  const plans = await prisma.plan.findMany({
    where: { userId },
    orderBy: { startDate: "desc" },
    include: { tasks: true },
  });

  return plans.find((plan) => {
    const start = startOfDay(plan.startDate).getTime();
    const end = start + plan.durationDays * 24 * 60 * 60 * 1000;
    return target.getTime() >= start && target.getTime() < end;
  });
};

export const refreshDailyCompletion = async (userId: string, date: Date) => {
  const targetDate = startOfDay(date);
  const [daily, plan] = await Promise.all([
    prisma.dailyCompletion.findUnique({
      where: { userId_date: { userId, date: targetDate } },
    }),
    getPlanForDate(userId, targetDate),
  ]);

  const tasks =
    plan?.tasks.filter((task) => startOfDay(task.date).getTime() === targetDate.getTime()) ??
    [];
  const tasksDone = tasks.length > 0 ? tasks.every((task) => task.completed) : false;

  const outputReady = Boolean(daily?.outputType && daily?.outputContent);
  const isComplete = tasksDone && outputReady;
  const completedAt = isComplete ? daily?.completedAt ?? new Date() : null;

  await prisma.dailyCompletion.upsert({
    where: { userId_date: { userId, date: targetDate } },
    create: {
      userId,
      date: targetDate,
      coreWorkDone: false,
      practiceDone: false,
      healthDone: false,
      dailyWinSatisfied: false,
      completedAt,
      outputContent: daily?.outputContent,
      outputType: daily?.outputType,
    },
    update: {
      completedAt,
    },
  });

  return {
    outputReady,
    isComplete,
  };
};
