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

export const outputSchema = z.object({
  outputType: z.enum(["text", "url"]),
  outputContent: z.string().min(1).max(1000),
});
