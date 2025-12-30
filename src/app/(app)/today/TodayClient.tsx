"use client";

import { useEffect, useMemo, useState, useTransition, type FormEvent } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

import { minutesToTimeString } from "@/lib/time";
import {
  logResistance,
  markFailureDay,
  resolveDebt,
  saveDailyWinConfig,
  saveNextAction,
  saveOutput,
  toggleQuietWeek,
  toggleBlockCompletion,
  toggleTaskCompletion,
} from "@/app/(app)/today/actions";

type BlockView = {
  id: string;
  name: string;
  startTime: number;
  endTime: number;
  category: string;
  mandatory: boolean;
  completed: boolean;
};

type TaskView = {
  id: string;
  title: string;
  category: string;
  mandatory: boolean;
  completed: boolean;
};

type TodayClientProps = {
  blocks: BlockView[];
  tasks: TaskView[];
  outputType?: string | null;
  outputContent?: string | null;
  dailyWinConfig: {
    type: "block" | "output" | "either";
    blockId?: string | null;
  };
  nextActions: Record<string, string>;
  quietMode: boolean;
  debts: {
    id: string;
    missedDate: string;
    reason: string;
    createdAt: string;
  }[];
  failureDay: boolean;
  progress: {
    percent: number;
    doneCount: number;
    requiredCount: number;
  };
  status: {
    mandatoryBlocksDone: boolean;
    mandatoryTasksDone: boolean;
    outputReady: boolean;
    isComplete: boolean;
    hasDebt: boolean;
    isFailureDay: boolean;
    isSalvaged: boolean;
  };
  dailyWinSatisfied: boolean;
};

export default function TodayClient({
  blocks,
  tasks,
  outputType,
  outputContent,
  dailyWinConfig,
  nextActions,
  quietMode,
  debts,
  failureDay,
  progress,
  status,
  dailyWinSatisfied,
}: TodayClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [focusMode, setFocusMode] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    if (!focusMode) {
      return;
    }

    const warning = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", warning);
    return () => window.removeEventListener("beforeunload", warning);
  }, [focusMode]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const handleBlockToggle = (blockId: string) => {
    startTransition(async () => {
      const result = await toggleBlockCompletion(blockId);
      if (result.ok) {
        toast.success("Block updated.");
        router.refresh();
      } else {
        toast.error(result.error || "Could not update block.");
      }
    });
  };

  const handleTaskToggle = (taskId: string) => {
    startTransition(async () => {
      const result = await toggleTaskCompletion(taskId);
      if (result.ok) {
        toast.success("Task updated.");
        router.refresh();
      } else {
        toast.error(result.error || "Could not update task.");
      }
    });
  };

  const handleOutput = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await saveOutput(formData);
      if (result.ok) {
        toast.success("Output saved.");
        router.refresh();
      } else {
        toast.error(result.error || "Add a valid output entry.");
      }
    });
  };

  const handleWinConfig = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await saveDailyWinConfig(formData);
      if (result.ok) {
        toast.success("Daily Win updated.");
        router.refresh();
      } else {
        toast.error(result.error || "Could not update Daily Win.");
      }
    });
  };

  const handleNextAction = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await saveNextAction(formData);
      if (result.ok) {
        toast.success("Next action saved.");
        router.refresh();
      } else {
        toast.error(result.error || "Could not save next action.");
      }
    });
  };

  const handleResistance = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await logResistance(formData);
      if (result.ok) {
        toast.success("Resistance logged.");
        router.refresh();
      } else {
        toast.error(result.error || "Could not log resistance.");
      }
    });
  };

  const handleQuietMode = () => {
    startTransition(async () => {
      const result = await toggleQuietWeek();
      if (result.ok) {
        toast.success("Quiet Mode enabled for this week.");
        router.refresh();
      } else {
        toast.error(result.error || "Could not enable Quiet Mode.");
      }
    });
  };

  const handleResolveDebt = (debtId: string, resolutionType: "extra_time" | "extra_output") => {
    const resolutionNote = window.prompt("Note the action taken to resolve the debt:");
    if (!resolutionNote) {
      toast.error("Resolution note is required.");
      return;
    }

    startTransition(async () => {
      const result = await resolveDebt({ debtId, resolutionType, resolutionNote });
      if (result.ok) {
        toast.success("Debt resolved.");
        router.refresh();
      } else {
        toast.error(result.error || "Could not resolve debt.");
      }
    });
  };

  const handleFailureDay = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await markFailureDay(formData);
      if (result.ok) {
        toast.success("Failure day logged.");
        router.refresh();
      } else {
        toast.error(result.error || "Could not log failure day.");
      }
    });
  };

  const currentBlock = useMemo(() => {
    const minutes = now.getHours() * 60 + now.getMinutes();
    const active = blocks.find((block) => minutes >= block.startTime && minutes < block.endTime);
    if (active) {
      return { block: active, status: "active" as const };
    }
    const next = blocks.find((block) => minutes < block.startTime);
    if (next) {
      return { block: next, status: "upcoming" as const };
    }
    return null;
  }, [blocks, now]);

  const countdown = useMemo(() => {
    if (!currentBlock) {
      return "--:--";
    }
    const minutes = now.getHours() * 60 + now.getMinutes();
    const remaining = Math.max(currentBlock.block.endTime - minutes, 0);
    const hours = Math.floor(remaining / 60).toString().padStart(2, "0");
    const mins = (remaining % 60).toString().padStart(2, "0");
    return `${hours}:${mins}`;
  }, [currentBlock, now]);

  if (focusMode) {
    return (
      <section className="card p-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Focus mode</h2>
          <button
            type="button"
            onClick={() => setFocusMode(false)}
            className="rounded-full border border-[color:var(--border)] px-4 py-2 text-sm font-semibold"
          >
            Exit
          </button>
        </div>
        <div className="mt-6 space-y-4">
          {currentBlock ? (
            <div className="rounded-2xl border border-[color:var(--border)] p-5">
              <p className="text-sm text-muted">
                {minutesToTimeString(currentBlock.block.startTime)} -{" "}
                {minutesToTimeString(currentBlock.block.endTime)}
              </p>
              <p className="text-xl font-semibold">{currentBlock.block.name}</p>
              <p className="mt-2 text-sm text-muted">
                Status: {currentBlock.status === "active" ? "In progress" : "Upcoming"}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted">No active block right now.</p>
          )}
          <div className="rounded-2xl bg-[color:var(--bg-alt)] p-4 text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-muted">Time remaining</p>
            <p className="text-3xl font-semibold">{countdown}</p>
          </div>
          {currentBlock ? (
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleBlockToggle(currentBlock.block.id)}
              className="w-full rounded-xl bg-[color:var(--accent)] px-4 py-3 text-sm font-semibold text-white"
            >
              Complete block
            </button>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
      <section className="space-y-6">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Today</h2>
            <span className="chip text-muted">{progress.percent}% complete</span>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="text-muted">
              {progress.doneCount} of {progress.requiredCount} required steps finished.
            </span>
            <button
              type="button"
              onClick={() => setFocusMode(true)}
              className="rounded-full border border-[color:var(--border)] px-3 py-1 text-xs font-semibold"
            >
              Enter focus mode
            </button>
          </div>
          <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-[color:var(--bg-alt)]">
            <div
              className="h-full rounded-full bg-[color:var(--accent)] transition-all"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        </div>

        {debts.length > 0 ? (
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">Execution debt</h3>
              <span className="chip text-muted">{debts.length} open</span>
            </div>
            <p className="mt-2 text-sm text-muted">
              Resolve debt before today can be completed.
            </p>
            <div className="mt-4 space-y-3">
              {debts.map((debt) => (
                <div
                  key={debt.id}
                  className="rounded-2xl border border-[color:var(--border)] p-4"
                >
                  <p className="text-sm text-muted">
                    Missed {new Date(debt.missedDate).toDateString()}
                  </p>
                  <p className="text-base font-semibold">{debt.reason}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleResolveDebt(debt.id, "extra_time")}
                      className="rounded-xl bg-[color:var(--accent)] px-3 py-2 text-xs font-semibold text-white"
                    >
                      Resolve with +30 min execution
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleResolveDebt(debt.id, "extra_output")}
                      className="rounded-xl border border-[color:var(--border)] px-3 py-2 text-xs font-semibold"
                    >
                      Resolve with additional output
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Quiet Mode</h3>
            {quietMode ? <span className="chip text-muted">Active</span> : null}
          </div>
          <p className="mt-2 text-sm text-muted">
            Hide streaks and dashboards for the current week.
          </p>
          <button
            type="button"
            disabled={isPending || quietMode}
            onClick={handleQuietMode}
            className="mt-3 w-full rounded-xl border border-[color:var(--border)] px-4 py-2 text-sm font-semibold"
          >
            {quietMode ? "Quiet Mode enabled" : "Enable Quiet Mode"}
          </button>
        </div>

        <div className="card p-6">
          <h3 className="text-xl font-semibold">Daily Win</h3>
          <p className="mt-2 text-sm text-muted">
            One win counts as a salvaged day when the rest is incomplete.
          </p>
          <form onSubmit={handleWinConfig} className="mt-4 space-y-3">
            <div className="flex flex-wrap gap-3 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="winType"
                  value="output"
                  defaultChecked={dailyWinConfig.type === "output"}
                />
                Non-replaceable output
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="winType"
                  value="either"
                  defaultChecked={dailyWinConfig.type === "either"}
                />
                Income block or output
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="winType"
                  value="block"
                  defaultChecked={dailyWinConfig.type === "block"}
                />
                Mandatory block
              </label>
            </div>
            <select
              name="blockId"
              defaultValue={dailyWinConfig.blockId ?? ""}
              className="w-full rounded-xl border border-[color:var(--border)] bg-white px-3 py-2 text-sm"
            >
              <option value="">Select block</option>
              {blocks
                .filter((block) => block.mandatory)
                .map((block) => (
                  <option key={block.id} value={block.id}>
                    {block.name}
                  </option>
                ))}
            </select>
            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-xl border border-[color:var(--border)] px-4 py-2 text-sm font-semibold"
            >
              Save Daily Win
            </button>
          </form>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Timetable</h3>
            <span className="chip text-muted">Mandatory blocks need completion</span>
          </div>
          <div className="mt-4 space-y-3">
            {blocks.map((block) => (
              <div
                key={block.id}
                className={`rounded-2xl border border-[color:var(--border)] px-4 py-3 ${
                  block.completed ? "bg-[color:var(--bg-alt)]" : "bg-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted">
                      {minutesToTimeString(block.startTime)} - {minutesToTimeString(block.endTime)}
                    </p>
                    <p className="text-base font-semibold">{block.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {block.mandatory && (
                      <span className="chip text-xs text-muted">Mandatory</span>
                    )}
                    <span
                      className={`h-3 w-3 rounded-full ${
                        block.completed ? "bg-[color:var(--accent)]" : "bg-[color:var(--border)]"
                      }`}
                    />
                  </div>
                </div>
                <form onSubmit={handleNextAction} className="mt-3 flex flex-wrap gap-2">
                  <input type="hidden" name="blockId" value={block.id} />
                  <input
                    name="text"
                    defaultValue={nextActions[block.id] ?? ""}
                    maxLength={120}
                    placeholder="Next action"
                    disabled={now.getHours() * 60 + now.getMinutes() >= block.startTime}
                    className="flex-1 rounded-xl border border-[color:var(--border)] bg-white px-3 py-2 text-sm"
                  />
                  <button
                    type="submit"
                    disabled={
                      isPending || now.getHours() * 60 + now.getMinutes() >= block.startTime
                    }
                    className="rounded-xl border border-[color:var(--border)] px-3 py-2 text-xs font-semibold"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleBlockToggle(block.id)}
                    className="rounded-xl bg-[color:var(--accent)] px-3 py-2 text-xs font-semibold text-white"
                  >
                    {block.completed ? "Undo" : "Complete"}
                  </button>
                </form>
                {block.mandatory && !block.completed ? (
                  <form onSubmit={handleResistance} className="mt-2 flex flex-wrap gap-2">
                    <input type="hidden" name="blockId" value={block.id} />
                    <select
                      name="reason"
                      required
                      className="rounded-xl border border-[color:var(--border)] bg-white px-2 py-1 text-xs"
                    >
                      <option value="">Select reason</option>
                      <option value="TOO_TIRED">Too tired</option>
                      <option value="AVOIDANCE">Avoidance</option>
                      <option value="UNCLEAR_NEXT_STEP">Unclear next step</option>
                      <option value="EXTERNAL_INTERRUPTION">External interruption</option>
                      <option value="OVERPLANNED">Overplanned</option>
                    </select>
                    <button
                      type="submit"
                      disabled={isPending}
                      className="rounded-xl border border-[color:var(--border)] px-3 py-2 text-xs font-semibold"
                    >
                      Log resistance
                    </button>
                  </form>
                ) : null}
              </div>
            ))}
            {blocks.length === 0 ? (
              <p className="text-sm text-muted">No timetable blocks yet.</p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="card p-6">
          <h3 className="text-xl font-semibold">Today tasks</h3>
          <div className="mt-4 space-y-3">
            {tasks.map((task) => (
              <button
                key={task.id}
                type="button"
                disabled={isPending}
                onClick={() => handleTaskToggle(task.id)}
                className={`flex w-full items-start justify-between rounded-2xl border border-[color:var(--border)] px-4 py-3 text-left transition hover:border-[color:var(--accent)] ${
                  task.completed ? "bg-[color:var(--bg-alt)]" : "bg-white"
                }`}
              >
                <div>
                  <p className="text-base font-semibold">{task.title}</p>
                  <p className="text-xs text-muted">{task.category}</p>
                </div>
                <div className="flex items-center gap-2">
                  {task.mandatory && (
                    <span className="chip text-xs text-muted">Non-negotiable</span>
                  )}
                  <span
                    className={`h-3 w-3 rounded-full ${
                      task.completed ? "bg-[color:var(--accent)]" : "bg-[color:var(--border)]"
                    }`}
                  />
                </div>
              </button>
            ))}
            {tasks.length === 0 ? (
              <p className="text-sm text-muted">No tasks scheduled for today.</p>
            ) : null}
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-xl font-semibold">Non-replaceable output</h3>
          <p className="mt-2 text-sm text-muted">
            Use Problem / Decision / Outcome structure, or a real URL.
          </p>
          <form onSubmit={handleOutput} className="mt-4 space-y-3">
            <div className="flex gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="outputType"
                  value="text"
                  defaultChecked={!outputType || outputType === "text"}
                />
                Text
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="outputType"
                  value="url"
                  defaultChecked={outputType === "url"}
                />
                URL
              </label>
            </div>
            <textarea
              name="outputContent"
              defaultValue={outputContent ?? ""}
              rows={4}
              placeholder="Problem: ... Decision: ... Outcome: ..."
              className="w-full rounded-xl border border-[color:var(--border)] bg-white px-3 py-2"
            />
            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-xl bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[color:var(--accent-strong)] disabled:opacity-70"
            >
              Save output
            </button>
          </form>
        </div>

        <div className="card p-6">
          <h3 className="text-xl font-semibold">Completion checklist</h3>
          <div className="mt-3 space-y-2 text-sm text-muted">
            <p>Mandatory blocks: {status.mandatoryBlocksDone ? "Done" : "Pending"}</p>
            <p>Mandatory tasks: {status.mandatoryTasksDone ? "Done" : "Pending"}</p>
            <p>Output attached: {status.outputReady ? "Done" : "Pending"}</p>
            <p>Daily Win: {dailyWinSatisfied ? "Done" : "Pending"}</p>
            <p>Execution debt: {status.hasDebt ? "Pending" : "Clear"}</p>
            <p className="pt-2 text-base font-semibold text-black">
              Day status:{" "}
              {status.isFailureDay
                ? "Failure day"
                : status.isComplete
                  ? "Complete"
                  : status.isSalvaged
                    ? "Salvaged"
                    : "Incomplete"}
            </p>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-xl font-semibold">Failure day</h3>
          <p className="mt-2 text-sm text-muted">
            Use sparingly. Failure days do not create execution debt.
          </p>
          {failureDay ? (
            <p className="mt-3 text-sm text-muted">Failure day already logged for today.</p>
          ) : (
            <form onSubmit={handleFailureDay} className="mt-4 space-y-3">
              <textarea
                name="note"
                rows={3}
                required
                placeholder="Short reflection note"
                className="w-full rounded-xl border border-[color:var(--border)] bg-white px-3 py-2"
              />
              <button
                type="submit"
                disabled={isPending}
                className="w-full rounded-xl border border-[color:var(--border)] px-4 py-2 text-sm font-semibold"
              >
                Mark failure day
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
