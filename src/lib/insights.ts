import { prisma } from "@/lib/prisma";
import { addDays, startOfDay } from "@/lib/time";

export const computeWeeklyInsights = async (userId: string, weekStartDate: Date) => {
  const start = startOfDay(weekStartDate);
  const end = addDays(start, 7);

  const [mandatoryBlocks, completions, dailyCompletions] = await Promise.all([
    prisma.scheduleBlock.findMany({ where: { userId, mandatory: true } }),
    prisma.blockCompletion.findMany({
      where: { userId, date: { gte: start, lt: end } },
    }),
    prisma.dailyCompletion.findMany({
      where: { userId, date: { gte: start, lt: end } },
    }),
  ]);

  const completionSet = new Set(
    completions.map((item) => `${item.scheduleBlockId}-${startOfDay(item.date).toISOString()}`),
  );

  const missedByCategory: Record<string, number> = {};
  const missedByHour: Record<number, number> = {};

  for (let dayOffset = 0; dayOffset < 7; dayOffset += 1) {
    const date = addDays(start, dayOffset);
    const dateKey = startOfDay(date).toISOString();
    for (const block of mandatoryBlocks) {
      const key = `${block.id}-${dateKey}`;
      if (!completionSet.has(key)) {
        missedByCategory[block.category] = (missedByCategory[block.category] ?? 0) + 1;
        const hour = Math.floor(block.startTime / 60);
        missedByHour[hour] = (missedByHour[hour] ?? 0) + 1;
      }
    }
  }

  const mostSkippedHour = Object.entries(missedByHour).sort((a, b) => b[1] - a[1])[0];
  const mostSkippedHourValue = mostSkippedHour ? Number(mostSkippedHour[0]) : 0;

  const completedThisWeek = dailyCompletions.filter((item) => item.completedAt).length;
  const lastWeekStart = addDays(start, -7);
  const lastWeekEnd = start;
  const lastWeekCompleted = await prisma.dailyCompletion.count({
    where: {
      userId,
      completedAt: { not: null },
      date: { gte: lastWeekStart, lt: lastWeekEnd },
    },
  });

  const trend =
    completedThisWeek > lastWeekCompleted
      ? "improving"
      : completedThisWeek < lastWeekCompleted
        ? "declining"
        : "stable";

  return {
    missedByCategory,
    mostSkippedHour: mostSkippedHourValue,
    trend,
  };
};
