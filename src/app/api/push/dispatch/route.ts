import { NextResponse } from "next/server";
import webpush from "web-push";

import { prisma } from "@/lib/prisma";
import { startOfDay, addDays } from "@/lib/time";

const WINDOW_MINUTES = 10;
const GRACE_MINUTES = 2;

const getVapidConfig = () => {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) {
    return null;
  }
  return { publicKey, privateKey, subject };
};

const isAuthorized = (request: Request) => {
  const secret = process.env.PUSH_CRON_SECRET;
  if (!secret) {
    return true;
  }
  const header = request.headers.get("authorization") || "";
  const token = header.replace("Bearer ", "").trim();
  return token === secret;
};

const parseTaskStart = (date: Date, startTime: string) => {
  const [hours, minutes] = startTime.split(":").map((value) => Number(value));
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }
  const target = new Date(date);
  target.setHours(hours, minutes, 0, 0);
  return target;
};

const shouldNotify = (taskTime: Date, lastNotifiedAt: Date | null, now: Date) => {
  const windowStart = new Date(now.getTime() - GRACE_MINUTES * 60 * 1000);
  const windowEnd = new Date(now.getTime() + WINDOW_MINUTES * 60 * 1000);
  if (taskTime < windowStart || taskTime > windowEnd) {
    return false;
  }
  if (!lastNotifiedAt) {
    return true;
  }
  return lastNotifiedAt.getTime() < taskTime.getTime();
};

const sendPayload = async (payload: Record<string, string>, subscription: {
  endpoint: string;
  p256dh: string;
  auth: string;
}) => {
  await webpush.sendNotification(
    {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
    },
    JSON.stringify(payload),
  );
};

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const prismaAny = prisma as unknown as {
    pushSubscription: {
      findMany: (args: unknown) => Promise<
        { id: string; userId: string; endpoint: string; p256dh: string; auth: string }[]
      >;
      delete: (args: unknown) => Promise<unknown>;
    };
  };

  const vapid = getVapidConfig();
  if (!vapid) {
    return NextResponse.json({ error: "VAPID keys are not configured." }, { status: 500 });
  }

  webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);

  const now = new Date();
  const dayStart = startOfDay(now);
  const dayEnd = addDays(dayStart, 1);

  const tasks = await prisma.task.findMany({
    where: {
      date: { gte: dayStart, lt: dayEnd },
      completed: false,
      startTime: { not: null },
    },
    include: {
      plan: { select: { userId: true } },
    },
  });

  const candidates = tasks
    .map((task) => {
      const start = task.startTime ? parseTaskStart(task.date, task.startTime) : null;
      if (!start) {
        return null;
      }
      return {
        id: task.id,
        title: task.title,
        startTime: start,
        lastNotifiedAt: null,
        userId: task.plan.userId,
      };
    })
    .filter((task): task is NonNullable<typeof task> => Boolean(task))
    .filter((task) => shouldNotify(task.startTime, task.lastNotifiedAt, now));

  if (candidates.length === 0) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  const userIds = Array.from(new Set(candidates.map((task) => task.userId)));
  const subscriptions = await prismaAny.pushSubscription.findMany({
    where: { userId: { in: userIds } },
  });
  const subscriptionMap = new Map<string, typeof subscriptions>();
  subscriptions.forEach((subscription) => {
    const existing = subscriptionMap.get(subscription.userId) ?? [];
    existing.push(subscription);
    subscriptionMap.set(subscription.userId, existing);
  });

  const notifiedTaskIds = new Set<string>();
  await Promise.all(
    candidates.map(async (task) => {
      const subs = subscriptionMap.get(task.userId);
      if (!subs || subs.length === 0) {
        return;
      }
      const payload = {
        title: "Task starting now",
        body: task.title,
        url: "/today",
        tag: `task-${task.id}`,
      };
      await Promise.all(
        subs.map(async (sub) => {
          try {
            await sendPayload(payload, sub);
            notifiedTaskIds.add(task.id);
          } catch (error) {
            const statusCode = (error as { statusCode?: number })?.statusCode;
            if (statusCode === 410) {
              await prismaAny.pushSubscription.delete({ where: { id: sub.id } });
            }
          }
        }),
      );
    }),
  );

  return NextResponse.json({ ok: true, sent: notifiedTaskIds.size });
}

export const GET = POST;
