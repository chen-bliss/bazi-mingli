import assert from "node:assert/strict";
import test from "node:test";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  birthSchema,
  chartRequestSchema,
  analyzeRequestSchema,
} from "../src/lib/validation";
import { calculateBiorhythm } from "../src/lib/biorhythm";
import { buildBaZiChart } from "../src/lib/bazi";

const birth = { year: 1990, month: 5, day: 15, hour: 10, minute: 0 };
const exec = promisify(execFile);

test("rejects nonexistent dates, preserves leap days and inherited refinements", () => {
  for (const schema of [
    birthSchema,
    chartRequestSchema,
    analyzeRequestSchema,
  ]) {
    assert.equal(
      schema.safeParse({ ...birth, month: 2, day: 30 }).success,
      false,
    );
    assert.equal(
      schema.safeParse({ ...birth, year: 1900, month: 2, day: 29 }).success,
      false,
    );
    assert.equal(
      schema.safeParse({ ...birth, year: 2000, month: 2, day: 29 }).success,
      true,
    );
    assert.equal(
      schema.safeParse({ ...birth, month: 4, day: 31 }).success,
      false,
    );
  }
});

test("requires a real date-only target no earlier than birth", () => {
  for (const targetDate of [
    "2026-02-30",
    "invalid",
    "1990-05-14",
    "2026-10-03T00:00:00Z",
  ]) {
    assert.equal(
      chartRequestSchema.safeParse({ ...birth, targetDate }).success,
      false,
    );
  }
  assert.equal(
    chartRequestSchema.safeParse({ ...birth, targetDate: "1990-05-15" })
      .success,
    true,
  );
  assert.equal(
    chartRequestSchema.safeParse({ ...birth, dayBoundary: "other" }).success,
    false,
  );
});

test("birth day starts all three curves at zero and advances on calendar days", () => {
  const bio = calculateBiorhythm(birth, "1990-05-15", 30);
  assert.equal(bio.daysAlive, 0);
  assert.equal(bio.birthDate, "1990-05-15");
  assert.equal(bio.series.length, 31);
  assert.equal(bio.series[0].physical, 0);
  assert.equal(bio.series[30].date, "1990-06-14");
  assert.equal(bio.series[23].physical, 0);
  assert.throws(() => calculateBiorhythm(birth, new Date("invalid")), /无效/);
  assert.throws(() => calculateBiorhythm(birth, "1990-05-14"), /早于/);
  assert.throws(() => calculateBiorhythm(birth, "2026-10-03", 367), /范围/);
});

test("biorhythm is identical in four host time zones, including DST", async () => {
  const snapshots = await Promise.all(
    ["UTC", "Asia/Shanghai", "America/Los_Angeles", "Pacific/Kiritimati"].map(
      async (TZ) => {
        const { stdout } = await exec(
          process.execPath,
          ["--import", "tsx", "tests/fixtures/calendar-snapshot.ts"],
          { env: { ...process.env, TZ } },
        );
        return JSON.parse(stdout);
      },
    ),
  );
  snapshots.forEach((snapshot) => assert.deepEqual(snapshot, snapshots[0]));
  assert.equal(snapshots[0].birthDate, "2000-02-29");
  assert.equal(snapshots[0].targetDate, "2026-03-07");
  assert.equal(snapshots[0].series[2].date, "2026-03-09");
});

test("late Zi-hour follows selected boundary; default remains midnight", () => {
  const before = buildBaZiChart({ ...birth, hour: 22 });
  const midnight = buildBaZiChart({ ...birth, hour: 23 });
  const zi = buildBaZiChart({ ...birth, hour: 23, dayBoundary: "zi-hour" });
  const next = buildBaZiChart({ ...birth, day: 16, hour: 0 });
  assert.equal(before.pillars.day.ganZhi, midnight.pillars.day.ganZhi);
  assert.equal(zi.pillars.day.ganZhi, next.pillars.day.ganZhi);
  assert.notEqual(zi.pillars.day.ganZhi, midnight.pillars.day.ganZhi);
  assert.equal(midnight.calculation.dayBoundary, "midnight");
  for (const pillar of Object.values(midnight.pillars))
    assert.equal(pillar.hiddenStems.length, pillar.shiShenZhi.length);
  assert.equal(
    Object.values(midnight.wuXingCount).reduce((a, b) => a + b, 0),
    8,
  );
  assert.throws(
    () => buildBaZiChart({ ...birth, month: 2, day: 30 }),
    /不存在/,
  );
});
