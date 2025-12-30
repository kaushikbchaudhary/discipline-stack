import { redirect } from "next/navigation";

import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addDays, dateKey, startOfDay } from "@/lib/time";

export default async function TimelinePage() {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const today = startOfDay(new Date());
  const start = addDays(today, -29);

  const [completions, artifacts, plans] = await Promise.all([
    prisma.dailyCompletion.findMany({
      where: { userId: session.user.id, date: { gte: start } },
    }),
    prisma.goalArtifact.findMany({
      where: { userId: session.user.id, date: { gte: start } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.plan.findMany({
      where: { userId: session.user.id },
      orderBy: { startDate: "desc" },
      include: { tasks: true },
    }),
  ]);

  const completionMap = new Map(
    completions.map((item) => [startOfDay(item.date).getTime(), item]),
  );
  const artifactMap = new Map<number, string>();
  artifacts.forEach((artifact) => {
    const key = startOfDay(artifact.date).getTime();
    if (!artifactMap.has(key)) {
      artifactMap.set(key, artifact.content ?? artifact.fileUrl ?? "");
    }
  });

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
          const plan = plans.find((item) => {
            const startDate = startOfDay(item.startDate).getTime();
            const endDate = startDate + item.durationDays * 24 * 60 * 60 * 1000;
            return key >= startDate && key < endDate;
          });
          const plannedTasks =
            plan?.tasks.filter((task) => startOfDay(task.date).getTime() === key) ?? [];
          const status = completion?.completedAt ? "Complete" : "Incomplete";
          const statusColor = completion?.completedAt
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
