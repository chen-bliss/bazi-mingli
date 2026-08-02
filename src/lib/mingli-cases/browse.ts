import type { MingliCase } from "@/lib/figures";
import { loadMingliCases } from "./load";

export function browseMingliCases(filters?: {
  field?: string;
  fitAssessment?: string;
  gender?: string;
  country?: string;
  region?: string;
  era?: string;
  q?: string;
}): MingliCase[] {
  let rows = loadMingliCases();
  if (filters?.field) {
    rows = rows.filter((c) => c.field.includes(filters.field!));
  }
  if (filters?.fitAssessment) {
    rows = rows.filter((c) => c.fitAssessment === filters.fitAssessment);
  }
  if (filters?.gender) {
    rows = rows.filter((c) => c.gender === filters.gender);
  }
  if (filters?.country) {
    rows = rows.filter((c) => c.country.includes(filters.country!));
  }
  if (filters?.region) {
    rows = rows.filter((c) => (c.region ?? "").includes(filters.region!));
  }
  if (filters?.era) {
    const era = filters.era.trim();
    rows = rows.filter(
      (c) =>
        c.dynastyOrPeriod.includes(era) ||
        c.era.includes(era),
    );
  }
  if (filters?.q) {
    const q = filters.q.trim().toLowerCase();
    rows = rows.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.nameEn?.toLowerCase().includes(q) ?? false) ||
        c.bio.includes(q) ||
        c.lifeOutcomeNotes.includes(q) ||
        c.country.toLowerCase().includes(q) ||
        (c.region?.toLowerCase().includes(q) ?? false) ||
        c.field.some((x) => x.includes(q)) ||
        c.pedagogicalFocus.some((x) => x.toLowerCase().includes(q)) ||
        (c.teachingAngle?.toLowerCase().includes(q) ?? false),
    );
  }
  return rows;
}
