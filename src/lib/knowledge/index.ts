import { BIORHYTHM_ENTRIES, BIORHYTHM_SCIENCE_NOTE } from "./biorhythm";
import { CLASSIC_ENTRIES, pickRelevantClassics } from "./classics";

export {
  BIORHYTHM_ENTRIES,
  BIORHYTHM_SCIENCE_NOTE,
  CLASSIC_ENTRIES,
  pickRelevantClassics,
};

export function getKnowledgeBundle() {
  return {
    classics: CLASSIC_ENTRIES,
    biorhythm: BIORHYTHM_ENTRIES,
    biorhythmScienceNote: BIORHYTHM_SCIENCE_NOTE,
  };
}
