import { createHash, randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import lockfile from "proper-lockfile";
import { z } from "zod";

const storeSchema = z.object({
  records: z.record(
    z.string(),
    z.object({
      key: z.string(),
      day: z.string(),
      count: z.number().int().nonnegative(),
      updatedAt: z.string(),
    }),
  ),
});
type QuotaFile = z.infer<typeof storeSchema>;
export type QuotaRecord = QuotaFile["records"][string];

function configuredLimit(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < 0)
    throw new Error(`${name} 须为非负整数`);
  return value;
}

export const LIMITS = {
  dailyLlm: configuredLimit("DAILY_LLM_LIMIT", 5),
  ipChartPerHour: configuredLimit("IP_CHART_LIMIT_PER_HOUR", 60),
  ipLlmPerHour: configuredLimit("IP_LLM_LIMIT_PER_HOUR", 10),
};

function storePath(): string {
  return (
    process.env.QUOTA_STORE_PATH ||
    path.join(process.cwd(), ".data", "quota.json")
  );
}

async function readStore(): Promise<QuotaFile> {
  try {
    return storeSchema.parse(
      JSON.parse(
        await fs.readFile(/* turbopackIgnore: true */ storePath(), "utf8"),
      ),
    );
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT")
      return { records: {} };
    // Corrupt data must not silently reset all limits.
    throw error;
  }
}

async function writeStore(data: QuotaFile): Promise<void> {
  const file = storePath();
  const temporary = `${file}.${randomUUID()}.tmp`;
  try {
    await fs.writeFile(temporary, JSON.stringify(data), {
      encoding: "utf8",
      mode: 0o600,
    });
    await fs.rename(temporary, file);
  } finally {
    await fs.rm(temporary, { force: true });
  }
}

async function withStore<T>(
  operation: (store: QuotaFile) => Promise<T>,
): Promise<T> {
  const file = storePath();
  await fs.mkdir(path.dirname(file), { recursive: true });
  const release = await lockfile.lock(file, {
    realpath: false,
    retries: { retries: 50, minTimeout: 20, maxTimeout: 100, randomize: true },
  });
  try {
    return await operation(await readStore());
  } finally {
    await release();
  }
}

export function hashIdentity(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 24);
}

async function consume(key: string, bucket: string, limit: number) {
  return withStore(async (store) => {
    const id = `${key}:${bucket}`;
    const count = store.records[id]?.count ?? 0;
    const resetHint = bucket.length === 10 ? "UTC 次日 00:00" : "UTC 下一整点";
    if (count >= limit)
      return { ok: false, remaining: 0, limit, resetHint, bucket };
    const cutoff = new Date(Date.now() - 2 * 86_400_000)
      .toISOString()
      .slice(0, 10);
    for (const [recordId, record] of Object.entries(store.records)) {
      if (record.day.slice(0, 10) < cutoff) delete store.records[recordId];
    }
    store.records[id] = {
      key,
      day: bucket,
      count: count + 1,
      updatedAt: new Date().toISOString(),
    };
    await writeStore(store);
    return { ok: true, remaining: limit - count - 1, limit, resetHint, bucket };
  });
}

export function consumeUserDailyLlm(userId: string) {
  return consume(
    `user:${hashIdentity(userId)}`,
    new Date().toISOString().slice(0, 10),
    LIMITS.dailyLlm,
  );
}

export function refundUserDailyLlm(userId: string, bucket: string) {
  return withStore(async (store) => {
    const record = store.records[`user:${hashIdentity(userId)}:${bucket}`];
    if (record && record.count > 0) {
      record.count -= 1;
      record.updatedAt = new Date().toISOString();
      await writeStore(store);
    }
  });
}

export function peekUserDailyLlm(userId: string) {
  return withStore(async (store) => {
    const day = new Date().toISOString().slice(0, 10);
    const used =
      store.records[`user:${hashIdentity(userId)}:${day}`]?.count ?? 0;
    return {
      used,
      remaining: Math.max(0, LIMITS.dailyLlm - used),
      limit: LIMITS.dailyLlm,
      day,
    };
  });
}

export function consumeIpChart(ip: string) {
  return consume(
    `ip-chart:${hashIdentity(ip)}`,
    new Date().toISOString().slice(0, 13),
    LIMITS.ipChartPerHour,
  );
}

export function consumeIpLlm(ip: string) {
  return consume(
    `ip-llm:${hashIdentity(ip)}`,
    new Date().toISOString().slice(0, 13),
    LIMITS.ipLlmPerHour,
  );
}
