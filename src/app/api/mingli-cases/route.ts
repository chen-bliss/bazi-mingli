import { NextRequest, NextResponse } from "next/server";
import {
  browseMingliCases,
  listMingliCaseStats,
} from "@/lib/mingli-cases";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const field = searchParams.get("field") ?? undefined;
  const fitAssessment = searchParams.get("fit") ?? undefined;
  const gender = searchParams.get("gender") ?? undefined;
  const country = searchParams.get("country") ?? undefined;
  const region = searchParams.get("region") ?? undefined;
  const era = searchParams.get("era") ?? undefined;
  const q = searchParams.get("q") ?? undefined;
  const statsOnly = searchParams.get("stats") === "1";

  if (statsOnly) {
    return NextResponse.json(listMingliCaseStats());
  }

  const cases = browseMingliCases({
    field,
    fitAssessment,
    gender,
    country,
    region,
    era,
    q,
  });

  return NextResponse.json({
    total: cases.length,
    kind: "mingli-case",
    cases,
    disclaimer:
      "历史命例库用于排盘与格局教学对照，不是命运证明。出生时辰未知者 hour 恒为 null，不伪造时柱；典籍示意条目标为资料不足。详见 PRIOR_ART.md。",
  });
}
