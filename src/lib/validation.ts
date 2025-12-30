import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

export const scheduleBlockSchema = z.object({
  name: z.string().min(1).max(100),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  category: z.enum([
    "CoreWork",
    "SupportWork",
    "Learning",
    "Practice",
    "Health",
    "Reflection",
    "Recovery",
  ]),
  mandatory: z.coerce.boolean().default(false),
});

export const onboardingSchema = z.object({
  wakeTime: z.string().regex(/^\d{2}:\d{2}$/),
  dailyCapacityHours: z.coerce.number().min(3).max(10),
  healthHours: z.coerce.number().min(1).max(4),
  recoveryHours: z.coerce.number().min(1).max(6),
  goalTitle: z.string().min(3).max(80),
  goalDescription: z.string().max(240).optional(),
  goalType: z.enum([
    "EXAM_PREP",
    "CAREER_GROWTH",
    "BUSINESS",
    "SKILL_BUILDING",
    "HEALTH",
    "PERSONAL_SYSTEM",
    "CUSTOM",
  ]),
});

const textOutputSchema = z
  .string()
  .min(5, "Text proof must be at least 5 characters.")
  .max(2000)
  .refine(
    (value) => !/(lorem|placeholder|todo|example|test)/i.test(value),
    "Proof looks like a placeholder.",
  );

const urlOutputSchema = z
  .string()
  .url("Provide a valid URL.")
  .max(1000)
  .refine((value) => !/example\\.com/i.test(value), "Proof looks like a placeholder.");

export const outputSchema = z.discriminatedUnion("outputType", [
  z.object({
    outputType: z.literal("TEXT"),
    outputContent: textOutputSchema,
  }),
  z.object({
    outputType: z.literal("URL"),
    outputContent: urlOutputSchema,
  }),
]);
