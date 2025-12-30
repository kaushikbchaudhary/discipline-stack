"use client";

import { useTransition, type FormEvent } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

import { minutesToTimeString } from "@/lib/time";
import { saveOutput, toggleBlockCompletion, toggleTaskCompletion } from "@/app/(app)/today/actions";

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
  };
};

export default function TodayClient({
  blocks,
  tasks,
  outputType,
  outputContent,
  progress,
  status,
}: TodayClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

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

  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
      <section className="space-y-6">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Today</h2>
            <span className="chip text-muted">{progress.percent}% complete</span>
          </div>
          <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-[color:var(--bg-alt)]">
            <div
              className="h-full rounded-full bg-[color:var(--accent)] transition-all"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <div className="mt-3 text-sm text-muted">
            {progress.doneCount} of {progress.requiredCount} required steps finished.
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Timetable</h3>
            <span className="chip text-muted">Mandatory blocks need completion</span>
          </div>
          <div className="mt-4 space-y-3">
            {blocks.map((block) => (
              <button
                key={block.id}
                type="button"
                disabled={isPending}
                onClick={() => handleBlockToggle(block.id)}
                className={`flex w-full items-center justify-between rounded-2xl border border-[color:var(--border)] px-4 py-3 text-left transition hover:border-[color:var(--accent)] ${
                  block.completed ? "bg-[color:var(--bg-alt)]" : "bg-white"
                }`}
              >
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
              </button>
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
            Add a text note or a URL to complete today.
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
              placeholder="Paste a link or describe your output."
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
            <p className="pt-2 text-base font-semibold text-black">
              Day status: {status.isComplete ? "Complete" : "Incomplete"}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
