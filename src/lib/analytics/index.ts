import { unstable_cache } from "next/cache";

import { prisma } from "@/lib/prisma";
import { addDays, dateKey, getWeekStart, startOfDay } from "@/lib/time";

const DAY_MS = 24 * 60 * 60 * 1000;

const buildDateRange = (days: number) => {
  const today = startOfDay(new Date());
  const start = addDays(today, -(days - 1));
  return { start, end: addDays(today, 1) };
};

const toKey = (date: Date) => dateKey(startOfDay(date));

export const getDailyCompletionStats = unstable_cache(
  async (userId: string, days = 30) => {
    const { start, end } = buildDateRange(days);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { activeGoalId: true },
    });

    const [tasks, dailyCompletions, artifacts] = await Promise.all([
      prisma.task.findMany({
        where: { plan: { userId }, date: { gte: start, lt: end } },
      }),
      prisma.dailyCompletion.findMany({
        where: { userId, date: { gte: start, lt: end } },
      }),
      prisma.goalArtifact.findMany({
        where: {
          userId,
          goalId: user?.activeGoalId ?? undefined,
          date: { gte: start, lt: end },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const taskMap = new Map<string, { total: number; completed: number }>();
    tasks.forEach((task) => {
      const key = toKey(task.date);
      const entry = taskMap.get(key) ?? { total: 0, completed: 0 };
      entry.total += 1;
      if (task.completed) {
        entry.completed += 1;
      }
      taskMap.set(key, entry);
    });

    const dailyMap = new Map(dailyCompletions.map((item) => [toKey(item.date), item]));
    const artifactMap = new Map<string, string>();
    artifacts.forEach((artifact) => {
      const key = toKey(artifact.date);
      if (!artifactMap.has(key)) {
        artifactMap.set(key, artifact.content ?? artifact.fileUrl ?? "");
      }
    });

    const stats = Array.from({ length: days }).map((_, index) => {
      const date = addDays(start, index);
      const key = toKey(date);
      const daily = dailyMap.get(key);
      const totals = taskMap.get(key) ?? { total: 0, completed: 0 };
      const isComplete = Boolean(daily?.completedAt);
      const status = isComplete ? "complete" : "incomplete";

      return {
        date,
        key,
        status,
        mandatoryCompletedCount: totals.completed,
        mandatoryTotalCount: totals.total,
        outputSummary:
          artifactMap.get(key)?.slice(0, 120) ?? daily?.outputContent?.slice(0, 120) ?? "",
      };
    });

    return stats;
  },
  ["daily-completion-stats"],
  { revalidate: 300 },
);

export const getStreakMetrics = unstable_cache(
  async (userId: string) => {
    const completions = await prisma.dailyCompletion.findMany({
      where: { userId, completedAt: { not: null } },
      orderBy: { date: "asc" },
    });

    const dates = completions.map((item) => startOfDay(item.date));
    const dateSet = new Set(dates.map((date) => date.getTime()));

    let longest = 0;
    let current = 0;
    let streak = 0;

    for (let i = 0; i < dates.length; i += 1) {
      if (i === 0) {
        streak = 1;
      } else {
        const prev = dates[i - 1];
        const diff = dates[i].getTime() - prev.getTime();
        if (diff === DAY_MS) {
          streak += 1;
        } else if (diff > 0) {
          streak = 1;
        }
      }
      longest = Math.max(longest, streak);
    }

    let cursor = startOfDay(new Date());
    while (dateSet.has(cursor.getTime())) {
      current += 1;
      cursor = addDays(cursor, -1);
    }

    return { current, longest };
  },
  ["streak-metrics"],
  { revalidate: 300 },
);

export const getBlockConsistency = unstable_cache(
  async (userId: string, days = 14) => {
    const { start, end } = buildDateRange(days);
    const mandatoryBlocks = await prisma.scheduleBlock.findMany({
      where: { userId, mandatory: true },
    });

    const categories = Array.from(new Set(mandatoryBlocks.map((block) => block.category)));

    const completions = await prisma.blockCompletion.findMany({
      where: { userId, date: { gte: start, lt: end } },
    });

    const completionMap = new Map<string, Set<string>>();
    completions.forEach((item) => {
      const key = toKey(item.date);
      const set = completionMap.get(key) ?? new Set<string>();
      set.add(item.scheduleBlockId);
      completionMap.set(key, set);
    });

    const daysData = Array.from({ length: days }).map((_, index) => {
      const date = addDays(start, index);
      const key = toKey(date);
      const completedSet = completionMap.get(key) ?? new Set<string>();

      const byCategory: Record<string, number> = {};
      categories.forEach((category) => {
        const blocks = mandatoryBlocks.filter((block) => block.category === category);
        if (blocks.length === 0) {
          byCategory[category] = 0;
          return;
        }
        const completed = blocks.filter((block) => completedSet.has(block.id)).length;
        byCategory[category] = completed / blocks.length;
      });

      return { date, key, byCategory };
    });

    return { categories, days: daysData };
  },
  ["block-consistency"],
  { revalidate: 300 },
);

const classifyDepth = (outputType: string | null, content: string | null) => {
  if (!content) {
    return "shallow";
  }
  if (outputType === "URL" || outputType === "FILE") {
    return "standard";
  }
  const length = content.length;
  if (length >= 300) {
    return "deep";
  }
  if (length >= 120) {
    return "standard";
  }
  return "shallow";
};

export const getOutputQualityStats = unstable_cache(
  async (userId: string, weeks = 8) => {
    const end = addDays(startOfDay(new Date()), 1);
    const start = addDays(end, -(weeks * 7));

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { activeGoalId: true },
    });

    const outputs = await prisma.goalArtifact.findMany({
      where: {
        userId,
        goalId: user?.activeGoalId ?? undefined,
        date: { gte: start, lt: end },
      },
      orderBy: { date: "desc" },
    });

    const weekMap = new Map<string, { weekStart: Date; shallow: number; standard: number; deep: number }>();

    outputs.forEach((output) => {
      const weekStart = getWeekStart(output.date);
      const key = toKey(weekStart);
      const entry =
        weekMap.get(key) ?? { weekStart, shallow: 0, standard: 0, deep: 0 };
      const depth = classifyDepth(output.type, output.content ?? output.fileUrl ?? "");
      entry[depth] += 1;
      weekMap.set(key, entry);
    });

    const weeksList = Array.from({ length: weeks }).map((_, index) => {
      const weekStart = getWeekStart(addDays(end, -((index + 1) * 7)));
      const key = toKey(weekStart);
      const entry = weekMap.get(key) ?? { weekStart, shallow: 0, standard: 0, deep: 0 };
      return entry;
    });

    const timeline = outputs.slice(0, 20).map((output) => ({
      date: output.date,
      outputType: output.type,
      outputContent: output.content ?? output.fileUrl ?? "",
    }));

    return { weeks: weeksList.reverse(), timeline };
  },
  ["output-quality"],
  { revalidate: 300 },
);

export const getWeeklySummaries = unstable_cache(
  async (userId: string) => {
    const reviews = await prisma.weeklyReview.findMany({
      where: { userId },
      orderBy: { weekStartDate: "desc" },
      take: 8,
    });

    const summaries = await Promise.all(
      reviews.map(async (review) => {
        const weekStart = startOfDay(review.weekStartDate);
        const weekEnd = addDays(weekStart, 7);

        const [dailyCompletions, tasks] = await Promise.all([
          prisma.dailyCompletion.findMany({
            where: { userId, date: { gte: weekStart, lt: weekEnd } },
          }),
          prisma.task.findMany({
            where: { plan: { userId }, date: { gte: weekStart, lt: weekEnd } },
          }),
        ]);

        const completedCount = dailyCompletions.filter((item) => item.completedAt).length;
        const completionRate = Math.round((completedCount / 7) * 100);

        const tasksByDay = new Map<string, { total: number; completed: number }>();
        tasks.forEach((task) => {
          const key = toKey(task.date);
          const entry = tasksByDay.get(key) ?? { total: 0, completed: 0 };
          entry.total += 1;
          if (task.completed) {
            entry.completed += 1;
          }
          tasksByDay.set(key, entry);
        });

        let mostProductiveDay = "";
        let maxCompleted = -1;
        for (let i = 0; i < 7; i += 1) {
          const date = addDays(weekStart, i);
          const key = toKey(date);
          const entry = tasksByDay.get(key) ?? { total: 0, completed: 0 };
          if (entry.completed > maxCompleted) {
            maxCompleted = entry.completed;
            mostProductiveDay = dateKey(date);
          }
        }

        const quote = review.q2 || review.q1 || review.stopDoing || "";

        return {
          weekStart,
          completionRate,
          mostSkippedBlock: "",
          mostProductiveDay,
          quote,
        };
      }),
    );

    return summaries;
  },
  ["weekly-summaries"],
  { revalidate: 600 },
);

export const getRecoveryMetrics = unstable_cache(
  async (userId: string) => {
    const failures = await prisma.failureDay.findMany({
      where: { userId },
      orderBy: { date: "asc" },
    });

    const completions = await prisma.dailyCompletion.findMany({
      where: { userId, completedAt: { not: null } },
      orderBy: { date: "asc" },
    });

    const completionDates = completions.map((item) => startOfDay(item.date));

    let recovered = 0;
    let totalRecoveryTime = 0;

    failures.forEach((failure) => {
      const failureDate = startOfDay(failure.date);
      const nextCompletion = completionDates.find((date) => date.getTime() > failureDate.getTime());
      if (nextCompletion) {
        const diffDays = Math.ceil(
          (nextCompletion.getTime() - failureDate.getTime()) / DAY_MS,
        );
        if (diffDays <= 3) {
          recovered += 1;
        }
        totalRecoveryTime += diffDays;
      }
    });

    const failureCount = failures.length;
    const recoveryRate = failureCount === 0 ? 0 : Math.round((recovered / failureCount) * 100);
    const avgRecoveryTime = failureCount === 0 ? 0 : Math.round(totalRecoveryTime / failureCount);

    return {
      failureCount,
      recoveryRate,
      avgRecoveryTime,
    };
  },
  ["recovery-metrics"],
  { revalidate: 600 },
);

export const getTimeAllocation = unstable_cache(
  async (userId: string, days = 30) => {
    const { start, end } = buildDateRange(days);
    const mandatoryBlocks = await prisma.scheduleBlock.findMany({
      where: { userId, mandatory: true },
    });

    const totalSlots = mandatoryBlocks.length * days;
    const completions = await prisma.blockCompletion.count({
      where: { userId, date: { gte: start, lt: end } },
    });

    const resolvedDebt = await prisma.executionDebt.count({
      where: { userId, resolvedAt: { not: null }, createdAt: { gte: start, lt: end } },
    });

    const missed = Math.max(totalSlots - completions, 0);

    return {
      executed: completions,
      missed,
      recovered: resolvedDebt,
    };
  },
  ["time-allocation"],
  { revalidate: 600 },
);

export const getWeeklyTimeReality = unstable_cache(
  async (userId: string, weekStart: Date) => {
    const start = startOfDay(weekStart);
    const end = addDays(start, 7);
    const blocks = await prisma.scheduleBlock.findMany({ where: { userId, mandatory: true } });

    const plannedMinutes =
      blocks.reduce((sum, block) => sum + (block.endTime - block.startTime), 0) * 7;

    const completions = await prisma.blockCompletion.findMany({
      where: { userId, date: { gte: start, lt: end } },
      include: { scheduleBlock: true },
    });

    const executedMinutes = completions.reduce(
      (sum, item) => sum + (item.scheduleBlock.endTime - item.scheduleBlock.startTime),
      0,
    );

    const recoveredCount = await prisma.executionDebt.count({
      where: { userId, resolvedAt: { not: null, gte: start, lt: end } },
    });

    const recoveredMinutes = recoveredCount * 30;

    return {
      plannedMinutes,
      executedMinutes,
      recoveredMinutes,
    };
  },
  ["weekly-time-reality"],
  { revalidate: 600 },
);
