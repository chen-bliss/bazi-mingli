import type { FigureMatch } from "@/lib/figures";
import { getMingliCaseByFigureId } from "./load";

/** 为相似人物匹配附加命例库教学条目链接（若存在） */
export function withLinkedCases(matches: FigureMatch[]): FigureMatch[] {
  return matches.map((m) => {
    const linked = getMingliCaseByFigureId(m.figure.id);
    if (!linked) return m;
    return {
      ...m,
      linkedCaseId: linked.id,
      figure: {
        ...m.figure,
        linkedCaseId: linked.id,
      },
    };
  });
}
