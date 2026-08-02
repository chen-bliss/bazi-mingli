export interface BiorhythmKnowledgeEntry {
  id: string;
  title: string;
  kind: "origin" | "method" | "critique" | "related-science";
  summary: string;
  citation: string;
}

export const BIORHYTHM_ENTRIES: BiorhythmKnowledgeEntry[] = [
  {
    id: "origin-fliess-swoboda",
    title: "Fliess 与 Swoboda 的周期假说",
    kind: "origin",
    summary:
      "19 世纪末至 20 世纪初，Wilhelm Fliess 与 Hermann Swoboda 提出人体存在约 23 日与 28 日的内在周期，后经 Alfred Teltscher 等补充 33 日智力周期，形成流行的“生物节律”三周期模型。",
    citation:
      "Historical overview of classical biorhythm theory (Fliess, Swoboda, Teltscher).",
  },
  {
    id: "method-sine",
    title: "正弦周期算法",
    kind: "method",
    summary:
      "经典算法以出生日为零点，按 sin(2π × 天数 / 周期) 计算体力（23）、情绪（28）、智力（33）曲线；零点附近称为临界日。",
    citation: "Standard popular-science formulation of three-cycle biorhythm charts.",
  },
  {
    id: "critique-evidence",
    title: "实证与批判",
    kind: "critique",
    summary:
      "20 世纪后半叶多项对照研究与综述指出，经典三周期生物节律对事故、成绩、情绪的预测并不优于随机水平，主流科学界视其为缺乏证据的流行伪科学主张。",
    citation:
      "Critical reviews in psychology and popular-science literature on biorhythm claims.",
  },
  {
    id: "chrono-circadian",
    title: "时间生物学与昼夜节律",
    kind: "related-science",
    summary:
      "与经典生物节律不同，昼夜节律（约 24 小时）、睡眠—觉醒周期及授时因子（光照等）是现代时间生物学的核心课题，并有分子生物学与临床医学支撑。",
    citation:
      "Chronobiology / circadian rhythm research (distinct from classical biorhythm).",
  },
  {
    id: "compare-bazi",
    title: "与八字时间观的文化对照",
    kind: "method",
    summary:
      "八字以干支历与阴阳五行为框架，侧重出生时刻的象义结构；生物节律以出生后固定正弦周期描述状态起伏。二者可并置以比较文化时间观，但不能互相证明。",
    citation: "Educational juxtaposition of cultural timing frameworks.",
  },
];

export const BIORHYTHM_SCIENCE_NOTE =
  "请明确区分：经典 23/28/33 日生物节律缺乏可靠现代科学支持；昼夜节律与时间生物学则是真实的科学研究领域。本项目展示前者仅供文化与教育对照。";
