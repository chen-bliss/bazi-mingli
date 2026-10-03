import type { WuXing } from "./constants";

export interface BirthInput {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute?: number;
  dayBoundary?: "midnight" | "zi-hour";
  /** 性别，用于大运顺逆等扩展；当前可选 */
  gender?: "male" | "female";
}

export interface PillarInfo {
  ganZhi: string;
  gan: string;
  zhi: string;
  naYin: string;
  wuXing: string;
  shiShenGan: string;
  shiShenZhi: string[];
  hiddenStems: string[];
}

export interface BaZiChart {
  calculation: {
    dayBoundary: "midnight" | "zi-hour";
    timeBasis: string;
    strengthMethod: string;
  };
  solarDate: string;
  lunarDate: string;
  shengXiao: string;
  dayMaster: string;
  dayMasterWuXing: WuXing;
  pillars: {
    year: PillarInfo;
    month: PillarInfo;
    day: PillarInfo;
    hour: PillarInfo;
  };
  wuXingCount: Record<WuXing, number>;
  strength: {
    label: "偏弱" | "中和" | "偏强";
    score: number;
    summary: string;
  };
  usefulGods: string[];
  classicalHints: string[];
}
