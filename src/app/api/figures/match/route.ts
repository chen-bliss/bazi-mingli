import { NextRequest, NextResponse } from "next/server";
import { buildBaZiChart } from "@/lib/bazi";
import { calculateBiorhythm } from "@/lib/biorhythm";
import {
  featuresFromChart,
  matchHistoricalFigures,
} from "@/lib/figures";
import { withLinkedCases } from "@/lib/mingli-cases";
import { assertHumanRequest, getClientIp } from "@/lib/security/bot-guard";
import { consumeIpChart } from "@/lib/security/quota-store";
import { chartRequestSchema } from "@/lib/validation";
import { z } from "zod";

const matchSchema = chartRequestSchema.extend({
  limit: z.number().int().min(1).max(12).optional().default(6),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = matchSchema.safeParse(json);
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
        { error: "请求过于频繁", remaining: quota.remaining },
        { status: 429 },
      );
    }

    const { year, month, day, hour, minute, gender, targetDate, limit } =
      parsed.data;
    const chart = buildBaZiChart({ year, month, day, hour, minute, gender });
    const target = targetDate ? new Date(targetDate) : new Date();
    const biorhythm = calculateBiorhythm({ year, month, day }, target, 14);
    const features = featuresFromChart(chart, {
      hourKnown: true,
      biorhythm,
    });
    const matches = withLinkedCases(
      matchHistoricalFigures(features, {
        limit,
        includeCounterexamples: true,
      }),
    );

    return NextResponse.json({
      features,
      matches,
      disclaimer:
        "相似命例是基于日主、五行、十神倾向与叙事标签的类比检索，并强制纳入反例视角。不能证明命运轨迹将重复。若匹配人物亦收录于命例库，结果含 linkedCaseId。",
      quota: { remaining: quota.remaining, limit: quota.limit },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "匹配失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
