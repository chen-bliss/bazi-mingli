import { buildBaZiChart, type BirthInput } from "./bazi";
import { calculateBiorhythm } from "./biorhythm";
import { featuresFromChart, matchHistoricalFigures } from "./figures";
import { withLinkedCases } from "./mingli-cases";

export function buildReading(
  input: BirthInput & { targetDate?: string },
  limit = 6,
  horizonDays = 30,
) {
  const chart = buildBaZiChart(input);
  const biorhythm = calculateBiorhythm(input, input.targetDate, horizonDays);
  const features = featuresFromChart(chart, { hourKnown: true, biorhythm });
  const matches = withLinkedCases(
    matchHistoricalFigures(features, { limit, includeCounterexamples: true }),
  );
  return { chart, biorhythm, features, matches };
}
