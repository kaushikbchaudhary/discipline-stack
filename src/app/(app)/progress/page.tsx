"use client";

import { useEffect, useMemo, useState } from "react";

import { dateKey } from "@/lib/time";
import { apiFetch } from "@/lib/api";

type DailyStat = {
  date: string;
  status: "complete" | "incomplete";
};

export default function ProgressPage() {
  const [dailyStats, setDailyStats] = useState<DailyStat[]>([]);
  const [streaks, setStreaks] = useState({ current: 0, longest: 0 });

  useEffect(() => {
    const load = async () => {
      const payload = await apiFetch<{ dailyStats: DailyStat[]; streaks: { current: number; longest: number } }>(
        "/dashboard",
      );
      setDailyStats(payload.dailyStats ?? []);
      setStreaks(payload.streaks ?? { current: 0, longest: 0 });
    };
    load().catch(() => null);
  }, []);

  const lastSeven = useMemo(() => dailyStats.slice(-7), [dailyStats]);
  const completionRate = useMemo(() => {
    if (lastSeven.length === 0) {
      return 0;
    }
    const completed = lastSeven.filter((item) => item.status === "complete").length;
    return Math.round((completed / lastSeven.length) * 100);
  }, [lastSeven]);

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
          <p className="mt-2 text-4xl font-semibold">{streaks.current} days</p>
        </div>
        <div className="card p-6">
          <p className="text-sm text-muted">Last 7 days completion</p>
          <p className="mt-2 text-4xl font-semibold">{completionRate}%</p>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-xl font-semibold">Last 7 days</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {lastSeven.map((item) => (
            <div
              key={item.date}
              className="flex items-center justify-between rounded-2xl border border-[color:var(--border)] px-4 py-3"
            >
              <span className="text-sm text-muted">{dateKey(new Date(item.date))}</span>
              <span
                className={`chip ${item.status === "complete" ? "bg-[color:var(--accent)] text-white" : "text-muted"}`}
              >
                {item.status === "complete" ? "Complete" : "Incomplete"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
