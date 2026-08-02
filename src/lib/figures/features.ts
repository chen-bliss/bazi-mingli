import type { BaZiChart } from "@/lib/bazi";
import type { BiorhythmResult } from "@/lib/biorhythm";
import { WUXING, type WuXing } from "@/lib/bazi/constants";
import type { ChartFeatures, StrengthLabel } from "./types";

const YANG_GAN = new Set(["甲", "丙", "戊", "庚", "壬"]);

const SEASON_BY_ZHI: Record<
  string,
  ChartFeatures["seasonality"]
> = {
  寅: "春",
  卯: "春",
  辰: "土季",
  巳: "夏",
  午: "夏",
  未: "土季",
  申: "秋",
  酉: "秋",
  戌: "土季",
  亥: "冬",
  子: "冬",
  丑: "土季",
};

function topWuXing(count: Record<WuXing, number>, n = 2): string[] {
  return [...WUXING]
    .map((w) => [w, count[w]] as const)
    .sort((a, b) => b[1] - a[1])
    .filter(([, c]) => c > 0)
    .slice(0, n)
    .map(([w]) => w);
}

function shiShenFromChart(chart: BaZiChart): string[] {
  const values = [
    chart.pillars.year.shiShenGan,
    chart.pillars.month.shiShenGan,
    chart.pillars.hour.shiShenGan,
    ...chart.pillars.year.shiShenZhi,
    ...chart.pillars.month.shiShenZhi,
    ...chart.pillars.day.shiShenZhi,
    ...chart.pillars.hour.shiShenZhi,
  ].filter((x) => x && x !== "日主");

  const freq = new Map<string, number>();
  for (const v of values) freq.set(v, (freq.get(v) ?? 0) + 1);
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([k]) => k);
}

function patternTagsFromChart(chart: BaZiChart): string[] {
  const tags = [
    `日主${chart.dayMaster}`,
    `日主${chart.dayMasterWuXing}`,
    chart.strength.label,
  ];
  if (chart.usefulGods.length) tags.push("有喜用倾向");
  const dom = topWuXing(chart.wuXingCount, 1)[0];
  if (dom) tags.push(`${dom}气偏显`);
  return tags;
}

export function yinYangOfGan(gan: string): "阳" | "阴" {
  return YANG_GAN.has(gan) ? "阳" : "阴";
}

export function seasonalityOfZhi(zhi: string): ChartFeatures["seasonality"] {
  return SEASON_BY_ZHI[zhi] ?? "不明";
}

export function featuresFromChart(
  chart: BaZiChart,
  options?: { hourKnown?: boolean; biorhythm?: BiorhythmResult },
): ChartFeatures {
  const dayGan = chart.pillars.day.gan;
  const monthZhi = chart.pillars.month.zhi;
  return {
    dayMaster: chart.dayMaster,
    dayMasterWuXing: chart.dayMasterWuXing,
    dayPillar: chart.pillars.day.ganZhi,
    dayMasterYinYang: yinYangOfGan(dayGan),
    seasonality: seasonalityOfZhi(monthZhi),
    strength: chart.strength.label as StrengthLabel,
    dominantWuXing: topWuXing(chart.wuXingCount, 2),
    elementCounts: { ...chart.wuXingCount },
    shiShenTendency: shiShenFromChart(chart),
    patternTags: patternTagsFromChart(chart),
    hourKnown: options?.hourKnown ?? true,
    biorhythmProfile: options?.biorhythm
      ? {
          physicalPhase: options.biorhythm.today.physical.phase,
          emotionalPhase: options.biorhythm.today.emotional.phase,
          intellectualPhase: options.biorhythm.today.intellectual.phase,
        }
      : undefined,
  };
}
