import { NextRequest, NextResponse } from "next/server";
import { getFigureById } from "@/lib/figures";
import { getMingliCaseByFigureId } from "@/lib/mingli-cases";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const figure = getFigureById(id);
  if (!figure) {
    return NextResponse.json(
      { error: "未找到该人物", id },
      { status: 404 },
    );
  }
  const linkedCase = getMingliCaseByFigureId(id);
  return NextResponse.json({
    figure,
    linkedCaseId: linkedCase?.id,
    disclaimer:
      "人物库用于教育对照。匹配与标注皆非命运证明；出生时辰未知者不会伪造时柱。",
  });
}
