"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getServerAuthSession } from "@/lib/auth";
import { createGoalFromOnboarding, createScheduleFromOnboarding } from "@/lib/setup";
import { onboardingSchema } from "@/lib/validation";

export const saveOnboarding = async (_prevState: unknown, formData: FormData) => {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return { ok: false, error: "Not authenticated." };
  }

  const parsed = onboardingSchema.safeParse({
    wakeTime: formData.get("wakeTime"),
    dailyCapacityHours: formData.get("dailyCapacityHours"),
    healthHours: formData.get("healthHours"),
    recoveryHours: formData.get("recoveryHours"),
    goalTitle: formData.get("goalTitle"),
    goalDescription: formData.get("goalDescription"),
    goalType: formData.get("goalType"),
  });

  if (!parsed.success) {
    return { ok: false, error: "Provide valid onboarding values." };
  }

  await createGoalFromOnboarding(session.user.id, {
    goalTitle: parsed.data.goalTitle,
    goalDescription: parsed.data.goalDescription,
    goalType: parsed.data.goalType,
  });
  await createScheduleFromOnboarding(session.user.id, parsed.data);
  revalidatePath("/today");
  redirect("/today");
};
