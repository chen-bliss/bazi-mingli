import raw from "../../../data/mingli-cases.json";
import { enrichFigureRecord } from "@/lib/figures/load";
import type { MingliCase } from "@/lib/figures/types";

let cache: MingliCase[] | null = null;

export function loadMingliCases(): MingliCase[] {
  if (!cache) {
    cache = (raw as MingliCase[]).map((row) => {
      const enriched = enrichFigureRecord({
        ...row,
        kind: "mingli-case",
      }) as MingliCase;
      return {
        ...enriched,
        kind: "mingli-case",
        pedagogicalFocus: row.pedagogicalFocus ?? [],
        lifeOutcomeNotes: row.lifeOutcomeNotes ?? row.situation,
      };
    });
  }
  return cache;
}

export function getMingliCaseById(id: string): MingliCase | undefined {
  return loadMingliCases().find((c) => c.id === id);
}

/** 由名人库 id 查找互链教学命例 */
export function getMingliCaseByFigureId(
  figureId: string,
): MingliCase | undefined {
  return loadMingliCases().find((c) => c.linkedFigureId === figureId);
}

export function listMingliCaseStats() {
  const all = loadMingliCases();
  const fit: Record<string, number> = {};
  const genders: Record<string, number> = {};
  const countries: Record<string, number> = {};
  const eras: Record<string, number> = {};
  for (const c of all) {
    fit[c.fitAssessment] = (fit[c.fitAssessment] ?? 0) + 1;
    genders[c.gender] = (genders[c.gender] ?? 0) + 1;
    countries[c.country] = (countries[c.country] ?? 0) + 1;
    eras[c.dynastyOrPeriod] = (eras[c.dynastyOrPeriod] ?? 0) + 1;
  }
  return {
    total: all.length,
    kind: "mingli-case" as const,
    counterexamples: all.filter((c) => c.counterexample).length,
    fitAssessment: fit,
    genders,
    countries: Object.keys(countries).sort(),
    countryCount: Object.keys(countries).length,
    eras: Object.keys(eras).sort(),
    fields: Array.from(new Set(all.flatMap((c) => c.field))).sort(),
    regions: Array.from(
      new Set(all.map((c) => c.region).filter(Boolean) as string[]),
    ).sort(),
    female: all.filter((c) => c.gender === "female").length,
    withComputableDay: all.filter(
      (c) => c.chartTags.dayMaster && c.chartTags.dayMaster !== "不明",
    ).length,
    linkedToFigures: all.filter((c) => c.linkedFigureId).length,
    pedagogicalTags: Array.from(
      new Set(all.flatMap((c) => c.pedagogicalFocus)),
    ).sort(),
  };
}
