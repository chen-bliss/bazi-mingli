import { NextRequest } from "next/server";

export interface ClientGuardInput {
  honeypot?: string;
  formStartedAt?: number;
  userAgent?: string | null;
}

export function getClientIp(req: NextRequest): string {
  if (process.env.TRUST_PROXY_HEADERS !== "1") return "unknown";
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip") || "unknown";
}

export function assertHumanRequest(
  req: NextRequest,
  body: ClientGuardInput,
): { ok: true } | { ok: false; status: number; error: string } {
  if (body.honeypot && body.honeypot.trim().length > 0) {
    return { ok: false, status: 400, error: "请求被拒绝" };
  }

  const ua = body.userAgent ?? req.headers.get("user-agent") ?? "";
  if (!ua || ua.length < 8) {
    return { ok: false, status: 400, error: "缺少有效的 User-Agent" };
  }
  const botHint = /(bot|crawler|spider|scrapy|curl|wget|python-requests)/i;
  if (botHint.test(ua) && process.env.ALLOW_SCRIPT_CLIENTS !== "1") {
    return { ok: false, status: 403, error: "检测到自动化客户端，已拦截" };
  }

  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (origin && host) {
    try {
      const originHost = new URL(origin).host;
      if (originHost !== host && process.env.NODE_ENV === "production") {
        return { ok: false, status: 403, error: "跨站请求被拒绝" };
      }
    } catch {
      return { ok: false, status: 403, error: "无效 Origin" };
    }
  }

  if (typeof body.formStartedAt === "number") {
    const elapsed = Date.now() - body.formStartedAt;
    if (elapsed < 1200) {
      return { ok: false, status: 429, error: "操作过快，请稍后再试" };
    }
    if (elapsed > 1000 * 60 * 60 * 6) {
      return { ok: false, status: 400, error: "表单已过期，请刷新后重试" };
    }
  }

  return { ok: true };
}
