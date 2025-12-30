import { redirect } from "next/navigation";

import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addDays, dateKey, startOfDay } from "@/lib/time";
import { calculateStreak, completionRate } from "@/lib/stats";

export default async function ProgressPage() {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const today = startOfDay(new Date());
  const since = addDays(today, -29);

  const completions = await prisma.dailyCompletion.findMany({
    where: {
      userId: session.user.id,
      completedAt: { not: null },
      date: { gte: since },
    },
    orderBy: { date: "desc" },
  });

  const streak = calculateStreak(completions.map((item) => item.date));
  const rate = completionRate(completions.map((item) => item.date));

  const lastSevenDays = Array.from({ length: 7 }).map((_, index) => {
    const date = addDays(today, -index);
    const complete = completions.some(
      (item) => startOfDay(item.date).getTime() === startOfDay(date).getTime(),
    );
    return { date, complete };
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-muted">Progress</p>
        <h1 className="text-3xl font-semibold">Execution trend</h1>
        <p className="text-sm text-muted">Track streaks and completion rate.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card p-6">
          <p className="text-sm text-muted">Current streak</p>
          <p className="mt-2 text-4xl font-semibold">{streak} days</p>
        </div>
        <div className="card p-6">
          <p className="text-sm text-muted">Last 7 days completion</p>
          <p className="mt-2 text-4xl font-semibold">{rate}%</p>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-xl font-semibold">Last 7 days</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {lastSevenDays.map((item) => (
            <div
              key={item.date.toISOString()}
              className="flex items-center justify-between rounded-2xl border border-[color:var(--border)] px-4 py-3"
            >
              <span className="text-sm text-muted">{dateKey(item.date)}</span>
              <span
                className={`chip ${item.complete ? "bg-[color:var(--accent)] text-white" : "text-muted"}`}
              >
                {item.complete ? "Complete" : "Incomplete"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
