"use client";

import { useEffect, useMemo, useState } from "react";

import PlanClient from "@/app/(app)/plan/PlanClient";
import { dateKey } from "@/lib/time";
import { apiFetch } from "@/lib/api";

type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  completed: boolean;
  incomplete_reason: string | null;
};
type PlanDayRow = {
  id: string;
  date: string;
  day_index: number;
};

export default function PlanPage() {
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [range, setRange] = useState(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { start, end };
  });

  useEffect(() => {
    const load = async () => {
      const payload = await apiFetch<{ tasks: TaskRow[]; days: PlanDayRow[] }>(
        `/plan?start=${dateKey(range.start)}&end=${dateKey(range.end)}`,
      );
      setTasks(payload.tasks ?? []);
      const daysByDate = new Map(
        (payload.days ?? []).map((day) => [dateKey(new Date(day.date)), day]),
      );
      setDayLookup(daysByDate);
    };
    load().catch(() => null);
  }, [range]);

  const [dayLookup, setDayLookup] = useState<Map<string, PlanDayRow>>(new Map());

  const dayMap = useMemo(() => {
    const map = new Map<string, TaskRow[]>();
    tasks.forEach((task) => {
      const key = dateKey(new Date(task.date));
      const existing = map.get(key) ?? [];
      existing.push(task);
      map.set(key, existing);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [tasks]);

  if (tasks.length === 0) {
    return (
      <div className="card p-6">
        <h1 className="text-2xl font-semibold">No plan yet</h1>
        <p className="mt-2 text-sm text-muted">Create a 30-day plan to get started.</p>
        <a
          href="/plan/import"
          className="mt-4 inline-flex rounded-xl border border-[color:var(--border)] px-3 py-2 text-xs font-semibold"
        >
          Import plan
        </a>
      </div>
    );
  }

  const earliest = dayMap[0]?.[0] ? new Date(dayMap[0][0]) : new Date();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-muted">30-day plan</p>
        <h1 className="text-3xl font-semibold">Daily tasks</h1>
        <p className="text-sm text-muted">
          Click a day to view tasks, mark done, or edit.
        </p>
        <a
          href="/plan/import"
          className="mt-3 inline-flex rounded-xl border border-[color:var(--border)] px-3 py-2 text-xs font-semibold"
        >
          AI Plan Import
        </a>
      </div>
      <PlanClient
        planName="All plans"
        startDate={earliest.toISOString()}
        days={dayMap.map(([key, dayTasks]) => {
          const date = new Date(key);
          const day = dayLookup.get(key);
          return {
            id: day?.id ?? key,
            dayIndex: day?.day_index ?? date.getDate() - 1,
            date: date.toISOString(),
            tasks: dayTasks.map((task) => ({
              id: task.id,
              title: task.title,
              description: task.description ?? "",
              date: task.date,
              startTime: task.start_time,
              endTime: task.end_time,
              durationMinutes: task.duration_minutes,
              completed: task.completed,
              incompleteReason: task.incomplete_reason,
            })),
          };
        })}
      />
    </div>
  );
}
