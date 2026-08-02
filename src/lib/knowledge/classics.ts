export interface KnowledgeEntry {
  id: string;
  title: string;
  source: string;
  era: string;
  theme: string;
  excerpt: string;
  application: string;
}

export const CLASSIC_ENTRIES: KnowledgeEntry[] = [
  {
    id: "yuanhai-rigan",
    title: "以日干为主",
    source: "渊海子平",
    era: "宋代子平体系（后世辑录）",
    theme: "排盘总纲",
    excerpt:
      "子平法以日干为“我”，月令为提纲。先定日主，再看月支当令之气与透干，方论生克扶抑。",
    application:
      "排盘后先标明日主与月令，再统计印比与财官食伤力量，作为强弱与用神的起点。",
  },
  {
    id: "yuanhai-yongshen",
    title: "用神为枢纽",
    source: "渊海子平 / 子平命理",
    era: "宋元以降",
    theme: "用神",
    excerpt:
      "命理贵在取用。用神者，补偏救弊之神也：弱则扶，旺则抑，寒暖燥湿则调候，阻隔则通关。",
    application:
      "引擎给出的“喜用倾向”只是规则化初判；细断仍需结合调候、通关与格局清浊。",
  },
  {
    id: "sanming-ganzhi",
    title: "干支生克与刑冲合害",
    source: "三命通会",
    era: "明代 · 万民英",
    theme: "干支关系",
    excerpt:
      "《三命通会》详论天干五合、地支六合六冲、三刑六害与破局之理，强调不可只见五行生克而忽视支中藏干与刑冲。",
    application:
      "看大运流年时，除五行旺衰外，应检查冲合刑害是否动摇用神与原局关键。",
  },
  {
    id: "sanming-geju",
    title: "格局与岁运",
    source: "三命通会",
    era: "明代",
    theme: "格局",
    excerpt:
      "论命当先明格局成败，再参看岁运引动。格局成者喜用得位，格局破者须寻解救之神。",
    application:
      "LLM 演算应先复述排盘事实与格局线索，再谈岁运应期，避免空泛吉凶断言。",
  },
  {
    id: "ditian-shuaiwang",
    title: "衰旺之真机",
    source: "滴天髓阐微",
    era: "清 · 任铁樵注",
    theme: "旺衰",
    excerpt:
      "“能知衰旺之真机，其于三命之奥，思过半矣。”真机在于得令、得地、得势之综合，而非单凭多寡。",
    application:
      "本站强弱评分只作教学辅助；阐微强调的“真机”需要看月令、通根与党众。",
  },
  {
    id: "ditian-qishi",
    title: "气势与清浊",
    source: "滴天髓阐微",
    era: "清代",
    theme: "气势",
    excerpt:
      "任注常以气势顺逆、清浊显晦论命：顺势者贵在流通，逆势者贵在有制有化。",
    application:
      "分析时应指出五行气势流向（生泄耗克）是否通畅，而非堆砌术语。",
  },
  {
    id: "ziping-tiaohe",
    title: "扶抑与调候",
    source: "子平命理传统",
    era: "宋以后通行法则",
    theme: "取用法则",
    excerpt:
      "寻常以扶抑为主：日主弱用印比，日主强用财官食伤；寒暖偏枯则首重调候，阻隔不通则求通关。",
    application:
      "若出生月令偏寒或偏燥，应在喜用中优先提示调候，再论普通扶抑。",
  },
  {
    id: "ziping-shishen",
    title: "十神意象",
    source: "子平命理",
    era: "通行理论",
    theme: "十神",
    excerpt:
      "十神由日干与他干之阴阳五行关系而定：同我为比劫，我生为食伤，我克为财，克我为官杀，生我为印。",
    application:
      "排盘结果中的十神标签可用于叙述性情倾向与六亲意象，但仍须以用神与岁运为准。",
  },
];

export function pickRelevantClassics(themes: string[], limit = 4): KnowledgeEntry[] {
  const lowered = themes.map((t) => t.toLowerCase());
  const scored = CLASSIC_ENTRIES.map((entry) => {
    let score = 0;
    for (const t of lowered) {
      if (entry.theme.includes(t) || entry.title.includes(t) || entry.excerpt.includes(t)) {
        score += 2;
      }
      if (entry.source.includes(t)) score += 1;
    }
    return { entry, score };
  });
  scored.sort((a, b) => b.score - a.score);
  const picked = scored.filter((s) => s.score > 0).slice(0, limit).map((s) => s.entry);
  return picked.length > 0 ? picked : CLASSIC_ENTRIES.slice(0, limit);
}
