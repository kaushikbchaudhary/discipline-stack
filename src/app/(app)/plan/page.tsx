import { redirect } from "next/navigation";

import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PlanClient from "@/app/(app)/plan/PlanClient";
import { getQuietWeek } from "@/lib/quiet";

export default async function PlanPage() {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const quietWeek = await getQuietWeek(session.user.id);
  if (quietWeek) {
    redirect("/today");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { pastEditUnlocked: true },
  });

  const plans = await prisma.plan.findMany({
    where: { userId: session.user.id },
    orderBy: { startDate: "desc" },
    include: { days: { include: { tasks: true }, orderBy: { dayIndex: "asc" } } },
  });

  const plan = plans[0];
  const changeWindowStart = new Date();
  changeWindowStart.setDate(changeWindowStart.getDate() - 7);
  const changeCount = plan
    ? await prisma.planChangeLog.count({
        where: { planId: plan.id, changeAt: { gte: changeWindowStart } },
      })
    : 0;
  const changeLimit = 5;

  if (!plan) {
    return (
      <div className="card p-6">
        <h1 className="text-2xl font-semibold">No plan yet</h1>
        <p className="mt-2 text-sm text-muted">Create a 30-day plan to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-muted">30-day tracker</p>
        <h1 className="text-3xl font-semibold">Daily execution tasks</h1>
        <p className="text-sm text-muted">
          Check tasks off, edit day details, and keep the non-negotiables in place.
        </p>
      </div>
      <PlanClient
        planId={plan.id}
        planName={plan.name}
        startDate={plan.startDate.toISOString()}
        pastEditUnlocked={user?.pastEditUnlocked ?? false}
        locked={plan.locked}
        changeCount={changeCount}
        changeLimit={changeLimit}
        days={plan.days.map((day) => ({
          id: day.id,
          dayIndex: day.dayIndex,
          date: day.date.toISOString(),
          tasks: day.tasks
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((task) => ({
              id: task.id,
              title: task.title,
              category: task.category,
              mandatory: task.mandatory,
              completedAt: task.completedAt ? task.completedAt.toISOString() : null,
            })),
        }))}
      />
    </div>
  );
}
