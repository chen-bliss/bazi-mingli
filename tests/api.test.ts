import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { NextRequest } from "next/server";
import { POST as chartPost } from "../src/app/api/chart/route";
import { POST as matchPost } from "../src/app/api/figures/match/route";
import { assertHumanRequest, getClientIp } from "../src/lib/security/bot-guard";

const birth = {
  year: 1990,
  month: 5,
  day: 15,
  hour: 10,
  targetDate: "2026-10-03",
};
function request(body: string, type = "application/json") {
  return new NextRequest("http://localhost:3000/api/chart", {
    method: "POST",
    headers: { "Content-Type": type, "User-Agent": "Mozilla/5.0" },
    body,
  });
}

test("JSON routes reject malformed, oversized and nonexistent-date inputs as client errors", async () => {
  for (const post of [chartPost, matchPost]) {
    assert.equal((await post(request("{"))).status, 400);
    assert.equal(
      (await post(request(JSON.stringify({ ...birth, month: 2, day: 30 }))))
        .status,
      400,
    );
    assert.equal(
      (await post(request(JSON.stringify({ ...birth, targetDate: "bad" }))))
        .status,
      400,
    );
    assert.equal((await post(request("x".repeat(17_000)))).status, 413);
    assert.equal(
      (await post(request(JSON.stringify(birth), "text/plain"))).status,
      415,
    );
  }
});

test("chart and match endpoints return the same current-birth matches", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "bazi-api-"));
  process.env.QUOTA_STORE_PATH = path.join(dir, "quota.json");
  try {
    const chart = await chartPost(request(JSON.stringify(birth)));
    const match = await matchPost(request(JSON.stringify(birth)));
    assert.equal(chart.status, 200);
    assert.equal(match.status, 200);
    const first = await chart.json();
    const second = await match.json();
    assert.deepEqual(first.matches, second.matches);
    assert.equal(first.biorhythm.targetDate, birth.targetDate);
    assert.equal(first.biorhythm.series.length, 31);
    assert.equal(first.chart.calculation.dayBoundary, "midnight");
  } finally {
    await rm(dir, { recursive: true, force: true });
    delete process.env.QUOTA_STORE_PATH;
  }
});

test("honeypot and elapsed guard still reject requests; proxy headers need opt-in", () => {
  assert.equal(
    assertHumanRequest(request("{}"), { honeypot: "spam" }).ok,
    false,
  );
  assert.equal(
    assertHumanRequest(request("{}"), { formStartedAt: Date.now() }).ok,
    false,
  );
  assert.equal(
    assertHumanRequest(request("{}"), { formStartedAt: Date.now() - 2000 }).ok,
    true,
  );
  const req = new NextRequest("http://localhost:3000", {
    headers: { "x-forwarded-for": "203.0.113.4, 203.0.113.5" },
  });
  const original = process.env.TRUST_PROXY_HEADERS;
  try {
    delete process.env.TRUST_PROXY_HEADERS;
    assert.equal(getClientIp(req), "unknown");
    process.env.TRUST_PROXY_HEADERS = "1";
    assert.equal(getClientIp(req), "203.0.113.4");
  } finally {
    if (original === undefined) delete process.env.TRUST_PROXY_HEADERS;
    else process.env.TRUST_PROXY_HEADERS = original;
  }
});

test("without OAuth config session stays anonymous and analysis remains protected", async () => {
  const { handlers } = await import("../src/lib/auth");
  const { GET: quotaGet } = await import("../src/app/api/quota/route");
  const { POST: analyzePost } = await import("../src/app/api/analyze/route");
  const original = process.env.AUTH_GITHUB_ID;
  delete process.env.AUTH_GITHUB_ID;
  try {
    const session = await handlers.GET(
      new NextRequest("http://localhost:3000/api/auth/session"),
    );
    assert.equal(session.status, 200);
    assert.equal(await session.json(), null);
    const quota = await quotaGet();
    const data = await quota.json();
    assert.equal(data.authenticated, false);
    assert.equal(data.authConfigured, false);
    assert.equal(
      (await analyzePost(request(JSON.stringify(birth)))).status,
      401,
    );
    assert.equal((await handlers.POST(request("{}"))).status, 503);
  } finally {
    if (original === undefined) delete process.env.AUTH_GITHUB_ID;
    else process.env.AUTH_GITHUB_ID = original;
  }
});
