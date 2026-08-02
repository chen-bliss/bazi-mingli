import type { BaZiChart } from "@/lib/bazi";
import type { BiorhythmResult } from "@/lib/biorhythm";
import {
  BIORHYTHM_ENTRIES,
  BIORHYTHM_SCIENCE_NOTE,
  pickRelevantClassics,
} from "@/lib/knowledge";

export function buildAnalysisMessages(
  chart: BaZiChart,
  biorhythm: BiorhythmResult,
  question?: string,
) {
  const classics = pickRelevantClassics(["用神", "旺衰", "格局", "十神"], 4);
  const bioKb = BIORHYTHM_ENTRIES.slice(0, 3);

  const system = `你是传统文化与比较文化的讲解助手，擅长子平命理文献说理，也能客观介绍生物节律史。

硬性要求：
1. 八字分析必须依据给定排盘事实，并引用知识库中的典籍要点（渊海子平、三命通会、滴天髓阐微、子平通则）。先用结构化排盘，再解释；禁止自行推算或改写干支。
2. 生物节律仅作并置对照，不得用来“验证”八字，也不得给出医疗建议。
3. 必须写明：经典 23/28/33 日生物节律缺乏可靠现代科学支持；昼夜节律/时间生物学才是科学研究方向。
4. 若提及历史人物相似命例，只能讨论系统已给出的匹配结果与公开生平要点；禁止编造出生时辰、日柱或未提供的传记细节。
5. 语气克制，避免宿命恐吓与绝对吉凶断言；标注“文化研习/教育用途”。
6. 输出使用简体中文，结构清晰。`;

  const user = JSON.stringify(
    {
      question: question || "请结合典籍要点解读此八字，并对照今日生物节律作文化层面的并置说明。",
      chart,
      biorhythmToday: biorhythm.today,
      biorhythmCaveat: biorhythm.scientificCaveat,
      classicKnowledge: classics,
      biorhythmKnowledge: bioKb,
      scienceNote: BIORHYTHM_SCIENCE_NOTE,
      outputOutline: [
        "排盘复述",
        "典籍依据（点名出处）",
        "用神与气势初判",
        "生物节律对照（含科学边界）",
        "综合提示与免责声明",
      ],
    },
    null,
    2,
  );

  return [
    { role: "system" as const, content: system },
    { role: "user" as const, content: user },
  ];
}

/** 无 LLM 时的本地模板演算 */
export function buildDeterministicAnalysis(
  chart: BaZiChart,
  biorhythm: BiorhythmResult,
): string {
  const classics = pickRelevantClassics(["用神", "旺衰"], 3);
  const lines = [
    "## 排盘复述",
    `公历 ${chart.solarDate}，农历 ${chart.lunarDate}，生肖 ${chart.shengXiao}。`,
    `四柱：年 ${chart.pillars.year.ganZhi}、月 ${chart.pillars.month.ganZhi}、日 ${chart.pillars.day.ganZhi}、时 ${chart.pillars.hour.ganZhi}。`,
    `日主 ${chart.dayMaster}（${chart.dayMasterWuXing}），强弱倾向：${chart.strength.label}。${chart.strength.summary}`,
    "",
    "## 典籍依据",
    ...classics.map(
      (c) => `- **${c.source} · ${c.title}**：${c.excerpt}（应用：${c.application}）`,
    ),
    "",
    "## 用神与气势初判",
    `喜用倾向：${chart.usefulGods.join("、")}。`,
    ...chart.classicalHints.map((h) => `- ${h}`),
    "",
    "## 生物节律对照（文化并置，非科学验证）",
    `今日体力 ${biorhythm.today.physical.percent}%（${biorhythm.today.physical.phase}），情绪 ${biorhythm.today.emotional.percent}%（${biorhythm.today.emotional.phase}），智力 ${biorhythm.today.intellectual.percent}%（${biorhythm.today.intellectual.phase}）。`,
    biorhythm.scientificCaveat,
    BIORHYTHM_SCIENCE_NOTE,
    "",
    "## 说明",
    "当前未配置或未调用大模型，以上为确定性规则与知识库生成的教学稿。配置 LLM 后可获得更细致的说理演算。",
    "内容仅供传统文化与比较文化研习，不构成决策或医疗建议。",
  ];
  return lines.join("\n");
}
