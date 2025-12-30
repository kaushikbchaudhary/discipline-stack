"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

import { dateKey } from "@/lib/time";
import { addTask, deleteTask, toggleTaskCompletion, updateTask } from "@/app/(app)/plan/actions";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type PlanTaskView = {
  id: string;
  title: string;
  description: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  durationMinutes: number | null;
  completed: boolean;
  incompleteReason: string | null;
};

type PlanDayView = {
  id: string;
  dayIndex: number;
  date: string;
  tasks: PlanTaskView[];
};

type PlanClientProps = {
  planName: string;
  startDate: string;
  days: PlanDayView[];
};

export default function PlanClient({ planName, startDate, days }: PlanClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTask, setActiveTask] = useState<PlanTaskView | null>(null);
  const [activeDay, setActiveDay] = useState<PlanDayView | null>(null);

  const monthOptions = useMemo(() => {
    const map = new Map<string, { key: string; label: string; order: number }>();
    days.forEach((day) => {
      const date = new Date(day.date);
      const year = date.getFullYear();
      const month = date.getMonth();
      const key = `${year}-${String(month + 1).padStart(2, "0")}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          label: `${MONTHS[month]} ${year}`,
          order: year * 100 + month,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => b.order - a.order);
  }, [days]);

  const currentMonthKey = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }, []);

  const [selectedMonth, setSelectedMonth] = useState(
    monthOptions.find((option) => option.key === currentMonthKey)?.key ??
      monthOptions[0]?.key ??
      currentMonthKey,
  );

  const visibleDays = useMemo(
    () =>
      days.filter((day) => {
        const date = new Date(day.date);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        return key === selectedMonth;
      }),
    [days, selectedMonth],
  );

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

  const closeModal = () => {
    setActiveTask(null);
    setActiveDay(null);
  };

  const isModalOpen = Boolean(activeTask || activeDay);
  const modalTitle = activeTask ? "Edit task" : "Add task";
  const modalDate = activeTask?.date ?? activeDay?.date ?? "";

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">{planName}</h2>
            <p className="text-sm text-muted">Starts {dateKey(new Date(startDate))}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-sm text-muted">Month</label>
            <select
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
              className="rounded-xl border border-[color:var(--border)] bg-white px-3 py-2 text-sm"
            >
              {monthOptions.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {visibleDays.length === 0 ? (
        <div className="card p-6">
          <p className="text-sm text-muted">No plan days for this month.</p>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visibleDays.map((day) => {
          const total = day.tasks.length;
          const done = day.tasks.filter((task) => task.completed).length;

          return (
            <div key={day.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-muted">Day {day.dayIndex + 1}</p>
                  <p className="text-lg font-semibold">{dateKey(new Date(day.date))}</p>
                </div>
                <span className="chip text-muted">
                  {done}/{total} done
                </span>
              </div>

              <div className="mt-3 space-y-2">
                {day.tasks.length === 0 ? (
                  <p className="text-sm text-muted">No tasks yet.</p>
                ) : (
                  <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
                    {day.tasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between gap-2 rounded-xl border border-[color:var(--border)] px-3 py-2"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTask(task);
                            setActiveDay(day);
                          }}
                          className="flex-1 text-left"
                        >
                          <p className="text-sm font-semibold">{task.title}</p>
                          <p className="text-xs text-muted">
                            {task.startTime && task.endTime
                              ? `${task.startTime}–${task.endTime}`
                              : "Time not set"}
                            {task.durationMinutes ? ` · ${task.durationMinutes} min` : ""}
                          </p>
                        </button>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleTaskToggle(task.id)}
                          className={`rounded-full px-2 py-1 text-xs font-semibold ${
                            task.completed
                              ? "bg-[color:var(--accent)] text-white"
                              : "border border-[color:var(--border)] text-muted"
                          }`}
                        >
                          {task.completed ? "Done" : "Mark"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setActiveTask(null);
                  setActiveDay(day);
                }}
                className="mt-4 w-full rounded-xl border border-[color:var(--border)] px-3 py-2 text-sm font-semibold"
              >
                Add task
              </button>
            </div>
          );
        })}
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-muted">{modalTitle}</p>
                <h2 className="text-2xl font-semibold">{modalDate ? dateKey(new Date(modalDate)) : ""}</h2>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full border border-[color:var(--border)] px-3 py-1 text-xs font-semibold"
              >
                Close
              </button>
            </div>

            <form
              onSubmit={(event: FormEvent<HTMLFormElement>) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);
                if (activeTask) {
                  startTransition(() => runAction(updateTask, formData, "Task updated."));
                } else {
                  startTransition(() => runAction(addTask, formData, "Task added."));
                }
                closeModal();
              }}
              className="mt-6 grid gap-4"
            >
              {activeTask ? <input type="hidden" name="id" value={activeTask.id} /> : null}
              <input type="hidden" name="date" value={modalDate} />

              <div>
                <label className="text-sm font-semibold">Title</label>
                <input
                  name="title"
                  defaultValue={activeTask?.title ?? ""}
                  required
                  className="mt-2 w-full rounded-xl border border-[color:var(--border)] bg-white px-3 py-2"
                />
              </div>

              <div>
                <label className="text-sm font-semibold">Description</label>
                <textarea
                  name="description"
                  defaultValue={activeTask?.description ?? ""}
                  rows={3}
                  className="mt-2 w-full rounded-xl border border-[color:var(--border)] bg-white px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-semibold">Start</label>
                  <input
                    name="startTime"
                    type="time"
                    defaultValue={activeTask?.startTime ?? ""}
                    className="mt-2 w-full rounded-xl border border-[color:var(--border)] bg-white px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold">End</label>
                  <input
                    name="endTime"
                    type="time"
                    defaultValue={activeTask?.endTime ?? ""}
                    className="mt-2 w-full rounded-xl border border-[color:var(--border)] bg-white px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold">Minutes</label>
                  <input
                    name="durationMinutes"
                    type="number"
                    min={15}
                    max={180}
                    defaultValue={activeTask?.durationMinutes ?? 30}
                    className="mt-2 w-full rounded-xl border border-[color:var(--border)] bg-white px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold">Reason if incomplete (optional)</label>
                <input
                  name="incompleteReason"
                  defaultValue={activeTask?.incompleteReason ?? ""}
                  className="mt-2 w-full rounded-xl border border-[color:var(--border)] bg-white px-3 py-2 text-sm"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                {activeTask ? (
                  <button
                    type="button"
                    onClick={() => {
                      const formData = new FormData();
                      formData.set("id", activeTask.id);
                      startTransition(() => runAction(deleteTask, formData, "Task deleted."));
                      closeModal();
                    }}
                    className="rounded-xl border border-[color:var(--border)] px-4 py-2 text-sm font-semibold"
                  >
                    Delete
                  </button>
                ) : null}
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-xl bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-white"
                >
                  {activeTask ? "Save changes" : "Add task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
