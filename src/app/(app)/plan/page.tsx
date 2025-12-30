import { redirect } from "next/navigation";

import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PlanClient from "@/app/(app)/plan/PlanClient";
import { dateKey } from "@/lib/time";

export default async function PlanPage() {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const tasks = await prisma.task.findMany({
    where: { plan: { userId: session.user.id } },
    orderBy: { date: "asc" },
  });

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

  const dayMap = new Map<string, typeof tasks>();
  tasks.forEach((task) => {
    const key = dateKey(task.date);
    const existing = dayMap.get(key) ?? [];
    existing.push(task);
    dayMap.set(key, existing);
  });

  const dayEntries = Array.from(dayMap.entries()).sort(([a], [b]) => a.localeCompare(b));
  const earliest = dayEntries[0]?.[1]?.[0]?.date ?? new Date();

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
        days={dayEntries.map(([key, dayTasks]) => {
          const date = new Date(key);
          return {
            id: key,
            dayIndex: date.getDate() - 1,
            date: date.toISOString(),
            tasks: dayTasks.map((task) => ({
              id: task.id,
              title: task.title,
              description: task.description ?? "",
              date: task.date.toISOString(),
              startTime: task.startTime ?? null,
              endTime: task.endTime ?? null,
              durationMinutes: task.durationMinutes ?? null,
              completed: task.completed,
              incompleteReason: task.incompleteReason ?? null,
            })),
          };
        })}
      />
    </div>
  );
}
