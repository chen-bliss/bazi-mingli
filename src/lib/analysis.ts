import { buildReading } from "./reading";
import { analyzeRequestSchema } from "./validation";
import { chatCompletion, isLlmConfigured } from "./llm/client";
import {
  buildAnalysisMessages,
  buildDeterministicAnalysis,
} from "./llm/prompts";
import {
  consumeUserDailyLlm,
  peekUserDailyLlm,
  refundUserDailyLlm,
} from "./security/quota-store";
import type { z } from "zod";

/** The caller must authenticate the user and apply the IP guard first. */
export async function analyzeReading(
  userId: string,
  input: z.infer<typeof analyzeRequestSchema>,
) {
  const reading = buildReading(input);
  const callsLlm = input.useLlm && isLlmConfigured();
  let analysis = buildDeterministicAnalysis(reading.chart, reading.biorhythm);
  let mode: "llm" | "deterministic" = "deterministic";
  if (callsLlm) {
    const reservation = await consumeUserDailyLlm(userId);
    if (!reservation.ok) return { ok: false as const, quota: reservation };
    try {
      analysis = await chatCompletion(
        buildAnalysisMessages(
          reading.chart,
          reading.biorhythm,
          input.question,
          reading.matches,
        ),
      );
      mode = "llm";
    } catch (error) {
      await refundUserDailyLlm(userId, reservation.bucket);
      throw error;
    }
  } else if (input.useLlm) {
    analysis +=
      "\n\n> 当前使用本地知识库解读，未调用大模型，不扣每日 AI 配额。";
  }
  return {
    ok: true as const,
    ...reading,
    analysis,
    mode,
    userQuota: await peekUserDailyLlm(userId),
  };
}
