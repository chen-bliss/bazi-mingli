import { buildBaZiChart } from "../src/lib/bazi";
import { calculateBiorhythm } from "../src/lib/biorhythm";
import {
  featuresFromChart,
  listFigureStats,
  matchHistoricalFigures,
} from "../src/lib/figures";
import { buildDeterministicAnalysis } from "../src/lib/llm/prompts";

const chart = buildBaZiChart({
  year: 1990,
  month: 5,
  day: 15,
  hour: 10,
  minute: 0,
});

const bio = calculateBiorhythm(
  { year: 1990, month: 5, day: 15 },
  new Date("2026-08-02"),
  14,
);

const text = buildDeterministicAnalysis(chart, bio);
const features = featuresFromChart(chart, { hourKnown: true, biorhythm: bio });
const matches = matchHistoricalFigures(features, { limit: 6 });
const stats = listFigureStats();

if (!chart.pillars.day.ganZhi) throw new Error("missing day pillar");
if (bio.today.physical.periodDays !== 23) throw new Error("bad physical period");
if (!text.includes("滴天髓") && !text.includes("渊海")) {
  throw new Error("analysis missing classics");
}
if (stats.total < 40) throw new Error("figures seed too small");
if ((stats.female ?? 0) < 8) throw new Error("female coverage too thin");
if ((stats.countryCount ?? 0) < 8) throw new Error("country coverage too thin");
if (!matches.length) throw new Error("no matches");
if (!matches.some((m) => m.figure.counterexample || m.figure.fitAssessment === "不符合")) {
  console.warn("warning: no counterexample in top matches (still ok if pool thin)");
}
if (!features.elementCounts || !features.dayMasterYinYang) {
  throw new Error("features missing element/yinYang fields");
}

console.log("smoke ok");
console.log("dayMaster", chart.dayMaster, chart.pillars.day.ganZhi);
console.log(
  "bio",
  bio.today.physical.percent,
  bio.today.emotional.percent,
  bio.today.intellectual.percent,
);
console.log("figures", stats.total, "counterexamples", stats.counterexamples);
console.log(
  "matches",
  matches.map((m) => `${m.figure.name}:${m.score}`).join(" | "),
);
