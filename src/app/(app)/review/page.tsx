import { redirect } from "next/navigation";

import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getWeekStart } from "@/lib/time";
import { computeWeeklyInsights } from "@/lib/insights";
import { getWeeklyTimeReality } from "@/lib/analytics";
import ReviewClient from "@/app/(app)/review/ReviewClient";
import { getQuietWeek } from "@/lib/quiet";

export default async function ReviewPage() {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const quietWeek = await getQuietWeek(session.user.id);
  if (quietWeek) {
    redirect("/today");
  }

  const weekStartDate = getWeekStart(new Date());

  const review = await prisma.weeklyReview.findUnique({
    where: { userId_weekStartDate: { userId: session.user.id, weekStartDate } },
  });

  const insights = await computeWeeklyInsights(session.user.id, weekStartDate);
  const timeReality = await getWeeklyTimeReality(session.user.id, weekStartDate);

  await prisma.weeklyInsights.upsert({
    where: { userId_weekStartDate: { userId: session.user.id, weekStartDate } },
    create: {
      userId: session.user.id,
      weekStartDate,
      missedByCategory: JSON.stringify(insights.missedByCategory),
      mostSkippedHour: insights.mostSkippedHour,
      trend: insights.trend,
    },
    update: {
      missedByCategory: JSON.stringify(insights.missedByCategory),
      mostSkippedHour: insights.mostSkippedHour,
      trend: insights.trend,
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-muted">Weekly review</p>
        <h1 className="text-3xl font-semibold">Sunday reset</h1>
        <p className="text-sm text-muted">Capture lessons and remove noise for next week.</p>
      </div>
      <ReviewClient
        q1={review?.q1}
        q2={review?.q2}
        q3={review?.q3}
        q4={review?.q4}
        stopDoing={review?.stopDoing}
        resistanceBlock={review?.resistanceBlock}
        locked={Boolean(review)}
        insights={insights}
        timeReality={timeReality}
      />
    </div>
  );
}
