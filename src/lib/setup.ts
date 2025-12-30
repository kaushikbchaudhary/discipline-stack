import { prisma } from "@/lib/prisma";
import { buildDefaultPlan, buildDefaultSchedule, type OnboardingInput } from "@/lib/defaults";
import { startOfDay } from "@/lib/time";

export const DEFAULT_ONBOARDING: OnboardingInput = {
  wakeTime: "06:00",
  dailyCapacityHours: 4,
  healthHours: 2,
  recoveryHours: 2,
};

export const createDefaultPlan = async (userId: string, startDate = new Date()) => {
  const planDays = buildDefaultPlan(startOfDay(startDate));

  const plan = await prisma.plan.create({
    data: {
      userId,
      name: "Execution Plan",
      startDate: startOfDay(startDate),
      durationDays: planDays.length,
    },
  });

  const tasks = planDays.flatMap((day) =>
    day.tasks.map((task) => ({
      planId: plan.id,
      title: task.title,
      description: task.description,
      date: task.date,
      startTime: task.startTime ?? null,
      endTime: task.endTime ?? null,
      durationMinutes: task.durationMinutes ?? null,
      completed: task.completed ?? false,
      incompleteReason: task.incompleteReason ?? null,
    })),
  );

  if (tasks.length > 0) {
    await prisma.task.createMany({ data: tasks });
  }

  return plan;
};

export const createDefaultGoal = async (userId: string) => {
  const goal = await prisma.goal.create({
    data: {
      userId,
      title: "Primary Goal",
      description: "Define your main outcome.",
      goalType: "CUSTOM",
      startDate: startOfDay(new Date()),
      isActive: true,
    },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { activeGoalId: goal.id },
  });

  return goal;
};

export const createGoalFromOnboarding = async (
  userId: string,
  input: { goalTitle: string; goalDescription?: string; goalType: string },
) => {
  const goal = await prisma.goal.create({
    data: {
      userId,
      title: input.goalTitle,
      description: input.goalDescription?.trim() || null,
      goalType: input.goalType as any,
      startDate: startOfDay(new Date()),
      isActive: true,
    },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { activeGoalId: goal.id },
  });

  return goal;
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
