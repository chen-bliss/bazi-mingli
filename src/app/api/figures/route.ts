import { NextRequest, NextResponse } from "next/server";
import { browseFigures, listFigureStats } from "@/lib/figures";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const field = searchParams.get("field") ?? undefined;
  const fitAssessment = searchParams.get("fit") ?? undefined;
  const gender = searchParams.get("gender") ?? undefined;
  const country = searchParams.get("country") ?? undefined;
  const q = searchParams.get("q") ?? undefined;
  const statsOnly = searchParams.get("stats") === "1";

  if (statsOnly) {
    return NextResponse.json(listFigureStats());
  }

  const figures = browseFigures({ field, fitAssessment, gender, country, q });
  return NextResponse.json({
    total: figures.length,
    figures,
    disclaimer:
      "人物库用于教育对照。匹配与标注皆非命运证明；出生时辰未知者不会伪造时柱。详见 PRIOR_ART.md。",
  });
}
