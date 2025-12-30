import { redirect } from "next/navigation";

import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import TimetableClient from "@/app/(app)/timetable/TimetableClient";

export default async function TimetablePage() {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const [blocks, user] = await Promise.all([
    prisma.scheduleBlock.findMany({
      where: { userId: session.user.id },
      orderBy: { startTime: "asc" },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { scheduleLocked: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-muted">Timetable</p>
        <h1 className="text-3xl font-semibold">Control your daily blocks</h1>
        <p className="text-sm text-muted">
          Overlaps are blocked. Mandatory blocks are required to complete a day.
        </p>
      </div>
      <TimetableClient
        blocks={blocks.map((block) => ({
          id: block.id,
          name: block.name,
          startTime: block.startTime,
          endTime: block.endTime,
          category: block.category,
          mandatory: block.mandatory,
        }))}
        locked={user?.scheduleLocked ?? false}
      />
    </div>
  );
}
