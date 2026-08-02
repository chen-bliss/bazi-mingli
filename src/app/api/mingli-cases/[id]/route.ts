import { NextRequest, NextResponse } from "next/server";
import { getMingliCaseById } from "@/lib/mingli-cases";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const item = getMingliCaseById(id);
  if (!item) {
    return NextResponse.json(
      { error: "未找到该命例", id },
      { status: 404 },
    );
  }
  return NextResponse.json({
    case: item,
    disclaimer:
      "命例库条目供教育对照；fitAssessment 含不符合与资料不足，用于抑制确认偏误。",
  });
}
