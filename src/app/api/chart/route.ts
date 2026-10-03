import {
  readJsonBody,
  requestErrorResponse,
} from "@/lib/security/request-body";
import { buildReading } from "@/lib/reading";
import { NextRequest, NextResponse } from "next/server";
import { assertHumanRequest, getClientIp } from "@/lib/security/bot-guard";
import { consumeIpChart } from "@/lib/security/quota-store";
import { chartRequestSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  try {
    const json = await readJsonBody(req);
    const parsed = chartRequestSchema.safeParse(json);
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
    const quota = await consumeIpChart(ip);
    if (!quota.ok) {
      return NextResponse.json(
        {
          error: "排盘请求过于频繁，请稍后再试",
          remaining: quota.remaining,
          limit: quota.limit,
          resetHint: quota.resetHint,
        },
        { status: 429 },
      );
    }

    const { chart, biorhythm, features, matches } = buildReading(parsed.data);

    return NextResponse.json({
      chart,
      biorhythm,
      matches,
      features,
      quota: { remaining: quota.remaining, limit: quota.limit },
    });
  } catch (error) {
    return requestErrorResponse(error, "排盘暂时失败，请稍后重试");
  }
}
