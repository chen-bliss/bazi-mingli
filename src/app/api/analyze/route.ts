import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { buildBaZiChart } from "@/lib/bazi";
import { calculateBiorhythm } from "@/lib/biorhythm";
import { chatCompletion, isLlmConfigured } from "@/lib/llm/client";
import {
  buildAnalysisMessages,
  buildDeterministicAnalysis,
} from "@/lib/llm/prompts";
import { assertHumanRequest, getClientIp } from "@/lib/security/bot-guard";
import {
  consumeIpLlm,
  consumeUserDailyLlm,
  peekUserDailyLlm,
} from "@/lib/security/quota-store";
import { analyzeRequestSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "LLM 演算需要先使用 GitHub 登录", code: "AUTH_REQUIRED" },
        { status: 401 },
      );
    }

    const json = await req.json();
    const parsed = analyzeRequestSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "参数无效", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const guard = assertHumanRequest(req, parsed.data);
    if (!guard.ok) {
      return NextResponse.json({ error: guard.error }, { status: guard.status });
    }

    const ip = getClientIp(req);
    const ipQuota = await consumeIpLlm(ip);
    if (!ipQuota.ok) {
      return NextResponse.json(
        {
          error: "当前 IP 调用过于频繁",
          remaining: ipQuota.remaining,
          limit: ipQuota.limit,
          resetHint: ipQuota.resetHint,
        },
        { status: 429 },
      );
    }

    const userQuota = await consumeUserDailyLlm(session.user.id);
    if (!userQuota.ok) {
      return NextResponse.json(
        {
          error: "今日 LLM 演算次数已用尽",
          remaining: 0,
          limit: userQuota.limit,
          resetHint: userQuota.resetHint,
          code: "DAILY_QUOTA",
        },
        { status: 429 },
      );
    }

    const { year, month, day, hour, minute, gender, targetDate, question, useLlm } =
      parsed.data;
    const chart = buildBaZiChart({ year, month, day, hour, minute, gender });
    const target = targetDate ? new Date(targetDate) : new Date();
    const biorhythm = calculateBiorhythm({ year, month, day }, target, 30);

    let mode: "llm" | "deterministic" = "deterministic";
    let analysis = buildDeterministicAnalysis(chart, biorhythm);

    if (useLlm && isLlmConfigured()) {
      const messages = buildAnalysisMessages(chart, biorhythm, question);
      analysis = await chatCompletion(messages);
      mode = "llm";
    } else if (useLlm && !isLlmConfigured()) {
      analysis = `${analysis}\n\n> 服务端尚未配置 LLM_API_KEY / LLM_MODEL。GitHub Models 已于 2026-07-30 退役，请改用 Azure AI Foundry 或其它 OpenAI 兼容接口。`;
    }

    const peek = await peekUserDailyLlm(session.user.id);

    return NextResponse.json({
      chart,
      biorhythm,
      analysis,
      mode,
      quota: {
        userRemaining: peek.remaining,
        userLimit: peek.limit,
        ipRemaining: ipQuota.remaining,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "演算失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
