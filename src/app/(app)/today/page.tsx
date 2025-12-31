"use client";

import { useEffect, useMemo, useState } from "react";

import { dateKey, startOfDay } from "@/lib/time";
import TodayClient from "@/app/(app)/today/TodayClient";
import { apiFetch } from "@/lib/api";

type TaskView = {
  id: string;
  title: string;
  description: string;
  startTime: string | null;
  endTime: string | null;
  durationMinutes: number | null;
  completed: boolean;
};

type TodayPayload = {
  tasks: {
    id: string;
    title: string;
    description: string | null;
    start_time: string;
    end_time: string;
    duration_minutes: number;
    completed: boolean;
  }[];
  completion: { output_type: string | null; output_content: string | null } | null;
};

export default function TodayPage() {
  const today = startOfDay(new Date());
  const [tasks, setTasks] = useState<TaskView[]>([]);
  const [outputType, setOutputType] = useState<string | null>(null);
  const [outputContent, setOutputContent] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const payload = await apiFetch<TodayPayload>(`/today?date=${dateKey(today)}`);
      const mapped =
        payload.tasks?.map((task) => ({
          id: task.id,
          title: task.title,
          description: task.description ?? "",
          startTime: task.start_time ?? null,
          endTime: task.end_time ?? null,
          durationMinutes: task.duration_minutes ?? null,
          completed: task.completed,
        })) ?? [];
      setTasks(mapped);
      setOutputType(payload.completion?.output_type ?? null);
      setOutputContent(payload.completion?.output_content ?? null);
    };
    load().catch(() => null);
  }, [today]);

  const progress = useMemo(() => {
    const doneTasks = tasks.filter((task) => task.completed).length;
    const outputReady = Boolean(outputType && outputContent);
    const totalCount = tasks.length + 1;
    const doneCount = doneTasks + (outputReady ? 1 : 0);
    const percent = totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100);
    return { percent, doneCount, totalCount, outputReady };
  }, [tasks, outputType, outputContent]);

  const isComplete = progress.outputReady && tasks.length > 0 && tasks.every((task) => task.completed);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-muted">Today</p>
        <h1 className="text-3xl font-semibold">{dateKey(today)}</h1>
        <p className="text-sm text-muted">{tasks.length} tasks planned</p>
      </div>

      <TodayClient
        tasks={tasks}
        outputType={outputType}
        outputContent={outputContent}
        progress={{ percent: progress.percent, doneCount: progress.doneCount, totalCount: progress.totalCount }}
        status={{ outputReady: progress.outputReady, isComplete }}
      />

      {tasks.length === 0 ? (
        <div className="card p-6">
          <h3 className="text-xl font-semibold">No tasks for today</h3>
          <p className="mt-2 text-sm text-muted">
            Import or build your plan to see daily tasks here.
          </p>
          <a
            href="/plan/import"
            className="mt-4 inline-flex rounded-xl border border-[color:var(--border)] px-4 py-2 text-sm font-semibold"
          >
            Import plan
          </a>
        </div>
      ) : null}
    </div>
  );
}
