export type BirthPrecision =
  | "exact-date"
  | "year-month"
  | "year-only"
  | "uncertain"
  | "unknown";

/** 用户需求口径：出生置信 */
export type BirthCertainty = "exact" | "year-only" | "disputed" | "legendary";

export type FitAssessment = "符合" | "部分符合" | "不符合" | "资料不足";

export type StrengthLabel = "偏弱" | "中和" | "偏强" | "不明";

export type FigureGender = "male" | "female" | "unknown";

export interface FigureBirth {
  year?: number;
  month?: number;
  day?: number;
  /** 未知时辰务必为 null，禁止伪造 */
  hour: number | null;
  calendar: "gregorian" | "traditional-approx";
  precision: BirthPrecision;
  /** 与 precision 对应的简化置信标签 */
  birthCertainty?: BirthCertainty;
  note: string;
}

export interface ChartTags {
  dayMaster?: string;
  dayMasterWuXing?: string;
  dayPillar?: string;
  yearPillar?: string;
  monthPillar?: string;
  hourPillar?: string;
  /** 日干阴阳 */
  dayMasterYinYang?: "阳" | "阴";
  /** 月支季节粗分 */
  seasonality?: "春" | "夏" | "秋" | "冬" | "土季" | "不明";
  strength?: StrengthLabel;
  dominantWuXing?: string[];
  /** 五行计数向量（木火土金水），供余弦相似度 */
  elementCounts?: Record<string, number>;
  shiShenTendency?: string[];
  patternTags?: string[];
  hourKnown: boolean;
  source: "computed" | "curated" | "mixed";
  confidence: "high" | "medium" | "low";
}

export interface FitAssessmentDetail {
  /** 是否大体贴合常见子平叙事 */
  fitsNarrative: boolean | "partial";
  /** 张力、反例或资料缺口说明 */
  tensionNotes: string;
}

export interface HistoricalFigure {
  id: string;
  name: string;
  nameEn?: string;
  gender: FigureGender;
  era: string;
  dynastyOrPeriod: string;
  /** 国家或文明圈 */
  country: string;
  /** 省/州/大区 */
  region?: string;
  birthPlace?: string;
  socialClass: string;
  field: string[];
  birth: FigureBirth;
  chartTags: ChartTags;
  /** 兼容别名：与 chartTags 同步的结构化八字特征 */
  baziFeatures?: ChartTags;
  bio: string;
  situation: string;
  fitAssessment: FitAssessment;
  fitDetail?: FitAssessmentDetail;
  analysisNotes: string;
  classicalRefs: string[];
  sources: string[];
  biorhythmNote?: string;
  /** 作为“不符合推演”的反例优先展示标记 */
  counterexample?: boolean;
}

export interface ChartFeatures {
  dayMaster: string;
  dayMasterWuXing: string;
  dayPillar: string;
  dayMasterYinYang: "阳" | "阴";
  seasonality: "春" | "夏" | "秋" | "冬" | "土季" | "不明";
  strength: StrengthLabel;
  dominantWuXing: string[];
  elementCounts: Record<string, number>;
  shiShenTendency: string[];
  patternTags: string[];
  hourKnown: boolean;
  biorhythmProfile?: {
    physicalPhase: string;
    emotionalPhase: string;
    intellectualPhase: string;
  };
}

export interface MatchExplanation {
  score: number;
  reasons: string[];
  caveats: string[];
}

export interface FigureMatch extends MatchExplanation {
  figure: HistoricalFigure;
}
