import { redirect } from "next/navigation";

import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addDays, dateKey, startOfDay } from "@/lib/time";
import { getQuietWeek } from "@/lib/quiet";

export default async function TimelinePage() {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const quietWeek = await getQuietWeek(session.user.id);
  if (quietWeek) {
    redirect("/today");
  }

  const today = startOfDay(new Date());
  const start = addDays(today, -29);

  const [completions, failureDays, debts, dailyWins] = await Promise.all([
    prisma.dailyCompletion.findMany({
      where: { userId: session.user.id, date: { gte: start } },
    }),
    prisma.failureDay.findMany({
      where: { userId: session.user.id, date: { gte: start } },
    }),
    prisma.executionDebt.findMany({
      where: { userId: session.user.id, missedDate: { gte: start } },
    }),
    prisma.dailyWin.findMany({
      where: { userId: session.user.id, date: { gte: start } },
    }),
  ]);

  const completionMap = new Map(
    completions.map((item) => [startOfDay(item.date).getTime(), item]),
  );
  const failureMap = new Map(
    failureDays.map((item) => [startOfDay(item.date).getTime(), item]),
  );
  const debtMap = new Map(
    debts.map((item) => [startOfDay(item.missedDate).getTime(), item]),
  );
  const winMap = new Set(dailyWins.map((item) => startOfDay(item.date).getTime()));

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
          const failure = failureMap.get(key);
          const debt = debtMap.get(key);
          const status = failure
            ? "Failure"
            : completion?.completedAt
              ? "Complete"
              : winMap.has(key)
                ? "Salvaged"
                : "Incomplete";
          const statusColor = failure
            ? "bg-amber-200"
            : completion?.completedAt
              ? "bg-[color:var(--accent)] text-white"
              : winMap.has(key)
                ? "bg-[#6b8c8f] text-white"
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
                {completion?.outputContent ? (
                  <div>
                    <p className="font-semibold text-black">Output</p>
                    <p>{completion.outputContent}</p>
                  </div>
                ) : null}
                {failure ? (
                  <div>
                    <p className="font-semibold text-black">Failure note</p>
                    <p>{failure.note}</p>
                  </div>
                ) : null}
                {debt ? (
                  <div>
                    <p className="font-semibold text-black">Debt</p>
                    <p>{debt.reason}</p>
                    <p>
                      {debt.resolvedAt ? "Resolved" : "Open"} ·{" "}
                      {debt.resolutionType ? debt.resolutionType.replace("_", " ") : ""}
                    </p>
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
