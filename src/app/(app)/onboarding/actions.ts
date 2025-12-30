"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getServerAuthSession } from "@/lib/auth";
import { createScheduleFromOnboarding } from "@/lib/setup";
import { onboardingSchema } from "@/lib/validation";

export const saveOnboarding = async (_prevState: unknown, formData: FormData) => {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return { ok: false, error: "Not authenticated." };
  }

  const parsed = onboardingSchema.safeParse({
    wakeTime: formData.get("wakeTime"),
    gymHours: formData.get("gymHours"),
    choresHours: formData.get("choresHours"),
    incomeHours: formData.get("incomeHours"),
    nonReplaceableHours: formData.get("nonReplaceableHours"),
    reflectionHours: formData.get("reflectionHours"),
  });

  if (!parsed.success) {
    return { ok: false, error: "Provide valid onboarding values." };
  }

  await createScheduleFromOnboarding(session.user.id, parsed.data);
  revalidatePath("/today");
  redirect("/today");
};
