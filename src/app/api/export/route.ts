import { NextResponse } from "next/server";

import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const [scheduleBlocks, plans, dailyCompletions, weeklyReviews, blockCompletions] =
    await Promise.all([
      prisma.scheduleBlock.findMany({ where: { userId } }),
      prisma.plan.findMany({
        where: { userId },
        include: { days: { include: { tasks: true } } },
      }),
      prisma.dailyCompletion.findMany({ where: { userId } }),
      prisma.weeklyReview.findMany({ where: { userId } }),
      prisma.blockCompletion.findMany({ where: { userId } }),
    ]);

  return NextResponse.json({
    scheduleBlocks,
    plans,
    dailyCompletions,
    weeklyReviews,
    blockCompletions,
  });
}
