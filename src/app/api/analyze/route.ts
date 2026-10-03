import {
  readJsonBody,
  requestErrorResponse,
} from "@/lib/security/request-body";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { analyzeReading } from "@/lib/analysis";
import { assertHumanRequest, getClientIp } from "@/lib/security/bot-guard";
import { consumeIpLlm } from "@/lib/security/quota-store";
import { analyzeRequestSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "解读需要先使用 GitHub 登录", code: "AUTH_REQUIRED" },
        { status: 401 },
      );
    }

    const json = await readJsonBody(req);
    const parsed = analyzeRequestSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.issues[0]?.message ?? "参数无效",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const guard = assertHumanRequest(req, parsed.data);
    if (!guard.ok) {
      return NextResponse.json(
        { error: guard.error },
        { status: guard.status },
      );
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

    const result = await analyzeReading(session.user.id, parsed.data);
    if (!result.ok) {
      return NextResponse.json(
        {
          error: "今日 AI 解读次数已用尽",
          remaining: 0,
          limit: result.quota.limit,
          resetHint: result.quota.resetHint,
          code: "DAILY_QUOTA",
        },
        { status: 429 },
      );
    }
    return NextResponse.json({
      chart: result.chart,
      biorhythm: result.biorhythm,
      matches: result.matches,
      analysis: result.analysis,
      mode: result.mode,
      quota: {
        userRemaining: result.userQuota.remaining,
        userLimit: result.userQuota.limit,
        ipRemaining: ipQuota.remaining,
      },
    });
  } catch (error) {
    return requestErrorResponse(error, "演算暂时失败，请稍后重试");
  }
}
