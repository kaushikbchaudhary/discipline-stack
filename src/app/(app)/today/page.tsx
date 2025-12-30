import { redirect } from "next/navigation";

import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { refreshDailyCompletion } from "@/lib/progress";
import { ensureDebtForMissedDay, getUnresolvedDebt } from "@/lib/debt";
import { dateKey, startOfDay } from "@/lib/time";
import TodayClient from "@/app/(app)/today/TodayClient";

export default async function TodayPage() {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;
  const today = startOfDay(new Date());
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  await ensureDebtForMissedDay(userId, yesterday);

  const [blocks, blockCompletions, daily, plans, failureDay, debts] = await Promise.all([
    prisma.scheduleBlock.findMany({
      where: { userId },
      orderBy: { startTime: "asc" },
    }),
    prisma.blockCompletion.findMany({
      where: { userId, date: today },
    }),
    prisma.dailyCompletion.findUnique({
      where: { userId_date: { userId, date: today } },
    }),
    prisma.plan.findMany({
      where: { userId },
      orderBy: { startDate: "desc" },
      include: { days: { include: { tasks: true } } },
    }),
    prisma.failureDay.findUnique({
      where: { userId_date: { userId, date: today } },
    }),
    getUnresolvedDebt(userId),
  ]);

  const plan = plans.find((item) => {
    const start = startOfDay(item.startDate).getTime();
    const end = start + item.durationDays * 24 * 60 * 60 * 1000;
    return today.getTime() >= start && today.getTime() < end;
  });

  const planDay = plan?.days.find(
    (day) => startOfDay(day.date).getTime() === today.getTime(),
  );

  const completionState = await refreshDailyCompletion(userId, today);

  const completedBlockIds = new Set(blockCompletions.map((item) => item.scheduleBlockId));
  const mandatoryBlocks = blocks.filter((block) => block.mandatory);
  const mandatoryTasks = planDay?.tasks.filter((task) => task.mandatory) ?? [];
  const mandatoryBlocksDone = mandatoryBlocks.every((block) =>
    completedBlockIds.has(block.id),
  );
  const mandatoryTasksDone = mandatoryTasks.every((task) => task.completedAt);
  const outputReady = Boolean(daily?.outputContent && daily?.outputType);
  const debtGate = debts.length > 0;
  const doneCount =
    mandatoryBlocks.filter((block) => completedBlockIds.has(block.id)).length +
    mandatoryTasks.filter((task) => task.completedAt).length +
    (outputReady ? 1 : 0) +
    (debtGate ? 0 : 1);
  const requiredCount = mandatoryBlocks.length + mandatoryTasks.length + 1 + (debtGate ? 1 : 0);
  const percent = requiredCount === 0 ? 0 : Math.round((doneCount / requiredCount) * 100);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-muted">Today view</p>
          <h1 className="text-3xl font-semibold">{dateKey(today)}</h1>
          <p className="text-sm text-muted">
            {blocks.length} blocks scheduled · {planDay?.tasks.length ?? 0} tasks
          </p>
        </div>
        <div className="card-muted rounded-2xl border border-[color:var(--border)] px-4 py-3 text-sm text-muted">
          Required: mandatory blocks + non-negotiables + output
        </div>
      </div>

      <TodayClient
        blocks={blocks.map((block) => ({
          id: block.id,
          name: block.name,
          startTime: block.startTime,
          endTime: block.endTime,
          category: block.category,
          mandatory: block.mandatory,
          completed: completedBlockIds.has(block.id),
        }))}
        tasks={
          planDay?.tasks
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((task) => ({
              id: task.id,
              title: task.title,
              category: task.category,
              mandatory: task.mandatory,
              completed: Boolean(task.completedAt),
            })) ?? []
        }
        outputType={daily?.outputType}
        outputContent={daily?.outputContent}
        failureDay={Boolean(failureDay)}
        debts={debts.map((debt) => ({
          id: debt.id,
          missedDate: debt.missedDate.toISOString(),
          reason: debt.reason,
          createdAt: debt.createdAt.toISOString(),
        }))}
        progress={{ percent, doneCount, requiredCount }}
        status={{
          mandatoryBlocksDone,
          mandatoryTasksDone,
          outputReady,
          isComplete: completionState.isComplete,
          hasDebt: completionState.hasDebt,
          isFailureDay: completionState.isFailureDay,
        }}
      />

      {blocks.length === 0 ? (
        <div className="card p-6">
          <h3 className="text-xl font-semibold">No timetable yet</h3>
          <p className="mt-2 text-sm text-muted">
            Add your schedule or run onboarding to generate a default timetable.
          </p>
          <a
            href="/onboarding"
            className="mt-4 inline-flex rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white"
          >
            Start onboarding
          </a>
        </div>
      ) : null}
    </div>
  );
}
