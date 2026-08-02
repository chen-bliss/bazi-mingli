import type {
  BiorhythmCycleStatus,
  BiorhythmPoint,
  BiorhythmResult,
} from "./types";

const PHYSICAL = 23;
const EMOTIONAL = 28;
const INTELLECTUAL = 33;
const CRITICAL_THRESHOLD = 0.08;

function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function daysBetween(birth: Date, target: Date): number {
  const a = startOfUtcDay(birth).getTime();
  const b = startOfUtcDay(target).getTime();
  return Math.floor((b - a) / 86_400_000);
}

function sineValue(daysAlive: number, period: number): number {
  return Math.sin((2 * Math.PI * daysAlive) / period);
}

function phaseOf(value: number): BiorhythmCycleStatus["phase"] {
  if (Math.abs(value) < CRITICAL_THRESHOLD) return "临界日";
  return value >= 0 ? "高涨期" : "低落期";
}

function daysToNext(
  daysAlive: number,
  period: number,
  predicate: (v: number) => boolean,
  maxScan = period * 2,
): number {
  for (let i = 1; i <= maxScan; i += 1) {
    if (predicate(sineValue(daysAlive + i, period))) return i;
  }
  return period;
}

function statusOf(
  name: BiorhythmCycleStatus["name"],
  nameEn: BiorhythmCycleStatus["nameEn"],
  periodDays: number,
  daysAlive: number,
): BiorhythmCycleStatus {
  const value = sineValue(daysAlive, periodDays);
  return {
    name,
    nameEn,
    periodDays,
    value: Number(value.toFixed(4)),
    phase: phaseOf(value),
    percent: Number((value * 100).toFixed(1)),
    daysToNextPeak: daysToNext(daysAlive, periodDays, (v) => v > 0.98),
    daysToNextCritical: daysToNext(
      daysAlive,
      periodDays,
      (v) => Math.abs(v) < CRITICAL_THRESHOLD,
    ),
  };
}

export function calculateBiorhythm(
  birth: { year: number; month: number; day: number },
  target: Date = new Date(),
  horizonDays = 30,
): BiorhythmResult {
  const birthDate = new Date(birth.year, birth.month - 1, birth.day);
  const daysAlive = daysBetween(birthDate, target);
  if (daysAlive < 0) {
    throw new Error("目标日期不能早于出生日期");
  }

  const physical = statusOf("体力", "physical", PHYSICAL, daysAlive);
  const emotional = statusOf("情绪", "emotional", EMOTIONAL, daysAlive);
  const intellectual = statusOf("智力", "intellectual", INTELLECTUAL, daysAlive);
  const average = Number(
    ((physical.value + emotional.value + intellectual.value) / 3).toFixed(4),
  );

  const series: BiorhythmPoint[] = [];
  const criticalDaysAhead: string[] = [];
  for (let i = 0; i <= horizonDays; i += 1) {
    const d = new Date(target);
    d.setDate(d.getDate() + i);
    const n = daysAlive + i;
    const p = sineValue(n, PHYSICAL);
    const e = sineValue(n, EMOTIONAL);
    const intel = sineValue(n, INTELLECTUAL);
    const point: BiorhythmPoint = {
      date: formatDate(d),
      physical: Number(p.toFixed(4)),
      emotional: Number(e.toFixed(4)),
      intellectual: Number(intel.toFixed(4)),
      average: Number(((p + e + intel) / 3).toFixed(4)),
    };
    series.push(point);
    if (
      i > 0 &&
      (Math.abs(p) < CRITICAL_THRESHOLD ||
        Math.abs(e) < CRITICAL_THRESHOLD ||
        Math.abs(intel) < CRITICAL_THRESHOLD)
    ) {
      criticalDaysAhead.push(point.date);
    }
  }

  return {
    birthDate: formatDate(birthDate),
    targetDate: formatDate(target),
    daysAlive,
    today: { physical, emotional, intellectual, average },
    series,
    criticalDaysAhead: criticalDaysAhead.slice(0, 8),
    notes: [
      "经典生物节律采用 23 日体力、28 日情绪、33 日智力正弦周期，自出生日起算。",
      "临界日指曲线穿越零点附近，传统说法认为此时稳定性较差，仅供文化趣味参考。",
      "本模块与八字并置展示，便于对照不同文化时间观，并不互相验证或取代。",
    ],
    scientificCaveat:
      "经典三周期生物节律学说在现代对照试验与综述中缺乏可靠实证支持；与之相关的真正科学方向是昼夜节律（circadian rhythm）与时间生物学（chronobiology）。本站仅作教育与文化对照，不作医疗建议。",
  };
}
