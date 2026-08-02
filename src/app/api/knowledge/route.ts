import { NextResponse } from "next/server";
import { getKnowledgeBundle } from "@/lib/knowledge";

export async function GET() {
  return NextResponse.json(getKnowledgeBundle());
}
