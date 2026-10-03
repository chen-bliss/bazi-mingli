import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createServer } from "node:http";
import {
  consumeUserDailyLlm,
  peekUserDailyLlm,
  refundUserDailyLlm,
} from "../src/lib/security/quota-store";
import { analyzeReading } from "../src/lib/analysis";
import { analyzeRequestSchema } from "../src/lib/validation";

const exec = promisify(execFile);

test("shared file preserves the daily limit across concurrent processes", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "bazi-quota-"));
  const file = path.join(dir, "quota.json");
  process.env.QUOTA_STORE_PATH = file;
  try {
    const groups = await Promise.all(
      Array.from({ length: 4 }, async () => {
        const { stdout } = await exec(
          process.execPath,
          ["--import", "tsx", "tests/fixtures/quota-worker.ts"],
          { env: { ...process.env, QUOTA_STORE_PATH: file } },
        );
        return JSON.parse(stdout) as Array<{ ok: boolean; remaining: number }>;
      }),
    );
    const accepted = groups.flat().filter((result) => result.ok);
    assert.equal(accepted.length, 5);
    assert.deepEqual(
      accepted.map((result) => result.remaining).sort(),
      [0, 1, 2, 3, 4],
    );
    assert.equal((await peekUserDailyLlm("shared-user")).used, 5);
    await refundUserDailyLlm(
      "shared-user",
      new Date().toISOString().slice(0, 10),
    );
    assert.equal((await peekUserDailyLlm("shared-user")).remaining, 1);
    assert.equal((await consumeUserDailyLlm("shared-user")).ok, true);
    const saved = JSON.parse(await readFile(file, "utf8"));
    assert.equal(Object.values(saved.records).length, 1);
    await writeFile(file, "broken JSON");
    await assert.rejects(consumeUserDailyLlm("shared-user"));
    assert.equal(await readFile(file, "utf8"), "broken JSON");
  } finally {
    await rm(dir, { recursive: true, force: true });
    delete process.env.QUOTA_STORE_PATH;
  }
});

test("only successful model calls consume daily quota; empty output is refunded", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "bazi-analysis-"));
  process.env.QUOTA_STORE_PATH = path.join(dir, "quota.json");
  const savedEnv = {
    key: process.env.LLM_API_KEY,
    model: process.env.LLM_MODEL,
    url: process.env.LLM_BASE_URL,
  };
  let calls = 0;
  let empty = false;
  const server = createServer((request, response) => {
    calls++;
    request.resume();
    request.on("end", () => {
      response.setHeader("Content-Type", "application/json");
      response.end(
        JSON.stringify({
          choices: [
            {
              message: {
                role: "assistant",
                content: empty ? "" : "测试模型解读",
              },
              finish_reason: "stop",
            },
          ],
        }),
      );
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  try {
    const input = analyzeRequestSchema.parse({
      year: 1990,
      month: 5,
      day: 15,
      hour: 10,
      targetDate: "2026-10-03",
    });
    delete process.env.LLM_API_KEY;
    const local = await analyzeReading("model-user", input);
    assert.ok(local.ok);
    assert.equal(local.mode, "deterministic");
    assert.equal(local.userQuota.used, 0);
    process.env.LLM_API_KEY = "test-key";
    process.env.LLM_MODEL = "test-model";
    process.env.LLM_BASE_URL = `http://127.0.0.1:${address.port}/v1`;
    const success = await analyzeReading("model-user", input);
    assert.ok(success.ok);
    assert.equal(success.mode, "llm");
    assert.equal(success.userQuota.used, 1);
    assert.equal(success.matches.length, 6);
    empty = true;
    await assert.rejects(analyzeReading("model-user", input), /空内容/);
    assert.equal((await peekUserDailyLlm("model-user")).used, 1);
    const localAgain = await analyzeReading("model-user", {
      ...input,
      useLlm: false,
    });
    assert.ok(localAgain.ok);
    assert.equal(localAgain.userQuota.used, 1);
    assert.equal(calls, 2);
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((err) => (err ? reject(err) : resolve())),
    );
    for (const [key, value] of Object.entries({
      LLM_API_KEY: savedEnv.key,
      LLM_MODEL: savedEnv.model,
      LLM_BASE_URL: savedEnv.url,
    })) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    await rm(dir, { recursive: true, force: true });
    delete process.env.QUOTA_STORE_PATH;
  }
});
