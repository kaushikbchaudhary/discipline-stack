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
  category: z.string().min(1),
  mandatory: z.coerce.boolean().default(false),
});

export const onboardingSchema = z.object({
  wakeTime: z.string().regex(/^\d{2}:\d{2}$/),
  gymHours: z.coerce.number().min(1).max(6),
  choresHours: z.coerce.number().min(1).max(6),
  incomeHours: z.coerce.number().min(1).max(8),
  nonReplaceableHours: z.coerce.number().min(1).max(6),
  reflectionHours: z.coerce.number().min(1).max(4),
});

const textOutputSchema = z
  .string()
  .min(30, "Text output must be at least 30 characters.")
  .max(1000)
  .refine(
    (value) =>
      /problem\\s*:/i.test(value) &&
      /decision\\s*:/i.test(value) &&
      /outcome\\s*:/i.test(value),
    "Text output must include Problem:, Decision:, and Outcome: sections.",
  )
  .refine(
    (value) => !/(lorem|placeholder|todo|example|test)/i.test(value),
    "Output looks like a placeholder.",
  );

const urlOutputSchema = z
  .string()
  .url("Provide a valid URL.")
  .max(1000)
  .refine((value) => !/example\\.com/i.test(value), "Output looks like a placeholder.");

export const outputSchema = z.discriminatedUnion("outputType", [
  z.object({
    outputType: z.literal("text"),
    outputContent: textOutputSchema,
  }),
  z.object({
    outputType: z.literal("url"),
    outputContent: urlOutputSchema,
  }),
]);
