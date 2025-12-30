import { redirect } from "next/navigation";

import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { refreshDailyCompletion } from "@/lib/progress";
import { dateKey, startOfDay } from "@/lib/time";
import TodayClient from "@/app/(app)/today/TodayClient";

export default async function TodayPage() {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;
  const today = startOfDay(new Date());

  const [daily, plans] = await Promise.all([
    prisma.dailyCompletion.findUnique({
      where: { userId_date: { userId, date: today } },
    }),
    prisma.plan.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { tasks: true },
    }),
  ]);

  const plan =
    plans.find((item) =>
      item.tasks.some((task) => startOfDay(task.date).getTime() === today.getTime()),
    ) ?? plans[0];

  const completionState = await refreshDailyCompletion(userId, today);

  const tasks =
    plan?.tasks
      .filter((task) => startOfDay(task.date).getTime() === today.getTime())
      .map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description ?? "",
        startTime: task.startTime ?? null,
        endTime: task.endTime ?? null,
        durationMinutes: task.durationMinutes ?? null,
        completed: task.completed,
      })) ?? [];

  const doneTasks = tasks.filter((task) => task.completed).length;
  const outputReady = Boolean(daily?.outputType && daily?.outputContent);
  const totalCount = tasks.length + 1;
  const doneCount = doneTasks + (outputReady ? 1 : 0);
  const percent = totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-muted">Today</p>
        <h1 className="text-3xl font-semibold">{dateKey(today)}</h1>
        <p className="text-sm text-muted">{tasks.length} tasks planned</p>
      </div>

      <TodayClient
        tasks={tasks}
        outputType={daily?.outputType}
        outputContent={daily?.outputContent}
        progress={{ percent, doneCount, totalCount }}
        status={{ outputReady, isComplete: completionState.isComplete }}
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
