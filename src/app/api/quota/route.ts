import { NextResponse } from "next/server";
import { auth, isAuthConfigured } from "@/lib/auth";
import { LIMITS, peekUserDailyLlm } from "@/lib/security/quota-store";
import { isLlmConfigured } from "@/lib/llm/client";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({
      authenticated: false,
      authConfigured: isAuthConfigured(),
      llmConfigured: isLlmConfigured(),
      limits: LIMITS,
    });
  }
  const peek = await peekUserDailyLlm(session.user.id);
  return NextResponse.json({
    authenticated: true,
    authConfigured: true,
    user: {
      id: session.user.id,
      name: session.user.name,
      login: session.user.login,
    },
    llmConfigured: isLlmConfigured(),
    quota: peek,
    limits: LIMITS,
  });
}
