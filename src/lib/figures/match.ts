import { WUXING } from "@/lib/bazi/constants";
import type {
  ChartFeatures,
  FigureMatch,
  HistoricalFigure,
  MatchExplanation,
} from "./types";
import { loadHistoricalFigures } from "./load";

function overlapScore(
  a: string[] = [],
  b: string[] = [],
  weight: number,
): {
  score: number;
  hits: string[];
} {
  const setB = new Set(b);
  const hits = a.filter((x) => setB.has(x));
  if (!a.length || !b.length) return { score: 0, hits: [] };
  const ratio = hits.length / Math.max(a.length, 1);
  return { score: ratio * weight, hits };
}

function toVector(counts?: Record<string, number>): number[] {
  return WUXING.map((w) => counts?.[w] ?? 0);
}

/** 余弦相似度，映射到 [0,1] 权重贡献 */
function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

function scoreFigure(
  features: ChartFeatures,
  figure: HistoricalFigure,
): MatchExplanation {
  const tags = figure.chartTags;
  let score = 0;
  const reasons: string[] = [];
  const caveats: string[] = [
    "相似匹配是结构类比与文化对照，不是命运复现或因果证明。详见 PRIOR_ART.md。",
  ];

  const certainty = figure.birth.birthCertainty;
  const computable =
    certainty !== "year-only" &&
    tags.dayMaster &&
    tags.dayMaster !== "不明" &&
    features.dayMaster &&
    certainty !== "legendary";

  if (computable && tags.dayMaster === features.dayMaster) {
    score += 26;
    reasons.push(`日主同为${features.dayMaster}`);
  } else if (
    computable &&
    tags.dayMasterWuXing &&
    tags.dayMasterWuXing === features.dayMasterWuXing
  ) {
    score += 13;
    reasons.push(`日主五行同属${features.dayMasterWuXing}`);
  }

  if (
    computable &&
    tags.dayPillar &&
    tags.dayPillar === features.dayPillar &&
    tags.dayPillar !== "不明"
  ) {
    score += 16;
    reasons.push(`日柱同为${features.dayPillar}`);
  }

  if (
    computable &&
    tags.dayMasterYinYang &&
    tags.dayMasterYinYang === features.dayMasterYinYang
  ) {
    score += 5;
    reasons.push(`日干阴阳同为${features.dayMasterYinYang}`);
  }

  if (
    computable &&
    tags.seasonality &&
    tags.seasonality !== "不明" &&
    tags.seasonality === features.seasonality
  ) {
    score += 6;
    reasons.push(`月令季节同类（${features.seasonality}）`);
  }

  if (
    computable &&
    tags.strength &&
    tags.strength !== "不明" &&
    tags.strength === features.strength
  ) {
    score += 7;
    reasons.push(`强弱倾向同为${tags.strength}`);
  }

  const cos = cosineSimilarity(
    toVector(features.elementCounts),
    toVector(tags.elementCounts),
  );
  if (computable && cos > 0.55) {
    const contrib = Number((cos * 14).toFixed(2));
    score += contrib;
    reasons.push(`五行向量余弦相近（${cos.toFixed(2)}）`);
  } else if (computable) {
    const wx = overlapScore(
      features.dominantWuXing,
      tags.dominantWuXing ?? [],
      10,
    );
    if (wx.hits.length) {
      score += wx.score;
      reasons.push(`五行偏显相近：${wx.hits.join("、")}`);
    }
  }

  const ss = overlapScore(
    features.shiShenTendency,
    tags.shiShenTendency ?? [],
    14,
  );
  if (computable && ss.hits.length) {
    score += ss.score;
    reasons.push(`十神倾向重叠：${ss.hits.join("、")}`);
  }

  const pt = overlapScore(features.patternTags, tags.patternTags ?? [], 8);
  if (pt.hits.length) {
    score += pt.score;
    reasons.push(`叙事标签相近：${pt.hits.slice(0, 3).join("、")}`);
  }

  // 置信度与时辰缺失降权
  if (certainty === "year-only") {
    score *= 0.55;
    caveats.push("仅有年份级出生信息，不使用日柱和五行计数匹配。");
  } else if (certainty === "legendary" || tags.confidence === "low") {
    score *= 0.68;
    caveats.push("该人物出生信息置信较低、存疑或时辰未知，匹配已降权。");
  } else if (certainty === "disputed" || tags.confidence === "medium") {
    score *= 0.88;
    caveats.push("时辰未知或日期存疑，仅日主或日柱层特征参与较高权重。");
  }

  if (!tags.hourKnown) {
    score *= 0.9;
    caveats.push("出生时辰未知，未使用假定时柱，五行仅统计已知三柱。");
  }

  if (!computable) {
    score *= 0.5;
    caveats.push("缺乏可计算日柱，主要依据叙事标签弱匹配；不会伪造出生数据。");
  }

  if (figure.fitAssessment === "不符合" || figure.counterexample) {
    reasons.push("标注为推演不符合或反例，请优先阅读张力说明。");
    if (figure.fitDetail?.tensionNotes) {
      caveats.push(figure.fitDetail.tensionNotes);
    }
  } else if (figure.fitAssessment === "资料不足") {
    caveats.push("资料不足：不宜把匹配当作验证。");
  } else if (figure.fitDetail?.fitsNarrative === "partial") {
    caveats.push(figure.fitDetail.tensionNotes);
  }

  if (!reasons.length) {
    reasons.push("仅有较弱的标签邻近性。");
  }

  return {
    score: Number(score.toFixed(2)),
    reasons,
    caveats: Array.from(new Set(caveats)).slice(0, 4),
  };
}

export function matchHistoricalFigures(
  features: ChartFeatures,
  options?: { limit?: number; includeCounterexamples?: boolean },
): FigureMatch[] {
  const requestedLimit = options?.limit ?? 6;
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(12, Math.max(1, Math.floor(requestedLimit)))
    : 6;
  const all = loadHistoricalFigures();

  const ranked = all
    .map((figure) => {
      const expl = scoreFigure(features, figure);
      return { figure, ...expl };
    })
    .sort((a, b) => b.score - a.score);

  const top = ranked.filter((m) => m.score > 0).slice(0, limit);

  // 保证至少纳入一个反例（若库中存在且未进 Top）
  if (options?.includeCounterexamples !== false) {
    const hasCounter = top.some(
      (m) => m.figure.counterexample || m.figure.fitAssessment === "不符合",
    );
    if (!hasCounter) {
      const counter = ranked.find(
        (m) =>
          m.score > 0 &&
          (m.figure.counterexample || m.figure.fitAssessment === "不符合"),
      );
      if (counter) {
        if (top.length >= limit) top.pop();
        top.push(counter);
        top.sort((a, b) => b.score - a.score);
      }
    }
  }

  return top;
}

export function browseFigures(filters?: {
  field?: string;
  fitAssessment?: string;
  gender?: string;
  country?: string;
  q?: string;
}): HistoricalFigure[] {
  let rows = loadHistoricalFigures();
  if (filters?.field) {
    rows = rows.filter((f) => f.field.includes(filters.field!));
  }
  if (filters?.fitAssessment) {
    rows = rows.filter((f) => f.fitAssessment === filters.fitAssessment);
  }
  if (filters?.gender) {
    rows = rows.filter((f) => f.gender === filters.gender);
  }
  if (filters?.country) {
    rows = rows.filter((f) => f.country.includes(filters.country!));
  }
  if (filters?.q) {
    const q = filters.q.trim().toLowerCase();
    rows = rows.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        (f.nameEn?.toLowerCase().includes(q) ?? false) ||
        f.bio.includes(q) ||
        f.country.toLowerCase().includes(q) ||
        (f.region?.toLowerCase().includes(q) ?? false) ||
        f.field.some((x) => x.includes(q)),
    );
  }
  return rows;
}
