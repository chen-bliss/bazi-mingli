import { NextRequest, NextResponse } from "next/server";
import { buildBaZiChart } from "@/lib/bazi";
import { calculateBiorhythm } from "@/lib/biorhythm";
import { featuresFromChart, matchHistoricalFigures } from "@/lib/figures";
import { assertHumanRequest, getClientIp } from "@/lib/security/bot-guard";
import { consumeIpChart } from "@/lib/security/quota-store";
import { chartRequestSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = chartRequestSchema.safeParse(json);
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

    const { year, month, day, hour, minute, gender, targetDate } = parsed.data;
    const chart = buildBaZiChart({ year, month, day, hour, minute, gender });
    const target = targetDate ? new Date(targetDate) : new Date();
    const biorhythm = calculateBiorhythm({ year, month, day }, target, 30);
    const features = featuresFromChart(chart, { hourKnown: true, biorhythm });
    const matches = matchHistoricalFigures(features, {
      limit: 6,
      includeCounterexamples: true,
    });

    return NextResponse.json({
      chart,
      biorhythm,
      matches,
      features,
      quota: { remaining: quota.remaining, limit: quota.limit },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "排盘失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
