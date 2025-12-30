import { prisma } from "@/lib/prisma";
import { getWeekStart, startOfDay, addDays } from "@/lib/time";

export const getQuietWeek = async (userId: string, date = new Date()) => {
  const weekStart = getWeekStart(date);
  return prisma.quietWeek.findUnique({
    where: { userId_weekStartDate: { userId, weekStartDate: weekStart } },
  });
};

export const canEnableQuietWeek = async (userId: string, date = new Date()) => {
  const weekStart = getWeekStart(date);
  const windowStart = addDays(weekStart, -14);

  const recent = await prisma.quietWeek.findFirst({
    where: {
      userId,
      weekStartDate: { gte: windowStart, lt: weekStart },
    },
    orderBy: { weekStartDate: "desc" },
  });

  return !recent;
};

export const enableQuietWeek = async (userId: string, date = new Date()) => {
  const weekStart = getWeekStart(date);
  const existing = await getQuietWeek(userId, weekStart);
  if (existing) {
    return existing;
  }

  return prisma.quietWeek.create({
    data: { userId, weekStartDate: startOfDay(weekStart) },
  });
};
