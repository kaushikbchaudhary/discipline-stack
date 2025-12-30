import { redirect } from "next/navigation";

import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getWeekStart } from "@/lib/time";
import ReviewClient from "@/app/(app)/review/ReviewClient";

export default async function ReviewPage() {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const weekStartDate = getWeekStart(new Date());

  const review = await prisma.weeklyReview.findUnique({
    where: { userId_weekStartDate: { userId: session.user.id, weekStartDate } },
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
      />
    </div>
  );
}
