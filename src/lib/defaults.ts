import { addDays, startOfDay, timeStringToMinutes } from "@/lib/time";

export const CATEGORY_OPTIONS = [
  "CoreWork",
  "SupportWork",
  "Learning",
  "Practice",
  "Health",
  "Reflection",
  "Recovery",
] as const;

export type CategoryOption = (typeof CATEGORY_OPTIONS)[number];

export type OnboardingInput = {
  wakeTime: string;
  dailyCapacityHours: number;
  healthHours: number;
  recoveryHours: number;
};

export type ScheduleDraft = {
  name: string;
  startTime: number;
  endTime: number;
  category: CategoryOption;
  mandatory: boolean;
};

export const buildDefaultSchedule = (input: OnboardingInput): ScheduleDraft[] => {
  const wakeMinutes = timeStringToMinutes(input.wakeTime);
  let cursor = wakeMinutes;

  const dailyCapacity = Math.max(3, input.dailyCapacityHours);
  const coreWorkHours = Math.max(2, Math.round(dailyCapacity * 0.6));
  const learningHours = Math.max(1, Math.round(dailyCapacity * 0.2));
  const practiceHours = Math.max(1, dailyCapacity - coreWorkHours - learningHours);

  const blocks: ScheduleDraft[] = [];
  const addBlock = (
    name: string,
    durationHours: number,
    category: CategoryOption,
    mandatory = false,
  ) => {
    const startTime = cursor;
    const endTime = cursor + durationHours * 60;
    blocks.push({ name, startTime, endTime, category, mandatory });
    cursor = endTime;
  };

  addBlock("Wake + reset", 1, "Reflection");
  addBlock("Health non-negotiable", input.healthHours, "Health", true);
  addBlock("Core work", coreWorkHours, "CoreWork", true);
  addBlock("Learning", learningHours, "Learning", true);
  addBlock("Practice", practiceHours, "Practice", true);
  addBlock("Support work", 1, "SupportWork");
  addBlock("Reflection", 1, "Reflection");
  addBlock("Recovery", input.recoveryHours, "Recovery");
  addBlock("Buffer", Math.max(1, Math.floor((24 * 60 - cursor) / 60)), "Recovery");

  return blocks.filter((block) => block.endTime <= 24 * 60);
};

const week1Tasks = [
  "Set goal scope for the week",
  "Organize materials and tools",
  "Define the single focus for today",
  "Review blockers from yesterday",
  "Draft next action list",
  "Clarify success criteria",
  "Prepare practice materials",
];

const week2Tasks = [
  "Increase core work intensity",
  "Summarize key learning notes",
  "Complete a focused practice set",
  "Review mistakes and patterns",
  "Refine the daily structure",
  "Document one clear improvement",
  "Schedule a recovery window",
];

const week3Tasks = [
  "Deepen practice quality",
  "Focus on weak areas",
  "Apply learning to practice",
  "Review progress metrics",
  "Adjust next actions",
  "Consolidate notes",
  "Plan next week's rhythm",
];

const week4Tasks = [
  "Run a full review day",
  "Consolidate best artifacts",
  "Evaluate consistency gaps",
  "Update goal roadmap",
  "Reduce low-value tasks",
  "Plan the next cycle",
  "Set next checkpoint",
];

const weekTasks = [week1Tasks, week2Tasks, week3Tasks, week4Tasks];

export const buildDefaultPlan = (startDate: Date, durationDays = 30) => {
  const planStart = startOfDay(startDate);

  return Array.from({ length: durationDays }).map((_, index) => {
    const date = addDays(planStart, index);
    const weekIndex = Math.min(3, Math.floor(index / 7));
    const themeTasks = weekTasks[weekIndex];
    const taskTitle = themeTasks[index % themeTasks.length];
    const dayStart = 9 * 60;
    const durations = [60, 60, 60];
    const toTime = (minutes: number) =>
      `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

    return {
      dayIndex: index,
      date,
      tasks: [
        {
          title: "Core work completed",
          description: "Main execution for today.",
          date,
          startTime: toTime(dayStart),
          endTime: toTime(dayStart + durations[0]),
          durationMinutes: durations[0],
          completed: false,
          incompleteReason: null,
        },
        {
          title: "Practice session completed",
          description: "Focused practice or revision.",
          date,
          startTime: toTime(dayStart + durations[0]),
          endTime: toTime(dayStart + durations[0] + durations[1]),
          durationMinutes: durations[1],
          completed: false,
          incompleteReason: null,
        },
        {
          title: "Health baseline completed",
          description: "Health maintenance task.",
          date,
          startTime: toTime(dayStart + durations[0] + durations[1]),
          endTime: toTime(dayStart + durations[0] + durations[1] + durations[2]),
          durationMinutes: durations[2],
          completed: false,
          incompleteReason: null,
        },
        {
          title: taskTitle,
          description: "Optional support task for today.",
          date,
          startTime: toTime(dayStart + 180),
          endTime: toTime(dayStart + 240),
          durationMinutes: 60,
          completed: false,
          incompleteReason: null,
        },
      ],
    };
  });
};
