"use server";

import { revalidatePath } from "next/cache";

import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getWeekStart } from "@/lib/time";

export const saveWeeklyReview = async (formData: FormData) => {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return { ok: false, error: "Not authenticated." };
  }

  const weekStartDate = getWeekStart(new Date());
  const q1 = String(formData.get("q1") ?? "");
  const q2 = String(formData.get("q2") ?? "");
  const q3 = String(formData.get("q3") ?? "");
  const q4 = String(formData.get("q4") ?? "");
  const stopDoing = String(formData.get("stopDoing") ?? "");
  const resistanceBlock = String(formData.get("resistanceBlock") ?? "");

  const existing = await prisma.weeklyReview.findUnique({
    where: { userId_weekStartDate: { userId: session.user.id, weekStartDate } },
  });

  if (existing) {
    return { ok: false, error: "Weekly review is locked after submission." };
  }

  await prisma.weeklyReview.create({
    data: {
      userId: session.user.id,
      weekStartDate,
      q1,
      q2,
      q3,
      q4,
      stopDoing,
      resistanceBlock,
    },
  });

  revalidatePath("/review");
  return { ok: true };
};
