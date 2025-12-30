import { prisma } from "@/lib/prisma";
import { buildDefaultPlan, buildDefaultSchedule, type OnboardingInput } from "@/lib/defaults";
import { startOfDay } from "@/lib/time";

export const DEFAULT_ONBOARDING: OnboardingInput = {
  wakeTime: "06:00",
  gymHours: 2,
  choresHours: 2,
  incomeHours: 3,
  nonReplaceableHours: 2,
  reflectionHours: 1,
};

export const createDefaultPlan = async (userId: string, startDate = new Date()) => {
  const planDays = buildDefaultPlan(startOfDay(startDate));

  return prisma.plan.create({
    data: {
      userId,
      name: "Execution Sprint",
      startDate: startOfDay(startDate),
      durationDays: planDays.length,
      days: {
        create: planDays.map((day) => ({
          dayIndex: day.dayIndex,
          date: day.date,
          tasks: {
            create: day.tasks,
          },
        })),
      },
    },
  });
};

export const createScheduleFromOnboarding = async (
  userId: string,
  input: OnboardingInput,
) => {
  const blocks = buildDefaultSchedule(input);

  await prisma.scheduleBlock.deleteMany({ where: { userId } });

  return prisma.scheduleBlock.createMany({
    data: blocks.map((block) => ({
      userId,
      name: block.name,
      startTime: block.startTime,
      endTime: block.endTime,
      category: block.category,
      mandatory: block.mandatory,
      lockedVersion: 1,
    })),
  });
};
