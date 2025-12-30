import { addDays, startOfDay, timeStringToMinutes } from "@/lib/time";

export const CATEGORY_OPTIONS = [
  "Health",
  "Income",
  "Creation",
  "Reflection",
  "Rest",
] as const;

export type CategoryOption = (typeof CATEGORY_OPTIONS)[number];

export type OnboardingInput = {
  wakeTime: string;
  gymHours: number;
  choresHours: number;
  incomeHours: number;
  nonReplaceableHours: number;
  reflectionHours: number;
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
  addBlock("Gym", input.gymHours, "Health", true);
  addBlock("Cooking + chores", input.choresHours, "Health", true);
  addBlock("Income block", input.incomeHours, "Income", true);
  addBlock("Non-replaceable output", input.nonReplaceableHours, "Creation", true);
  addBlock("Reflection", input.reflectionHours, "Reflection");
  addBlock("Rest", Math.max(1, Math.floor((24 * 60 - cursor) / 60)), "Rest");

  return blocks.filter((block) => block.endTime <= 24 * 60);
};

const week1Tasks = [
  "Stabilize wake time",
  "Reset workspace",
  "Define income target",
  "List top 5 leads",
  "Clean inbox + notes",
  "Write a 1-paragraph offer",
  "Prepare outreach template",
];

const week2Tasks = [
  "Build lead pipeline",
  "Publish 1 useful insight",
  "Send 10 outreaches",
  "Refine offer promise",
  "Review outreach replies",
  "Schedule 2 calls",
  "Update portfolio proof",
];

const week3Tasks = [
  "Run 2 discovery calls",
  "Improve close script",
  "Send follow-up sequence",
  "Ship a case study",
  "Review conversion blockers",
  "Tighten qualification",
  "Ask for referrals",
];

const week4Tasks = [
  "Negotiate terms",
  "Document delivery plan",
  "Close 1 offer",
  "Review pricing",
  "Send last follow-ups",
  "Collect testimonials",
  "Plan next month",
];

const weekTasks = [week1Tasks, week2Tasks, week3Tasks, week4Tasks];

export const buildDefaultPlan = (startDate: Date, durationDays = 30) => {
  const planStart = startOfDay(startDate);

  return Array.from({ length: durationDays }).map((_, index) => {
    const date = addDays(planStart, index);
    const weekIndex = Math.min(3, Math.floor(index / 7));
    const themeTasks = weekTasks[weekIndex];
    const taskTitle = themeTasks[index % themeTasks.length];

    return {
      dayIndex: index,
      date,
      tasks: [
        {
          title: "Income block completed",
          category: "Income",
          mandatory: true,
          sortOrder: 1,
        },
        {
          title: "Non-replaceable output created",
          category: "Creation",
          mandatory: true,
          sortOrder: 2,
        },
        {
          title: "Health + cooking done",
          category: "Health",
          mandatory: true,
          sortOrder: 3,
        },
        {
          title: taskTitle,
          category: "Creation",
          mandatory: false,
          sortOrder: 4,
        },
      ],
    };
  });
};
