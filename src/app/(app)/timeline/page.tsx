"use client";

import { useEffect, useMemo, useState } from "react";

import { addDays, dateKey, startOfDay } from "@/lib/time";
import { apiFetch } from "@/lib/api";

type TaskRow = { id: string; title: string; date: string; completed: boolean };
type ArtifactRow = { date: string; content: string | null; url: string | null };
type CompletionRow = { date: string; output_content: string | null };

export default function TimelinePage() {
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [artifacts, setArtifacts] = useState<ArtifactRow[]>([]);
  const [completions, setCompletions] = useState<CompletionRow[]>([]);

  useEffect(() => {
    const load = async () => {
      const payload = await apiFetch<{
        tasks: TaskRow[];
        artifacts: ArtifactRow[];
        completions: CompletionRow[];
      }>("/timeline");
      setTasks(payload.tasks ?? []);
      setArtifacts(payload.artifacts ?? []);
      setCompletions(payload.completions ?? []);
    };
    load().catch(() => null);
  }, []);

  const completionMap = useMemo(() => {
    return new Map(
      completions.map((item) => [startOfDay(new Date(item.date)).getTime(), item]),
    );
  }, [completions]);

  const artifactMap = useMemo(() => {
    const map = new Map<number, string>();
    artifacts.forEach((artifact) => {
      const key = startOfDay(new Date(artifact.date)).getTime();
      if (!map.has(key)) {
        map.set(key, artifact.content ?? artifact.url ?? "");
      }
    });
    return map;
  }, [artifacts]);

  const taskMap = useMemo(() => {
    const map = new Map<number, TaskRow[]>();
    tasks.forEach((task) => {
      const key = startOfDay(new Date(task.date)).getTime();
      const existing = map.get(key) ?? [];
      existing.push(task);
      map.set(key, existing);
    });
    return map;
  }, [tasks]);

  const today = startOfDay(new Date());
  const start = addDays(today, -29);
  const days = Array.from({ length: 30 }).map((_, index) => addDays(start, index));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-muted">Timeline</p>
        <h1 className="text-3xl font-semibold">Execution history</h1>
        <p className="text-sm text-muted">Last 30 days, one line at a time.</p>
      </div>

      <div className="space-y-3">
        {days.map((day) => {
          const key = startOfDay(day).getTime();
          const completion = completionMap.get(key);
          const plannedTasks = taskMap.get(key) ?? [];
          const isComplete = Boolean(completion?.output_content);
          const status = isComplete ? "Complete" : "Incomplete";
          const statusColor = isComplete
            ? "bg-[color:var(--accent)] text-white"
            : "bg-[color:var(--border)]";

          return (
            <details key={key} className="card p-5">
              <summary className="flex cursor-pointer items-center justify-between">
                <div>
                  <p className="text-sm text-muted">{dateKey(day)}</p>
                  <p className="text-lg font-semibold">{status}</p>
                </div>
                <span className={`chip ${statusColor}`}>{status}</span>
              </summary>
              <div className="mt-4 space-y-2 text-sm text-muted">
                {plannedTasks.length > 0 ? (
                  <div>
                    <p className="font-semibold text-black">Planned tasks</p>
                    <ul className="mt-1 space-y-1">
                      {plannedTasks.map((task) => (
                        <li key={task.id} className="flex items-center justify-between gap-3">
                          <span>{task.title}</span>
                          <span className="text-xs text-muted">
                            {task.completed ? "Done" : "Pending"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {artifactMap.get(key) ? (
                  <div>
                    <p className="font-semibold text-black">Artifact</p>
                    <p>{artifactMap.get(key)}</p>
                  </div>
                ) : null}
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}
