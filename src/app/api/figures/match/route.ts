import {
  readJsonBody,
  requestErrorResponse,
} from "@/lib/security/request-body";
import { buildReading } from "@/lib/reading";
import { NextRequest, NextResponse } from "next/server";
import { assertHumanRequest, getClientIp } from "@/lib/security/bot-guard";
import { consumeIpChart } from "@/lib/security/quota-store";
import { chartRequestSchema } from "@/lib/validation";
import { z } from "zod";

const matchSchema = chartRequestSchema.safeExtend({
  limit: z.number().int().min(1).max(12).optional().default(6),
});

export async function POST(req: NextRequest) {
  try {
    const json = await readJsonBody(req);
    const parsed = matchSchema.safeParse(json);
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
        { error: "请求过于频繁", remaining: quota.remaining },
        { status: 429 },
      );
    }

    const { features, matches } = buildReading(
      parsed.data,
      parsed.data.limit,
      14,
    );

    return NextResponse.json({
      features,
      matches,
      disclaimer:
        "相似命例是基于日主、五行、十神倾向与叙事标签的类比检索，并强制纳入反例视角。不能证明命运轨迹将重复。若匹配人物亦收录于命例库，结果含 linkedCaseId。",
      quota: { remaining: quota.remaining, limit: quota.limit },
    });
  } catch (error) {
    return requestErrorResponse(error, "匹配暂时失败，请稍后重试");
  }
}
