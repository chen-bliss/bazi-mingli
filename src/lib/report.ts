import type { BaZiChart } from "./bazi";
import type { BiorhythmResult } from "./biorhythm";
import type { FigureMatch } from "./figures";

export function buildReport(
  chart: BaZiChart,
  bio: BiorhythmResult,
  matches: FigureMatch[],
  analysis = "",
): string {
  return [
    "# 八字命理 · 文化研习报告",
    "",
    `出生：${chart.solarDate} · ${chart.lunarDate}`,
    `观测日期：${bio.targetDate} · 已历 ${bio.daysAlive} 日`,
    `换日规则：${chart.calculation.dayBoundary === "midnight" ? "00:00 换日" : "23:00 子初换日"}`,
    chart.calculation.timeBasis,
    "",
    "## 四柱",
    "",
    "| 柱 | 干支 | 纳音 | 五行 | 天干十神 | 藏干 / 十神 |",
    "| --- | --- | --- | --- | --- | --- |",
    ...(["year", "month", "day", "hour"] as const).map((key, i) => {
      const p = chart.pillars[key];
      return `| ${["年", "月", "日", "时"][i]} | ${p.ganZhi} | ${p.naYin} | ${p.wuXing} | ${p.shiShenGan} | ${p.hiddenStems.map((gan, index) => `${gan}（${p.shiShenZhi[index]}）`).join("、")} |`;
    }),
    "",
    `日主：${chart.dayMaster}（${chart.dayMasterWuXing}）；强弱初判：${chart.strength.label}`,
    `五行表层计数：${Object.entries(chart.wuXingCount)
      .map(([w, n]) => `${w}${n}`)
      .join("、")}`,
    `喜用倾向：${chart.usefulGods.join("、")}`,
    chart.calculation.strengthMethod,
    "",
    "## 生物节律",
    "",
    ...[bio.today.physical, bio.today.emotional, bio.today.intellectual].map(
      (c) =>
        `- ${c.name}：${c.percent}% · ${c.phase}（${c.periodDays} 日周期）`,
    ),
    bio.scientificCaveat,
    "",
    "## 相似人物（类比检索）",
    "",
    ...matches.map(
      (m) =>
        `- ${m.figure.name} · 相似分 ${m.score} · ${m.figure.fitAssessment}\n  ${m.reasons.join("；")}\n  ${m.caveats.join("；")}`,
    ),
    "",
    ...(analysis ? ["## 综合演算", "", analysis, ""] : []),
    "仅供传统文化与教育研习。相似分不是概率；人物相似不等于命运复现，不构成医疗、法律或投资建议。",
  ].join("\n");
}
