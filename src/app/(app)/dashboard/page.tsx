import { redirect } from "next/navigation";

import { getServerAuthSession } from "@/lib/auth";
import {
  getBlockConsistency,
  getDailyCompletionStats,
  getOutputQualityStats,
  getRecoveryMetrics,
  getStreakMetrics,
  getTimeAllocation,
  getWeeklySummaries,
} from "@/lib/analytics";
import { dateKey } from "@/lib/time";
import ExecutionRing from "@/components/charts/ExecutionRing";
import SimpleBarChart from "@/components/charts/SimpleBarChart";
import StackedBarChart from "@/components/charts/StackedBarChart";

export default async function DashboardPage() {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  const [dailyStats, streaks, blockConsistency, outputStats, weeklySummaries, recovery, allocation] =
    await Promise.all([
      getDailyCompletionStats(userId, 30),
      getStreakMetrics(userId),
      getBlockConsistency(userId, 14),
      getOutputQualityStats(userId, 8),
      getWeeklySummaries(userId),
      getRecoveryMetrics(userId),
      getTimeAllocation(userId, 30),
    ]);

  const toDate = (value: Date | string) => new Date(value);

  const completedDays = dailyStats.filter((item) => item.status === "complete").length;
  const failureDays = dailyStats.filter((item) => item.status === "failure").length;
  const incompleteDays = dailyStats.filter((item) => item.status === "incomplete").length;

  const outputVolumeData = outputStats.weeks.map((week) => ({
    week: dateKey(toDate(week.weekStart)).slice(5),
    outputs: week.shallow + week.standard + week.deep,
  }));

  const outputDepthData = outputStats.weeks.map((week) => ({
    week: dateKey(toDate(week.weekStart)).slice(5),
    shallow: week.shallow,
    standard: week.standard,
    deep: week.deep,
  }));

  const allocationData = [
    { name: "Executed", value: allocation.executed },
    { name: "Missed", value: allocation.missed },
    { name: "Recovered", value: allocation.recovered },
  ];

  return (
    <div className="space-y-10">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-muted">Dashboard</p>
        <h1 className="text-3xl font-semibold">Progress & achievement</h1>
        <p className="text-sm text-muted">
          Consistency, momentum, recovery, and output quality without noise.
        </p>
      </div>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_1.9fr]">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Execution ring</h2>
            <span className="chip text-muted">Last 30 days</span>
          </div>
          <div className="relative mt-6">
            <ExecutionRing complete={completedDays} incomplete={incompleteDays} failure={failureDays} />
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-2xl font-semibold">{completedDays} / 30</p>
              <p className="text-xs text-muted">days executed</p>
            </div>
          </div>
          <div className="mt-4 space-y-2 text-sm text-muted">
            <p>Complete: {completedDays}</p>
            <p>Incomplete: {incompleteDays}</p>
            <p>Failure: {failureDays}</p>
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
                  : item.status === "failure"
                    ? "bg-amber-200"
                    : "bg-[color:var(--border)]";
              const title = `${dateKey(toDate(item.date))} · ${item.mandatoryCompletedCount}/${item.mandatoryTotalCount} mandatory · ${item.outputSummary}`;
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
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-sm bg-amber-200" /> Failure
            </span>
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
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

        <div className="card p-6">
          <h2 className="text-xl font-semibold">Failure & recovery</h2>
          <div className="mt-4 grid gap-3 text-sm text-muted">
            <p>Failure days: {recovery.failureCount}</p>
            <p>Recovery success rate: {recovery.recoveryRate}%</p>
            <p>Average recovery time: {recovery.avgRecoveryTime} days</p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Block completion heatmap</h2>
            <span className="chip text-muted">14 days</span>
          </div>
          <div className="mt-4 overflow-x-auto">
            <div className="min-w-[540px] space-y-4">
              {blockConsistency.categories.map((category) => (
                <div key={category} className="space-y-2">
                  <div className="grid grid-cols-[repeat(14,minmax(0,1fr))] gap-2">
                    {blockConsistency.days.map((day) => {
                      const intensity = day.byCategory[category] ?? 0;
                      const opacity = 0.2 + intensity * 0.8;
                      return (
                        <span
                          key={`${category}-${day.key}`}
                          title={`${category} · ${dateKey(toDate(day.date))} · ${Math.round(intensity * 100)}%`}
                          className="h-4 w-4 rounded-sm bg-[color:var(--accent)]"
                          style={{ opacity }}
                        />
                      );
                    })}
                  </div>
                  <span className="text-xs text-muted">{category}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-xl font-semibold">Time allocation</h2>
          <p className="mt-2 text-sm text-muted">Executed vs missed vs recovered.</p>
          <SimpleBarChart
            data={allocationData.map((item) => ({ name: item.name, value: item.value }))}
            xKey="name"
            barKey="value"
            color="#2f5d62"
          />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="card p-6">
          <h2 className="text-xl font-semibold">Output volume</h2>
          <SimpleBarChart data={outputVolumeData} xKey="week" barKey="outputs" color="#204245" />
        </div>
        <div className="card p-6">
          <h2 className="text-xl font-semibold">Output depth</h2>
          <StackedBarChart
            data={outputDepthData}
            xKey="week"
            series={[
              { key: "shallow", color: "#b7b0a5", label: "Shallow" },
              { key: "standard", color: "#6b8c8f", label: "Standard" },
              { key: "deep", color: "#2f5d62", label: "Deep" },
            ]}
          />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="card p-6">
          <h2 className="text-xl font-semibold">Output timeline</h2>
          <div className="mt-4 space-y-3">
            {outputStats.timeline.map((item) => (
              <div
                key={toDate(item.date).toISOString()}
                className="rounded-2xl border border-[color:var(--border)] px-4 py-3"
              >
                <p className="text-xs text-muted">{dateKey(toDate(item.date))}</p>
                <p className="text-sm font-semibold">
                  {item.outputType === "url" ? "URL" : "Text"}
                </p>
                <p className="text-xs text-muted">
                  {item.outputContent.slice(0, 140)}
                </p>
              </div>
            ))}
            {outputStats.timeline.length === 0 ? (
              <p className="text-sm text-muted">No outputs yet.</p>
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
                  <p>Most skipped block: {summary.mostSkippedBlock || "None"}</p>
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
