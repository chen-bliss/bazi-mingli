import { z } from "zod";
import { isValidCalendarDate, parseCalendarDate, utcDateString } from "./dates";

export const birthSchema = z
  .object({
    year: z.number().int().min(1900).max(2100),
    month: z.number().int().min(1).max(12),
    day: z.number().int().min(1).max(31),
    hour: z.number().int().min(0).max(23),
    minute: z.number().int().min(0).max(59).optional().default(0),
    gender: z.enum(["male", "female"]).optional(),
    dayBoundary: z.enum(["midnight", "zi-hour"]).optional().default("midnight"),
  })
  .superRefine((birth, ctx) => {
    if (!isValidCalendarDate(birth.year, birth.month, birth.day)) {
      ctx.addIssue({
        code: "custom",
        path: ["day"],
        message: "出生日期不存在，请检查年月日",
      });
    }
  });

export const chartRequestSchema = birthSchema
  .safeExtend({
    honeypot: z.string().optional().default(""),
    formStartedAt: z.number().int().nonnegative().optional(),
    targetDate: z.string().optional(),
  })
  .superRefine((input, ctx) => {
    const target = parseCalendarDate(input.targetDate ?? utcDateString());
    if (!target) {
      ctx.addIssue({
        code: "custom",
        path: ["targetDate"],
        message: "观测日期须为有效的 YYYY-MM-DD 日期",
      });
    } else if (isValidCalendarDate(input.year, input.month, input.day)) {
      const birth = `${input.year}-${String(input.month).padStart(2, "0")}-${String(input.day).padStart(2, "0")}`;
      if (utcDateString(target) < birth) {
        ctx.addIssue({
          code: "custom",
          path: ["targetDate"],
          message: "观测日期不能早于出生日期",
        });
      }
    }
  });

export const analyzeRequestSchema = chartRequestSchema.safeExtend({
  question: z.string().max(500).optional(),
  useLlm: z.boolean().optional().default(true),
});
