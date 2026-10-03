import assert from "node:assert/strict";
import test from "node:test";
import { buildReading } from "../src/lib/reading";
import { buildReport } from "../src/lib/report";
import {
  buildAnalysisMessages,
  buildDeterministicAnalysis,
} from "../src/lib/llm/prompts";
import {
  enrichFigureRecord,
  loadHistoricalFigures,
} from "../src/lib/figures/load";
import { matchHistoricalFigures } from "../src/lib/figures/match";
import { GAN_WUXING, ZHI_WUXING } from "../src/lib/bazi/constants";
import { loadMingliCases } from "../src/lib/mingli-cases";

const input = {
  year: 1990,
  month: 5,
  day: 15,
  hour: 10,
  targetDate: "2026-10-03",
};

test("unknown hours contribute six known elements and no estimated strength", () => {
  const rows = loadHistoricalFigures().filter(
    (row) =>
      row.chartTags.source !== "curated" &&
      row.chartTags.elementCounts &&
      row.birth.hour == null,
  );
  assert.ok(rows.length > 20);
  for (const row of rows) {
    assert.equal(
      Object.values(row.chartTags.elementCounts!).reduce((a, b) => a + b, 0),
      6,
      row.name,
    );
    assert.equal(row.chartTags.hourPillar, undefined);
    assert.equal(row.chartTags.strength, "不明");
  }
  const row = rows[0];
  const result = enrichFigureRecord(row);
  const expected: Record<string, number> = {
    木: 0,
    火: 0,
    土: 0,
    金: 0,
    水: 0,
  };
  for (const pillar of [
    result.chartTags.yearPillar!,
    result.chartTags.monthPillar!,
    result.chartTags.dayPillar!,
  ]) {
    expected[GAN_WUXING[pillar[0]]]++;
    expected[ZHI_WUXING[pillar[1]]]++;
  }
  assert.deepEqual(result.chartTags.elementCounts, expected);
});

test("matching preserves counterexamples and links and reacts to changed birth", () => {
  const first = buildReading(input);
  const second = buildReading({ ...input, year: 1986, month: 5, day: 29 });
  assert.notEqual(
    first.chart.pillars.day.ganZhi,
    second.chart.pillars.day.ganZhi,
  );
  assert.notDeepEqual(
    first.matches.map((m) => [m.figure.id, m.score]),
    second.matches.map((m) => [m.figure.id, m.score]),
  );
  assert.equal(first.matches.length, 6);
  assert.ok(
    first.matches.some(
      (m) => m.figure.counterexample || m.figure.fitAssessment === "不符合",
    ),
  );
  assert.equal(new Set(first.matches.map((m) => m.figure.id)).size, 6);
  const ids = new Set(loadMingliCases().map((row) => row.id));
  first.matches.forEach((match) => {
    if (match.linkedCaseId) assert.ok(ids.has(match.linkedCaseId));
  });
  assert.equal(matchHistoricalFigures(first.features, { limit: 0 }).length, 1);
});

test("LLM receives calculated facts, observation date and actual matched biographies", () => {
  const reading = buildReading(input);
  const messages = buildAnalysisMessages(
    reading.chart,
    reading.biorhythm,
    "结构分析",
    reading.matches,
  );
  const facts = JSON.parse(messages[1].content);
  assert.equal(facts.observationDate, input.targetDate);
  assert.equal(
    facts.chart.pillars.day.ganZhi,
    reading.chart.pillars.day.ganZhi,
  );
  assert.equal(facts.matchedFigures[0].name, reading.matches[0].figure.name);
  assert.match(messages[0].content, /禁止自行推算/);
  const analysis = buildDeterministicAnalysis(reading.chart, reading.biorhythm);
  assert.match(analysis, /未纳入月令权重/);
  assert.match(analysis, /观测日 2026-10-03/);
  const report = buildReport(
    reading.chart,
    reading.biorhythm,
    reading.matches,
    analysis,
  );
  assert.match(report, /00:00 换日/);
  assert.match(report, /藏干/);
  assert.match(report, /相似分不是概率/);
});
