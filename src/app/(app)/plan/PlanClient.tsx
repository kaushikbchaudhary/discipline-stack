"use client";

import { useTransition, type FormEvent } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

import { dateKey } from "@/lib/time";
import {
  addTask,
  deleteTask,
  regeneratePlan,
  togglePastEdit,
  togglePlanLock,
  toggleTaskCompletion,
  updateTask,
} from "@/app/(app)/plan/actions";

const categories = ["Health", "Income", "Creation", "Reflection", "Rest"];

type PlanDayView = {
  id: string;
  dayIndex: number;
  date: string;
  tasks: {
    id: string;
    title: string;
    category: string;
    mandatory: boolean;
    completedAt: string | null;
  }[];
};

type PlanClientProps = {
  planId: string;
  planName: string;
  startDate: string;
  pastEditUnlocked: boolean;
  locked: boolean;
  changeCount: number;
  changeLimit: number;
  days: PlanDayView[];
};

export default function PlanClient({
  planId,
  planName,
  startDate,
  pastEditUnlocked,
  locked,
  changeCount,
  changeLimit,
  days,
}: PlanClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const runAction = async (
    action: (formData: FormData) => Promise<{ ok: boolean; error?: string }>,
    formData: FormData,
    message: string,
  ) => {
    const result = await action(formData);
    if (result.ok) {
      toast.success(message);
      router.refresh();
    } else {
      toast.error(result.error || "Action failed.");
    }
  };

  const handleTaskToggle = (taskId: string) => {
    startTransition(async () => {
      const result = await toggleTaskCompletion(taskId);
      if (result.ok) {
        toast.success("Task updated.");
        router.refresh();
      } else {
        toast.error(result.error || "Action failed.");
      }
    });
  };

  const handleRegenerate = () => {
    startTransition(async () => {
      const result = await regeneratePlan();
      if (result.ok) {
        toast.success("New 30-day plan created.");
        router.refresh();
      } else {
        toast.error(result.error || "Action failed.");
      }
    });
  };

  const handleTogglePastEdit = () => {
    startTransition(async () => {
      const result = await togglePastEdit();
      if (result.ok) {
        toast.success(result.unlocked ? "Past days unlocked." : "Past days locked.");
        router.refresh();
      } else {
        toast.error(result.error || "Action failed.");
      }
    });
  };

  const handleToggleLock = () => {
    const reason = window.prompt("Why are you changing the plan lock?");
    if (!reason) {
      toast.error("Reason is required.");
      return;
    }
    const formData = new FormData();
    formData.set("planId", planId);
    formData.set("reason", reason);
    startTransition(async () => {
      const result = await togglePlanLock(formData);
      if (result.ok) {
        toast.success(result.locked ? "Plan locked." : "Plan unlocked.");
        router.refresh();
      } else {
        toast.error(result.error || "Action failed.");
      }
    });
  };

  return (
    <div className="space-y-8">
      <div className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">{planName}</h2>
            <p className="text-sm text-muted">Starts {dateKey(new Date(startDate))}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleRegenerate}
              className="rounded-full border border-[color:var(--border)] px-4 py-2 text-sm font-semibold"
            >
              Regenerate 30-day plan
            </button>
            <button
              type="button"
              onClick={handleToggleLock}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                locked
                  ? "bg-[color:var(--accent)] text-white"
                  : "border border-[color:var(--border)] text-black"
              }`}
            >
              {locked ? "Plan locked" : "Plan unlocked"}
            </button>
            <button
              type="button"
              onClick={handleTogglePastEdit}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                pastEditUnlocked
                  ? "bg-[color:var(--accent)] text-white"
                  : "border border-[color:var(--border)] text-black"
              }`}
            >
              {pastEditUnlocked ? "Past edits unlocked" : "Past edits locked"}
            </button>
          </div>
        </div>
        {changeCount >= changeLimit ? (
          <div className="mt-4 rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-alt)] px-4 py-3 text-sm text-muted">
            Drift warning: {changeCount} plan changes in the last 7 days.
          </div>
        ) : null}
        {locked ? (
          <p className="mt-3 text-sm text-muted">
            Plan is locked. Unlock to edit tasks or add new ones.
          </p>
        ) : null}
      </div>

      <div className="space-y-4">
        {days.map((day) => (
          <details key={day.id} className="card p-6">
            <summary className="flex cursor-pointer items-center justify-between">
              <div>
                <p className="text-sm text-muted">Day {day.dayIndex + 1}</p>
                <p className="text-lg font-semibold">{dateKey(new Date(day.date))}</p>
              </div>
              <span className="chip text-muted">{day.tasks.length} tasks</span>
            </summary>
            <div className="mt-4 space-y-4">
              {day.tasks.map((task) => (
                <div key={task.id} className="rounded-2xl border border-[color:var(--border)] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{task.title}</p>
                      <p className="text-xs text-muted">{task.category}</p>
                    </div>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleTaskToggle(task.id)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        task.completedAt
                          ? "bg-[color:var(--accent)] text-white"
                          : "border border-[color:var(--border)] text-muted"
                      }`}
                    >
                      {task.completedAt ? "Done" : "Mark done"}
                    </button>
                  </div>
                  <form
                    onSubmit={(event: FormEvent<HTMLFormElement>) => {
                      event.preventDefault();
                      const formData = new FormData(event.currentTarget);
                      startTransition(() => runAction(updateTask, formData, "Task updated."));
                    }}
                    className="mt-3 grid gap-3 md:grid-cols-2"
                  >
                    <input type="hidden" name="id" value={task.id} />
                    <input
                      name="title"
                      defaultValue={task.title}
                      disabled={locked}
                      className="rounded-xl border border-[color:var(--border)] bg-white px-3 py-2"
                    />
                    <select
                      name="category"
                      defaultValue={task.category}
                      disabled={locked}
                      className="rounded-xl border border-[color:var(--border)] bg-white px-3 py-2"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        name="mandatory"
                        type="checkbox"
                        defaultChecked={task.mandatory}
                        disabled={locked}
                      />
                      Mandatory
                    </label>
                    <input
                      name="reason"
                      placeholder="Reason for change"
                      required
                      disabled={locked}
                      className="rounded-xl border border-[color:var(--border)] bg-white px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (locked) {
                          toast.error("Plan is locked.");
                          return;
                        }
                        const reason = window.prompt("Reason for deleting this task:");
                        if (!reason) {
                          toast.error("Reason is required.");
                          return;
                        }
                        const formData = new FormData();
                        formData.set("id", task.id);
                        formData.set("reason", reason);
                        startTransition(() => runAction(deleteTask, formData, "Task deleted."));
                      }}
                      className="rounded-xl border border-[color:var(--border)] px-3 py-2 text-sm"
                    >
                      Remove
                    </button>
                    <button
                      type="submit"
                      disabled={isPending || locked}
                      className="rounded-xl bg-[color:var(--accent)] px-3 py-2 text-sm font-semibold text-white"
                    >
                      Save task
                    </button>
                  </form>
                </div>
              ))}

              <form
                onSubmit={(event: FormEvent<HTMLFormElement>) => {
                  event.preventDefault();
                  const formData = new FormData(event.currentTarget);
                  startTransition(() => runAction(addTask, formData, "Task added."));
                  event.currentTarget.reset();
                }}
                className="rounded-2xl border border-dashed border-[color:var(--border)] p-4"
              >
                <input type="hidden" name="planDayId" value={day.id} />
                <div className="grid gap-3 md:grid-cols-2">
                  <input
                    name="title"
                    required
                    disabled={locked}
                    placeholder="New task"
                    className="rounded-xl border border-[color:var(--border)] bg-white px-3 py-2"
                  />
                  <select
                    name="category"
                    disabled={locked}
                    className="rounded-xl border border-[color:var(--border)] bg-white px-3 py-2"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <label className="flex items-center gap-2 text-sm">
                    <input name="mandatory" type="checkbox" value="true" disabled={locked} />
                    Mandatory
                  </label>
                  <input
                    name="reason"
                    placeholder="Reason for change"
                    required
                    disabled={locked}
                    className="rounded-xl border border-[color:var(--border)] bg-white px-3 py-2 text-sm"
                  />
                  <button
                    type="submit"
                    disabled={isPending || locked}
                    className="rounded-xl bg-black px-3 py-2 text-sm font-semibold text-white"
                  >
                    Add task
                  </button>
                </div>
              </form>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
