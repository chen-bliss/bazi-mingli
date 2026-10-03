import { GAN_WUXING, ZHI_WUXING } from "../bazi/constants";
import { isValidCalendarDate } from "../dates";
import { buildBaZiChart } from "@/lib/bazi";
import raw from "../../../data/historical-figures.json";
import { seasonalityOfZhi, yinYangOfGan } from "./features";
import type { BirthCertainty, ChartTags, HistoricalFigure } from "./types";

function precisionToCertainty(
  precision: HistoricalFigure["birth"]["precision"],
): BirthCertainty {
  if (precision === "exact-date") return "exact";
  if (precision === "year-month" || precision === "year-only")
    return "year-only";
  if (precision === "uncertain") return "disputed";
  return "legendary";
}

function canComputeDay(fig: HistoricalFigure): boolean {
  const { year, month, day, precision, birthCertainty } = fig.birth;
  if (year == null || month == null || day == null) return false;
  if (birthCertainty === "legendary" || birthCertainty === "year-only")
    return false;
  if (
    fig.birth.calendar !== "gregorian" ||
    !isValidCalendarDate(year, month, day)
  )
    return false;
  // lunar-javascript 对过早日期可能不稳
  if (year < 1600) return false;
  return precision === "exact-date" || precision === "uncertain";
}

export function enrichFigureRecord(fig: HistoricalFigure): HistoricalFigure {
  const birthCertainty =
    fig.birth.birthCertainty ?? precisionToCertainty(fig.birth.precision);
  const withCertainty: HistoricalFigure = {
    ...fig,
    kind: fig.kind ?? "figure",
    gender: fig.gender ?? "unknown",
    country: fig.country ?? "未知",
    birth: { ...fig.birth, birthCertainty },
    fitDetail: fig.fitDetail ?? {
      fitsNarrative:
        fig.fitAssessment === "符合"
          ? true
          : fig.fitAssessment === "不符合"
            ? false
            : "partial",
      tensionNotes: fig.analysisNotes,
    },
    biorhythmNote:
      fig.biorhythmNote ??
      "经典 23/28/33 日节律仅作文化对照，不构成对该人物生平的科学解释。",
  };

  if (!canComputeDay(withCertainty)) {
    return {
      ...withCertainty,
      baziFeatures: withCertainty.chartTags,
    };
  }

  const { year, month, day } = withCertainty.birth;
  if (year == null || month == null || day == null) return withCertainty;

  try {
    // 时辰未知时用正午仅提取日柱与月令层面特征，不写入伪造时柱结论
    const chart = buildBaZiChart({
      year,
      month,
      day,
      hour: withCertainty.birth.hour ?? 12,
      minute: 0,
    });
    const hourKnown = withCertainty.birth.hour != null;
    const elementCounts = { ...chart.wuXingCount };
    if (!hourKnown) {
      elementCounts[GAN_WUXING[chart.pillars.hour.gan]] -= 1;
      elementCounts[ZHI_WUXING[chart.pillars.hour.zhi]] -= 1;
    }
    const dominant = Object.entries(elementCounts)
      .sort((a, b) => b[1] - a[1])
      .filter(([, n]) => n > 0)
      .slice(0, 2)
      .map(([k]) => k);

    const chartTags = {
      ...withCertainty.chartTags,
      dayMaster: chart.dayMaster,
      dayMasterWuXing: chart.dayMasterWuXing,
      dayPillar: chart.pillars.day.ganZhi,
      yearPillar: chart.pillars.year.ganZhi,
      monthPillar: chart.pillars.month.ganZhi,
      hourPillar:
        withCertainty.birth.hour == null
          ? undefined
          : chart.pillars.hour.ganZhi,
      dayMasterYinYang: yinYangOfGan(chart.pillars.day.gan),
      seasonality: seasonalityOfZhi(chart.pillars.month.zhi),
      strength: hourKnown ? chart.strength.label : "不明",
      dominantWuXing: dominant,
      elementCounts,
      shiShenTendency: Array.from(
        new Set(
          [
            chart.pillars.year.shiShenGan,
            chart.pillars.month.shiShenGan,
            ...(withCertainty.chartTags.shiShenTendency ?? []),
          ].filter((x) => x && x !== "日主"),
        ),
      ).slice(0, 4),
      hourKnown: withCertainty.birth.hour != null,
      source: (withCertainty.chartTags.source === "curated"
        ? "mixed"
        : "computed") as ChartTags["source"],
      confidence: (withCertainty.birth.precision === "exact-date" &&
      withCertainty.birth.hour != null
        ? "high"
        : withCertainty.birth.precision === "exact-date"
          ? "medium"
          : "low") as ChartTags["confidence"],
      patternTags: Array.from(
        new Set([...(withCertainty.chartTags.patternTags ?? []), "日柱可计算"]),
      ),
    } satisfies ChartTags;

    return {
      ...withCertainty,
      chartTags,
      baziFeatures: chartTags,
    };
  } catch {
    return {
      ...withCertainty,
      baziFeatures: withCertainty.chartTags,
    };
  }
}

let cache: HistoricalFigure[] | null = null;

export function loadHistoricalFigures(): HistoricalFigure[] {
  if (!cache) {
    cache = (raw as HistoricalFigure[]).map(enrichFigureRecord);
  }
  return cache;
}

export function getFigureById(id: string): HistoricalFigure | undefined {
  return loadHistoricalFigures().find((f) => f.id === id);
}

export function listFigureStats() {
  const all = loadHistoricalFigures();
  const fit: Record<string, number> = {};
  const genders: Record<string, number> = {};
  const countries: Record<string, number> = {};
  for (const f of all) {
    fit[f.fitAssessment] = (fit[f.fitAssessment] ?? 0) + 1;
    genders[f.gender] = (genders[f.gender] ?? 0) + 1;
    countries[f.country] = (countries[f.country] ?? 0) + 1;
  }
  return {
    total: all.length,
    counterexamples: all.filter((f) => f.counterexample).length,
    fitAssessment: fit,
    genders,
    countries: Object.keys(countries).sort(),
    countryCount: Object.keys(countries).length,
    fields: Array.from(new Set(all.flatMap((f) => f.field))).sort(),
    female: all.filter((f) => f.gender === "female").length,
    withComputableDay: all.filter(
      (f) => f.chartTags.dayMaster && f.chartTags.dayMaster !== "不明",
    ).length,
  };
}
