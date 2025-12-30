import { NextResponse } from "next/server";

import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const [
    scheduleBlocks,
    plans,
    dailyCompletions,
    weeklyReviews,
    blockCompletions,
    executionDebts,
    failureDays,
    planChangeLogs,
    weeklyInsights,
    dailyWins,
    blockResistances,
    nextActions,
    quietWeeks,
  ] = await Promise.all([
    prisma.scheduleBlock.findMany({ where: { userId } }),
    prisma.plan.findMany({
      where: { userId },
      include: { days: { include: { tasks: true } } },
    }),
    prisma.dailyCompletion.findMany({ where: { userId } }),
    prisma.weeklyReview.findMany({ where: { userId } }),
    prisma.blockCompletion.findMany({ where: { userId } }),
    prisma.executionDebt.findMany({ where: { userId } }),
    prisma.failureDay.findMany({ where: { userId } }),
    prisma.planChangeLog.findMany({ where: { userId } }),
    prisma.weeklyInsights.findMany({ where: { userId } }),
    prisma.dailyWin.findMany({ where: { userId } }),
    prisma.blockResistance.findMany({ where: { userId } }),
    prisma.nextAction.findMany({ where: { userId } }),
    prisma.quietWeek.findMany({ where: { userId } }),
  ]);

  return NextResponse.json({
    scheduleBlocks,
    plans,
    dailyCompletions,
    weeklyReviews,
    blockCompletions,
    executionDebts,
    failureDays,
    planChangeLogs,
    weeklyInsights,
    dailyWins,
    blockResistances,
    nextActions,
    quietWeeks,
  });
}
