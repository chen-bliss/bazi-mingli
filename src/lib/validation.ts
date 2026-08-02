import { z } from "zod";

export const birthSchema = z.object({
  year: z.number().int().min(1900).max(2100),
  month: z.number().int().min(1).max(12),
  day: z.number().int().min(1).max(31),
  hour: z.number().int().min(0).max(23),
  minute: z.number().int().min(0).max(59).optional().default(0),
  gender: z.enum(["male", "female"]).optional(),
});

export const chartRequestSchema = birthSchema.extend({
  honeypot: z.string().optional().default(""),
  formStartedAt: z.number().optional(),
  targetDate: z.string().optional(),
});

export const analyzeRequestSchema = chartRequestSchema.extend({
  question: z.string().max(500).optional(),
  useLlm: z.boolean().optional().default(true),
});
