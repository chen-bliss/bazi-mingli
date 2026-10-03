import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { NextRequest, NextResponse } from "next/server";

export function isAuthConfigured() {
  return Boolean(
    process.env.AUTH_SECRET &&
    process.env.AUTH_GITHUB_ID &&
    process.env.AUTH_GITHUB_SECRET,
  );
}

const nextAuth = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
  ],
  session: { strategy: "jwt" },
  trustHost: true,
  callbacks: {
    async jwt({ token, profile }) {
      if (profile && "login" in profile && typeof profile.login === "string") {
        token.login = profile.login;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.login =
          typeof token.login === "string" ? token.login : undefined;
      }
      return session;
    },
  },
});

export async function auth() {
  return isAuthConfigured() ? nextAuth.auth() : null;
}

async function handleAuth(req: NextRequest) {
  if (!isAuthConfigured()) {
    if (req.method === "GET" && req.nextUrl.pathname.endsWith("/session"))
      return NextResponse.json(null);
    if (req.method === "GET" && req.nextUrl.pathname.endsWith("/providers"))
      return NextResponse.json({});
    return NextResponse.json({ error: "GitHub 登录尚未配置" }, { status: 503 });
  }
  return req.method === "GET"
    ? nextAuth.handlers.GET(req)
    : nextAuth.handlers.POST(req);
}

export const handlers = { GET: handleAuth, POST: handleAuth };
