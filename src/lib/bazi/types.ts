import type { WuXing } from "./constants";

export interface BirthInput {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute?: number;
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
}

export interface BaZiChart {
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
