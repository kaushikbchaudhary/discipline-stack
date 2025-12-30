import { z } from "zod";


const timeString = z.string().regex(/^\d{2}:\d{2}$/);

const taskSchema = z
  .object({
    title: z.string().min(1).max(80),
    description: z.string().max(240),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    startTime: timeString,
    endTime: timeString,
    durationMinutes: z.number().int().min(15).max(180),
    completed: z.boolean(),
    incompleteReason: z.string().max(200).nullable(),
  })
  .strict();

const planDaySchema = z
  .object({
    dayIndex: z.number().int().min(0),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    tasks: z.array(taskSchema).min(1),
  })
  .strict();

export const planImportSchema = z
  .object({
    name: z.string().min(1).max(100),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    durationDays: z.number().int().min(7).max(90),
    days: z.array(planDaySchema),
  })
  .strict();

export type PlanImport = z.infer<typeof planImportSchema>;

const addDaysToDateString = (dateString: string, offset: number) => {
  const [year, month, day] = dateString.split("-").map((value) => Number(value));
  if ([year, month, day].some((value) => Number.isNaN(value))) {
    return null;
  }
  const date = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
};

const toMinutes = (value: string) => {
  const [hours, minutes] = value.split(":").map((part) => Number(part));
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }
  return hours * 60 + minutes;
};

export const validatePlanImport = (plan: PlanImport, hoursPerDay: number) => {
  const issues: string[] = [];

  if (plan.durationDays !== plan.days.length) {
    issues.push("durationDays does not match days length");
  }

  const startKey = addDaysToDateString(plan.startDate, 0);
  if (!startKey) {
    issues.push("startDate is invalid");
  }

  plan.days.forEach((day, index) => {
    if (day.dayIndex !== index) {
      issues.push(`Day ${index + 1} has invalid dayIndex`);
    }

    const expected = addDaysToDateString(plan.startDate, index);
    if (!expected) {
      issues.push(`Day ${index + 1} date must be YYYY-MM-DD`);
      return;
    }
    if (day.date !== expected) {
      issues.push(`Day ${index + 1} date must be ${expected}`);
    }

    const maxTasks = Math.min(8, hoursPerDay * 2);
    if (day.tasks.length > maxTasks) {
      issues.push(`Day ${index + 1} exceeds daily capacity`);
    }

    const totalMinutes = day.tasks.reduce((sum, task) => sum + task.durationMinutes, 0);
    if (totalMinutes > hoursPerDay * 60) {
      issues.push(`Day ${index + 1} exceeds daily capacity`);
    }

    const titleSet = new Set<string>();
    day.tasks.forEach((task) => {
      if (titleSet.has(task.title)) {
        issues.push(`Day ${index + 1} has duplicate task title: ${task.title}`);
      }
      titleSet.add(task.title);
    });

    day.tasks.forEach((task) => {
      if (task.completed !== false) {
        issues.push(`Day ${index + 1} tasks must be completed: false`);
      }
      if (task.incompleteReason !== null) {
        issues.push(`Day ${index + 1} tasks must set incompleteReason to null`);
      }
    });

    day.tasks.forEach((task) => {
      const expected = addDaysToDateString(plan.startDate, index);
      if (expected && task.date !== expected) {
        issues.push(`Day ${index + 1} task date must be ${expected}`);
      }
      const start = toMinutes(task.startTime);
      const end = toMinutes(task.endTime);
      if (start === null || end === null) {
        issues.push(`Day ${index + 1} task time must be HH:MM`);
        return;
      }
      if (end - start !== task.durationMinutes) {
        issues.push(`Day ${index + 1} task duration must match start and end`);
      }
    });
  });

  return issues;
};

export const buildPlanImportPrompt = (inputs: {
  days: number;
  goal: string;
  goalType: string;
  hoursPerDay: number;
}) => {
  return `You are a planning engine for the goal-agnostic Execution OS app. Your output must be STRICT JSON ONLY, with no explanations, no markdown, no extra keys, and no trailing text.

USER INPUTS:
- DAYS: ${inputs.days}
- GOAL: ${inputs.goal}
- GOAL_TYPE: ${inputs.goalType}
- HOURS_PER_DAY: ${inputs.hoursPerDay}

OUTPUT FORMAT (must match exactly):
{
  "name": string,
  "startDate": "YYYY-MM-DD",
  "durationDays": number,
  "days": [
    {
      "dayIndex": number,
      "date": "YYYY-MM-DD",
      "tasks": [
        {
          "title": string,
          "description": string,
          "date": "YYYY-MM-DD",
          "startTime": "HH:MM",
          "endTime": "HH:MM",
          "durationMinutes": number,
          "completed": false,
          "incompleteReason": null
        }
      ]
    }
  ]
}

HARD CONSTRAINTS:
1) JSON only. No comments, no markdown, no extra fields.
2) durationDays must equal DAYS.
3) days array length must equal DAYS.
4) dayIndex must be 0-based and strictly increasing.
5) date must be valid ISO date strings starting at startDate, sequential with no gaps.
6) Each task must include startTime, endTime, and durationMinutes.
7) durationMinutes must be between 15 and 180.
8) Each task date must match the day date.
9) endTime - startTime must equal durationMinutes.
10) Task titles must be specific, actionable, and <= 80 characters.
11) Daily capacity rule:
    - Total durationMinutes per day must be <= HOURS_PER_DAY * 60.
    - Max tasks per day = min(8, HOURS_PER_DAY * 2).
12) No duplicate task titles within the same day.
13) completed must always be false.
14) incompleteReason must always be null.
15) No motivational language.

DETERMINISTIC PLANNING RULES:
- Use the GOAL and GOAL_TYPE to shape tasks.
- Keep tasks balanced: mix deep work with lighter review when capacity allows.
- Distribute variety across days; avoid repeating the same optional task title more than twice per week.

FINAL INSTRUCTION:
Generate the JSON plan now, strictly following the schema and constraints.`;
};
