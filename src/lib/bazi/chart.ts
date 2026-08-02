import { Solar } from "lunar-javascript";
import {
  GAN_WUXING,
  WUXING,
  ZHI_WUXING,
  type WuXing,
} from "./constants";
import type { BaZiChart, BirthInput, PillarInfo } from "./types";

function buildPillar(
  ganZhi: string,
  gan: string,
  zhi: string,
  naYin: string,
  wuXing: string,
  shiShenGan: string,
  shiShenZhi: string[],
): PillarInfo {
  return { ganZhi, gan, zhi, naYin, wuXing, shiShenGan, shiShenZhi };
}

function countWuXing(pillars: BaZiChart["pillars"]): Record<WuXing, number> {
  const count = Object.fromEntries(WUXING.map((w) => [w, 0])) as Record<
    WuXing,
    number
  >;
  for (const p of Object.values(pillars)) {
    const ganWx = GAN_WUXING[p.gan];
    const zhiWx = ZHI_WUXING[p.zhi];
    if (ganWx) count[ganWx] += 1;
    if (zhiWx) count[zhiWx] += 1;
  }
  return count;
}

/** 生克关系：木生火、火生土、土生金、金生水、水生木 */
const SHENG: Record<WuXing, WuXing> = {
  木: "火",
  火: "土",
  土: "金",
  金: "水",
  水: "木",
};

const KE: Record<WuXing, WuXing> = {
  木: "土",
  火: "金",
  土: "水",
  金: "木",
  水: "火",
};

function estimateStrength(
  dayMasterWx: WuXing,
  wuXingCount: Record<WuXing, number>,
): BaZiChart["strength"] {
  const same = wuXingCount[dayMasterWx];
  const print = Object.entries(SHENG).find(([, v]) => v === dayMasterWx)?.[0] as
    | WuXing
    | undefined;
  const printScore = print ? wuXingCount[print] : 0;
  const score = same * 1.2 + printScore * 1.0;
  let label: BaZiChart["strength"]["label"] = "中和";
  if (score <= 2.2) label = "偏弱";
  else if (score >= 4.2) label = "偏强";

  const summary =
    label === "偏弱"
      ? `日主${dayMasterWx}气势偏弱，宜参看印比帮身与调候。`
      : label === "偏强"
        ? `日主${dayMasterWx}气势偏旺，宜参看财官食伤泄耗。`
        : `日主${dayMasterWx}气势大致中和，宜细看月令与透干再定用神。`;

  return { label, score: Number(score.toFixed(2)), summary };
}

function suggestUsefulGods(
  dayMasterWx: WuXing,
  strength: BaZiChart["strength"]["label"],
): string[] {
  if (strength === "偏弱") {
    return [
      `${dayMasterWx}（比劫帮身）`,
      `${Object.entries(SHENG).find(([, v]) => v === dayMasterWx)?.[0] ?? "印"}（印星生身）`,
    ];
  }
  if (strength === "偏强") {
    return [
      `${KE[dayMasterWx]}（财星泄耗）`,
      `${SHENG[dayMasterWx]}（食伤泄秀）`,
      `${Object.entries(KE).find(([, v]) => v === dayMasterWx)?.[0] ?? "官杀"}（官杀制身）`,
    ];
  }
  return ["以月令喜用为主，兼看调候与通关"];
}

function classicalHints(
  dayMaster: string,
  dayMasterWx: WuXing,
  strength: BaZiChart["strength"]["label"],
): string[] {
  return [
    `《渊海子平》以日干为我，先看月令提纲，再察透干与地支藏干。本日干为${dayMaster}（${dayMasterWx}）。`,
    `《滴天髓》云“能知衰旺之真机，其于三命之奥，思过半矣”，当前强弱倾向作“${strength}”处理，仅供入门定位。`,
    `《三命通会》强调干支生克制化、刑冲合害并参，排盘后宜结合大运流年，不可单凭日主强弱断事。`,
    `子平法以“用神”为枢纽：用神得力则格局清，用神受破则需寻通关与调候。`,
  ];
}

export function buildBaZiChart(input: BirthInput): BaZiChart {
  const minute = input.minute ?? 0;
  const solar = Solar.fromYmdHms(
    input.year,
    input.month,
    input.day,
    input.hour,
    minute,
    0,
  );
  const lunar = solar.getLunar();
  const ec = lunar.getEightChar();

  const pillars = {
    year: buildPillar(
      ec.getYear(),
      ec.getYearGan(),
      ec.getYearZhi(),
      ec.getYearNaYin(),
      ec.getYearWuXing(),
      ec.getYearShiShenGan(),
      ec.getYearShiShenZhi(),
    ),
    month: buildPillar(
      ec.getMonth(),
      ec.getMonthGan(),
      ec.getMonthZhi(),
      ec.getMonthNaYin(),
      ec.getMonthWuXing(),
      ec.getMonthShiShenGan(),
      ec.getMonthShiShenZhi(),
    ),
    day: buildPillar(
      ec.getDay(),
      ec.getDayGan(),
      ec.getDayZhi(),
      ec.getDayNaYin(),
      ec.getDayWuXing(),
      "日主",
      ec.getDayShiShenZhi(),
    ),
    hour: buildPillar(
      ec.getTime(),
      ec.getTimeGan(),
      ec.getTimeZhi(),
      ec.getTimeNaYin(),
      ec.getTimeWuXing(),
      ec.getTimeShiShenGan(),
      ec.getTimeShiShenZhi(),
    ),
  };

  const dayMaster = ec.getDayGan();
  const dayMasterWuXing = GAN_WUXING[dayMaster];
  const wuXingCount = countWuXing(pillars);
  const strength = estimateStrength(dayMasterWuXing, wuXingCount);

  return {
    solarDate: `${input.year}-${String(input.month).padStart(2, "0")}-${String(input.day).padStart(2, "0")} ${String(input.hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
    lunarDate: lunar.toString(),
    shengXiao: lunar.getYearShengXiao(),
    dayMaster,
    dayMasterWuXing,
    pillars,
    wuXingCount,
    strength,
    usefulGods: suggestUsefulGods(dayMasterWuXing, strength.label),
    classicalHints: classicalHints(dayMaster, dayMasterWuXing, strength.label),
  };
}
