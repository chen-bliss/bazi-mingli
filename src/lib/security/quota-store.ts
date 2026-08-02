import { createHash } from "crypto";
import { promises as fs } from "fs";
import path from "path";

export interface QuotaRecord {
  key: string;
  day: string;
  count: number;
  updatedAt: string;
}

interface QuotaFile {
  records: Record<string, QuotaRecord>;
}

const DEFAULT_DAILY_LLM_LIMIT = Number(process.env.DAILY_LLM_LIMIT ?? 5);
const DEFAULT_IP_CHART_LIMIT = Number(process.env.IP_CHART_LIMIT_PER_HOUR ?? 60);
const DEFAULT_IP_LLM_LIMIT = Number(process.env.IP_LLM_LIMIT_PER_HOUR ?? 10);

function utcDay(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

function utcHour(d = new Date()): string {
  return d.toISOString().slice(0, 13);
}

function storePath(): string {
  return path.join(process.cwd(), ".data", "quota.json");
}

async function readStore(): Promise<QuotaFile> {
  try {
    const raw = await fs.readFile(storePath(), "utf8");
    return JSON.parse(raw) as QuotaFile;
  } catch {
    return { records: {} };
  }
}

async function writeStore(data: QuotaFile): Promise<void> {
  const dir = path.dirname(storePath());
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(storePath(), JSON.stringify(data, null, 2), "utf8");
}

export function hashIdentity(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 24);
}

async function consume(
  key: string,
  bucket: string,
  limit: number,
): Promise<{ ok: boolean; remaining: number; limit: number; resetHint: string }> {
  const store = await readStore();
  const id = `${key}:${bucket}`;
  const current = store.records[id];
  const count = current && current.day === bucket ? current.count : 0;
  if (count >= limit) {
    return {
      ok: false,
      remaining: 0,
      limit,
      resetHint: bucket.length === 10 ? "UTC 次日 00:00" : "下一整点",
    };
  }
  store.records[id] = {
    key,
    day: bucket,
    count: count + 1,
    updatedAt: new Date().toISOString(),
  };
  await writeStore(store);
  return {
    ok: true,
    remaining: Math.max(0, limit - count - 1),
    limit,
    resetHint: bucket.length === 10 ? "UTC 次日 00:00" : "下一整点",
  };
}

export async function consumeUserDailyLlm(userId: string) {
  return consume(`user:${hashIdentity(userId)}`, utcDay(), DEFAULT_DAILY_LLM_LIMIT);
}

export async function peekUserDailyLlm(userId: string) {
  const store = await readStore();
  const id = `user:${hashIdentity(userId)}:${utcDay()}`;
  // records keyed as key:bucket in consume — rebuild:
  const key = `user:${hashIdentity(userId)}`;
  const bucket = utcDay();
  const record = store.records[`${key}:${bucket}`];
  const count = record?.count ?? 0;
  return {
    used: count,
    remaining: Math.max(0, DEFAULT_DAILY_LLM_LIMIT - count),
    limit: DEFAULT_DAILY_LLM_LIMIT,
    day: bucket,
  };
}

export async function consumeIpChart(ip: string) {
  return consume(`ip-chart:${hashIdentity(ip)}`, utcHour(), DEFAULT_IP_CHART_LIMIT);
}

export async function consumeIpLlm(ip: string) {
  return consume(`ip-llm:${hashIdentity(ip)}`, utcHour(), DEFAULT_IP_LLM_LIMIT);
}

export const LIMITS = {
  dailyLlm: DEFAULT_DAILY_LLM_LIMIT,
  ipChartPerHour: DEFAULT_IP_CHART_LIMIT,
  ipLlmPerHour: DEFAULT_IP_LLM_LIMIT,
};
