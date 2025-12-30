import { redirect } from "next/navigation";

import { getServerAuthSession } from "@/lib/auth";
import {
  getDailyCompletionStats,
  getOutputQualityStats,
  getStreakMetrics,
  getWeeklySummaries,
} from "@/lib/analytics";
import { dateKey } from "@/lib/time";
import ExecutionRing from "@/components/charts/ExecutionRing";

export default async function DashboardPage() {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;
  const [dailyStats, streaks, outputStats, weeklySummaries] = await Promise.all([
    getDailyCompletionStats(userId, 30),
    getStreakMetrics(userId),
    getOutputQualityStats(userId, 8),
    getWeeklySummaries(userId),
  ]);

  const toDate = (value: Date | string) => new Date(value);

  const completedDays = dailyStats.filter((item) => item.status === "complete").length;
  const incompleteDays = dailyStats.filter((item) => item.status === "incomplete").length;

  return (
    <div className="space-y-10">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-muted">Dashboard</p>
        <h1 className="text-3xl font-semibold">Progress & achievement</h1>
        <p className="text-sm text-muted">
          Consistency, momentum, recovery, and artifact quality without noise.
        </p>
      </div>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_1.9fr]">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Execution ring</h2>
            <span className="chip text-muted">Last 30 days</span>
          </div>
          <div className="relative mt-6">
            <ExecutionRing
              complete={completedDays}
              incomplete={incompleteDays}
              failure={0}
            />
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-2xl font-semibold">{completedDays} / 30</p>
              <p className="text-xs text-muted">days executed</p>
            </div>
          </div>
          <div className="mt-4 space-y-2 text-sm text-muted">
            <p>Complete: {completedDays}</p>
            <p>Incomplete: {incompleteDays}</p>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Consistency timeline</h2>
            <span className="chip text-muted">30 days</span>
          </div>
          <div className="mt-4 grid grid-cols-[repeat(10,minmax(0,1fr))] gap-2 sm:grid-cols-[repeat(15,minmax(0,1fr))] lg:grid-cols-[repeat(30,minmax(0,1fr))]">
            {dailyStats.map((item) => {
              const color =
                item.status === "complete"
                  ? "bg-[color:var(--accent)]"
                  : "bg-[color:var(--border)]";
              const title = `${dateKey(toDate(item.date))} · ${item.mandatoryCompletedCount}/${item.mandatoryTotalCount} tasks · ${item.outputSummary}`;
              return (
                <div
                  key={item.key}
                  title={title}
                  className={`h-4 w-4 rounded-sm ${color}`}
                />
              );
            })}
          </div>
          <div className="mt-4 grid gap-2 text-xs text-muted sm:grid-cols-3">
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-sm bg-[color:var(--accent)]" /> Complete
            </span>
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-sm bg-[color:var(--border)]" /> Incomplete
            </span>
          </div>
        </div>
      </section>

      <section className="grid gap-6">
        <div className="card p-6">
          <h2 className="text-xl font-semibold">Execution streak</h2>
          <div className="mt-4 flex items-baseline justify-between">
            <div>
              <p className="text-sm text-muted">Current streak</p>
              <p className="text-3xl font-semibold">{streaks.current} days</p>
            </div>
            <div>
              <p className="text-sm text-muted">Longest streak</p>
              <p className="text-3xl font-semibold">{streaks.longest} days</p>
            </div>
          </div>
          {streaks.current === 0 ? (
            <p className="mt-3 text-sm text-muted">Recovery in progress.</p>
          ) : null}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="card p-6">
          <h2 className="text-xl font-semibold">Artifact timeline</h2>
          <div className="mt-4 space-y-3">
            {outputStats.timeline.map((item) => (
              <div
                key={toDate(item.date).toISOString()}
                className="rounded-2xl border border-[color:var(--border)] px-4 py-3"
              >
                <p className="text-xs text-muted">{dateKey(toDate(item.date))}</p>
                <p className="text-sm font-semibold">
                  {item.outputType === "URL" ? "URL" : "Text"}
                </p>
                <p className="text-xs text-muted">
                  {item.outputContent.slice(0, 140)}
                </p>
              </div>
            ))}
            {outputStats.timeline.length === 0 ? (
              <p className="text-sm text-muted">No artifacts yet.</p>
            ) : null}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-xl font-semibold">Weekly summaries</h2>
          <div className="mt-4 space-y-3">
            {weeklySummaries.map((summary) => (
              <div
                key={toDate(summary.weekStart).toISOString()}
                className="rounded-2xl border border-[color:var(--border)] px-4 py-3"
              >
                <p className="text-xs text-muted">Week of {dateKey(toDate(summary.weekStart))}</p>
                <div className="mt-2 grid gap-2 text-sm text-muted">
                  <p>Completion rate: {summary.completionRate}%</p>
                  <p>Most productive day: {summary.mostProductiveDay || ""}</p>
                </div>
                {summary.quote ? (
                  <p className="mt-2 text-xs text-muted">“{summary.quote}”</p>
                ) : null}
              </div>
            ))}
            {weeklySummaries.length === 0 ? (
              <p className="text-sm text-muted">No weekly reviews yet.</p>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
