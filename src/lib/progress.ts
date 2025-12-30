import { prisma } from "@/lib/prisma";
import { startOfDay } from "@/lib/time";

const hasAll = <T>(list: T[], predicate: (item: T) => boolean) => {
  if (list.length === 0) {
    return false;
  }
  return list.every(predicate);
};

export const getPlanForDate = async (userId: string, date: Date) => {
  const target = startOfDay(date);
  const plans = await prisma.plan.findMany({
    where: { userId },
    orderBy: { startDate: "desc" },
    include: { days: { include: { tasks: true } } },
  });

  return plans.find((plan) => {
    const start = startOfDay(plan.startDate).getTime();
    const end = start + plan.durationDays * 24 * 60 * 60 * 1000;
    return target.getTime() >= start && target.getTime() < end;
  });
};

export const refreshDailyCompletion = async (userId: string, date: Date) => {
  const targetDate = startOfDay(date);
  const [blocks, completions, daily, plan, failureDay, unresolvedDebt] = await Promise.all([
    prisma.scheduleBlock.findMany({
      where: { userId, mandatory: true },
    }),
    prisma.blockCompletion.findMany({
      where: { userId, date: targetDate },
    }),
    prisma.dailyCompletion.findUnique({
      where: { userId_date: { userId, date: targetDate } },
    }),
    getPlanForDate(userId, targetDate),
    prisma.failureDay.findUnique({
      where: { userId_date: { userId, date: targetDate } },
    }),
    prisma.executionDebt.findFirst({
      where: { userId, resolvedAt: null },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const completedBlockIds = new Set(completions.map((item) => item.scheduleBlockId));
  const mandatoryBlocksDone = blocks.every((block) => completedBlockIds.has(block.id));

  const planDay = plan?.days.find(
    (day) => startOfDay(day.date).getTime() === targetDate.getTime(),
  );
  const mandatoryTasks = planDay?.tasks.filter((task) => task.mandatory) ?? [];

  const mandatoryTasksDone = mandatoryTasks.every((task) => task.completedAt);
  const incomeDone = hasAll(
    mandatoryTasks.filter((task) => task.category === "Income"),
    (task) => Boolean(task.completedAt),
  );
  const creationDone = hasAll(
    mandatoryTasks.filter((task) => task.category === "Creation"),
    (task) => Boolean(task.completedAt),
  );
  const healthDone = hasAll(
    mandatoryTasks.filter((task) => task.category === "Health"),
    (task) => Boolean(task.completedAt),
  );

  const outputReady = Boolean(daily?.outputContent && daily?.outputType);
  const hasDebt = Boolean(unresolvedDebt);
  const isFailureDay = Boolean(failureDay);
  const isComplete = !hasDebt && !isFailureDay && mandatoryBlocksDone && mandatoryTasksDone && outputReady;
  const completedAt = isComplete ? daily?.completedAt ?? new Date() : null;

  await prisma.dailyCompletion.upsert({
    where: { userId_date: { userId, date: targetDate } },
    create: {
      userId,
      date: targetDate,
      incomeDone,
      creationDone,
      healthDone,
      completedAt,
      outputContent: daily?.outputContent,
      outputType: daily?.outputType,
    },
    update: {
      incomeDone,
      creationDone,
      healthDone,
      completedAt,
    },
  });

  return {
    mandatoryBlocksDone,
    mandatoryTasksDone,
    outputReady,
    isComplete,
    hasDebt,
    isFailureDay,
  };
};
