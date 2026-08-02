export interface BiorhythmPoint {
  date: string;
  physical: number;
  emotional: number;
  intellectual: number;
  average: number;
}

export interface BiorhythmCycleStatus {
  name: "体力" | "情绪" | "智力";
  nameEn: "physical" | "emotional" | "intellectual";
  periodDays: number;
  value: number;
  phase: "高涨期" | "临界日" | "低落期";
  percent: number;
  daysToNextPeak: number;
  daysToNextCritical: number;
}

export interface BiorhythmResult {
  birthDate: string;
  targetDate: string;
  daysAlive: number;
  today: {
    physical: BiorhythmCycleStatus;
    emotional: BiorhythmCycleStatus;
    intellectual: BiorhythmCycleStatus;
    average: number;
  };
  series: BiorhythmPoint[];
  criticalDaysAhead: string[];
  notes: string[];
  scientificCaveat: string;
}
