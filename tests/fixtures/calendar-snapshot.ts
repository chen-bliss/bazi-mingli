import { calculateBiorhythm } from "../../src/lib/biorhythm";
console.log(
  JSON.stringify(
    calculateBiorhythm(
      { year: 2000, month: 2, day: 29 },
      new Date("2026-03-07T23:30:00Z"),
      5,
    ),
  ),
);
