"use client";

import { useEffect, useMemo, useState } from "react";

import { buildDefaultPlan, buildDefaultSchedule } from "@/lib/defaults";
import { dateKey, minutesToTimeString, startOfDay } from "@/lib/time";

const STORAGE_KEY = "execution-os-demo";

type DemoState = {
  blocks: {
    id: string;
    name: string;
    startTime: number;
    endTime: number;
    category: string;
    mandatory: boolean;
    completed: boolean;
  }[];
  tasks: {
    id: string;
    title: string;
    category: string;
    mandatory: boolean;
    completed: boolean;
  }[];
  outputContent: string;
};

const defaultState = (): DemoState => {
  const blocks = buildDefaultSchedule({
    wakeTime: "06:00",
    gymHours: 2,
    choresHours: 2,
    incomeHours: 3,
    nonReplaceableHours: 2,
    reflectionHours: 1,
  }).map((block) => ({
    id: crypto.randomUUID(),
    ...block,
    completed: false,
  }));

  const todayPlan = buildDefaultPlan(startOfDay(new Date()))[0];

  return {
    blocks,
    tasks: todayPlan.tasks.map((task) => ({
      id: crypto.randomUUID(),
      title: task.title,
      category: task.category,
      mandatory: task.mandatory,
      completed: false,
    })),
    outputContent: "",
  };
};

export default function DemoPage() {
  const [state, setState] = useState<DemoState | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setState(JSON.parse(stored));
    } else {
      const fresh = defaultState();
      setState(fresh);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    }
  }, []);

  useEffect(() => {
    if (state) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state]);

  const progress = useMemo(() => {
    if (!state) {
      return { percent: 0, doneCount: 0, requiredCount: 0 };
    }
    const requiredBlocks = state.blocks.filter((block) => block.mandatory);
    const requiredTasks = state.tasks.filter((task) => task.mandatory);
    const doneCount =
      requiredBlocks.filter((block) => block.completed).length +
      requiredTasks.filter((task) => task.completed).length +
      (state.outputContent ? 1 : 0);
    const requiredCount = requiredBlocks.length + requiredTasks.length + 1;
    const percent = requiredCount ? Math.round((doneCount / requiredCount) * 100) : 0;
    return { percent, doneCount, requiredCount };
  }, [state]);

  if (!state) {
    return null;
  }

  return (
    <div className="app-shell min-h-screen px-6 py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-muted">Demo mode</p>
            <h1 className="text-3xl font-semibold">{dateKey(new Date())}</h1>
          </div>
          <a
            href="/login"
            className="rounded-full border border-[color:var(--border)] px-4 py-2 text-sm font-semibold"
          >
            Back to login
          </a>
        </div>

        <div className="card p-6">
          <h2 className="text-xl font-semibold">Today progress</h2>
          <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-[color:var(--bg-alt)]">
            <div
              className="h-full rounded-full bg-[color:var(--accent)]"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-muted">
            {progress.doneCount} of {progress.requiredCount} required steps done.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="card p-6">
            <h3 className="text-xl font-semibold">Timetable</h3>
            <div className="mt-4 space-y-3">
              {state.blocks.map((block) => (
                <button
                  key={block.id}
                  type="button"
                  onClick={() =>
                    setState((prev) =>
                      prev
                        ? {
                            ...prev,
                            blocks: prev.blocks.map((item) =>
                              item.id === block.id
                                ? { ...item, completed: !item.completed }
                                : item,
                            ),
                          }
                        : prev,
                    )
                  }
                  className={`flex w-full items-center justify-between rounded-2xl border border-[color:var(--border)] px-4 py-3 ${
                    block.completed ? "bg-[color:var(--bg-alt)]" : "bg-white"
                  }`}
                >
                  <div>
                    <p className="text-xs text-muted">
                      {minutesToTimeString(block.startTime)} - {minutesToTimeString(block.endTime)}
                    </p>
                    <p className="font-semibold">{block.name}</p>
                  </div>
                  <span
                    className={`h-3 w-3 rounded-full ${
                      block.completed ? "bg-[color:var(--accent)]" : "bg-[color:var(--border)]"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="card p-6">
              <h3 className="text-xl font-semibold">Tasks</h3>
              <div className="mt-4 space-y-3">
                {state.tasks.map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() =>
                      setState((prev) =>
                        prev
                          ? {
                              ...prev,
                              tasks: prev.tasks.map((item) =>
                                item.id === task.id
                                  ? { ...item, completed: !item.completed }
                                  : item,
                              ),
                            }
                          : prev,
                      )
                    }
                    className={`flex w-full items-start justify-between rounded-2xl border border-[color:var(--border)] px-4 py-3 ${
                      task.completed ? "bg-[color:var(--bg-alt)]" : "bg-white"
                    }`}
                  >
                    <div>
                      <p className="font-semibold">{task.title}</p>
                      <p className="text-xs text-muted">{task.category}</p>
                    </div>
                    <span
                      className={`h-3 w-3 rounded-full ${
                        task.completed ? "bg-[color:var(--accent)]" : "bg-[color:var(--border)]"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="card p-6">
              <h3 className="text-xl font-semibold">Output</h3>
              <textarea
                value={state.outputContent}
                onChange={(event) =>
                  setState((prev) =>
                    prev ? { ...prev, outputContent: event.target.value } : prev,
                  )
                }
                rows={4}
                placeholder="Paste a link or describe output"
                className="mt-3 w-full rounded-xl border border-[color:var(--border)] bg-white px-3 py-2"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
