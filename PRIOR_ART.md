# 先前艺术调研（Prior Art）

> 调研日期：2026-08-02  
> 仓库：`bazi-mingli`（进行中，Next.js + `lunar-javascript` + OpenAI SDK + NextAuth）  
> 维护者语境：GitHub `@chen-bliss`  
> 方法：公开网页与 GitHub 检索；**未编造未核实条目**；存疑处标「未独立核实」。  
> 范围：开源八字引擎、农历库、古典命理文本引用实践、生物节律（23/28/33）与时间生物学、LLM 解读与反滥用。

---

## 1. 结论摘要

| 维度 | 现状 |
|------|------|
| 八字排盘引擎 | 成熟；多语言有 MIT 或 ISC 开源实现，业界共识是「确定性计算与 LLM 解读分离」。 |
| 农历与节气 | `lunar-*` / `tyme4*`（6tail）为事实标准依赖。 |
| 古籍 RAG 或 Agent Skill | 大量项目把《渊海子平》《三命通会》《滴天髓》等做成 references 或 RAG；质量与版权实践参差。 |
| 经典生物节律 23/28/33 | 独立计算器很多；**未发现**与子平八字深度融合且经学术背书的开源「混合体系」。 |
| 时间生物学（昼夜节律等） | 与 Fliess 式生物节律是不同概念；科学文献明确区分。 |
| 本仓库差异化机会 | 在「排盘可审计 + 公版古籍出处 + 生物节律文化层（非医疗声明）+ 自建限流」上做开源整合；避免宣称医学疗效或用 LLM 直接算干支。 |

**命名注意：** GitHub 已存在 [`Wolke/bazi-mingli`](https://github.com/Wolke/bazi-mingli)（AI Skill 向八字项目）。发布时建议核对包名与仓库名冲突，必要时加组织前缀或副标题。

**基础设施：** [GitHub Models 已于 2026-07-30 退役](https://github.blog/changelog/2026-07-30-github-models-is-now-retired/)。推理应改走 Azure AI Foundry、直接厂商 API（本仓库已用 `openai` 包）或其他网关，勿再依赖 GitHub Models 端点。

---

## 2. 分类目录

### 2.1 农历、节气、干支基础库

| 项目 | URL | 许可（据项目页） | 要点 |
|------|-----|------------------|------|
| lunar-javascript | https://github.com/6tail/lunar-javascript | MIT | 本仓库已依赖；公历农历、节气、干支、八字相关 API。 |
| lunar-python | https://github.com/6tail/lunar-python | MIT | Python 生态主流；多数 Python 八字项目底层。 |
| tyme4ts | https://github.com/6tail/tyme4ts | MIT | Lunar 升级版；Shunshi 等引擎注明基于此。 |
| 寿星天文历（节气算法溯源） | https://github.com/sxwnl/sxwnl | 见上游 | tyme 文档致谢节气算法引自此。 |
| 官方 API 文档 | https://6tail.cn/calendar/api.html | — | 对照测试用。 |

**可借鉴：** 统一日历依赖、用黄金样例回归节气与立春换年。  
**宜避免：** 在应用层再手写一套干支表却不写测试。

### 2.2 TypeScript / MCP 八字引擎（与本仓库栈最接近）

| 项目 | URL | 许可（据项目页） | 架构亮点 |
|------|-----|------------------|----------|
| OpenFate bazi-engine | https://github.com/openfate-ai/bazi-engine | MIT（npm 页） | 真太阳时、大运、地支作用；结构化 JSON；与解读产品解耦。 |
| OpenFate true-solar-time | https://github.com/openfate-ai/true-solar-time | 见仓库 | Meeus 均时差、经度改正、DST；可单独复用。 |
| OpenFate MCP | https://github.com/openfate-ai/openfate-mcp | 见仓库 | Agent 调确定性工具，禁止 LLM 猜历法。产品：https://openfate.ai |
| cantian-ai/bazi-mcp | https://github.com/cantian-ai/bazi-mcp | ISC | 较早的八字 MCP；`getBaziDetail` / 反查公历 / 黄历。产品：https://cantian.ai |
| shunshi-ai/bazi-reader-mcp | https://github.com/shunshi-ai/bazi-reader-mcp | MIT（core 包说明） | `shunshi-bazi-core`；默认真太阳时；与问真八字等口径对拍（项目自述）。产品：https://shunshi.ai |
| sfwal/xuantian-bazi | https://github.com/sfwal/xuantian-bazi | 见仓库 | 核心 API + MCP；流年流月流日。 |

**可借鉴：**

1. **先算后解**：引擎输出可序列化命盘，LLM 只解释字段。  
2. **政策显式化**：子时换日、是否真太阳时、时区 DST 写入 `metadata`。  
3. **对拍黄金例**：与问真八字、lunar 官方样例、跨引擎交叉校验。  
4. **MCP 可选**：本仓库若做公开 API，可预留与 MCP 同构的工具 schema。

**宜避免：**

1. 让模型直接「算」四柱。  
2. 默认关闭真太阳时却对外宣传「天文级精度」。  
3. 复制闭源产品文案或未授权断语库。

### 2.3 Python 全栈、古籍 RAG、Agent Skill

| 项目 | URL | 要点 |
|------|-----|------|
| china-testing/bazi | https://github.com/china-testing/bazi | 高星 CLI；冲刑合会可视化；附《三命通会》等评判与 books/。 |
| richard3153/bazi-calculator | https://github.com/richard3153/bazi-calculator | 自述融合渊海子平、三命通会、滴天髓、子平真诠；格局神煞大运流年。 |
| HeiGe-SuanMing（多 fork） | https://github.com/HeiGeAi/HeiGe-SuanMing 等 | 「脚本算准 + references 推演」；争议处标存疑；大量 unittest。 |
| Sudo-Biao/suangua | https://github.com/Sudo-Biao/suangua | 多术数子系统；BM25 RAG + 多厂商 LLM 流式；计算层与 API 分离。 |
| gaaiyun/FOR-BAZI | https://github.com/gaaiyun/FOR-BAZI | FastAPI + ReAct Agent + ChromaDB 古籍 JSON；14 tools。 |
| XiaoChu-1208/bazi-life-curves | https://github.com/XiaoChu-1208/bazi-life-curves | 八字量化为可审计「人生曲线」；可证伪年解读；MCP 兼容 cantian 工具名。 |
| Wolke/bazi-mingli | https://github.com/Wolke/bazi-mingli | 同名向 Skill；排盘脚本 + 专题 md。 |
| jinchenma94/bazi-skill（镜像见 GitCode） | 检索名 `bazi-skill` | Claude Skill；九本典籍摘要 references。 |

**可借鉴：** 结构化 `references/`（出处、版本、存疑标记）；RAG 只检索公版或自撰摘要；Agent 工具化（排盘、检索、合盘分工具）。  
**宜避免：** 整本扫描当代出版社译注 PDF 入库；把「大师经验断语」当无许可开放数据。

### 2.4 生物节律（23 / 28 / 33）开源

| 项目 | URL | 要点 |
|------|-----|------|
| fiedoruk/aimy-bio-open-biorhythms | https://github.com/fiedoruk/aimy-bio-open-biorhythms | Sikora 离散相位法参考实现；方法文档 + 黄金向量；MIT + CC BY 4.0（据 README）。 |
| molpass/mcp-biorhythm | https://github.com/molpass/mcp-biorhythm | MCP；`sin(2π d / period)`；临界日；UTC 日界。同作者有 `mcp-saju`（四柱向，未深核）。 |
| zebiv-code/biorhythm | https://github.com/zebiv-code/biorhythm | Canvas 三曲线可视化；MIT。 |
| alrico88/biorhythm-calculator | https://github.com/alrico88/biorhythm-calculator | npm 工具集；**CC BY-NC-SA 4.0**（许可偏严，商用需注意）。 |
| Retkoj/biorhythms | https://github.com/Retkoj/biorhythms | 小型 Python；指向 Wikipedia「pseudoscience」条目。 |
| Rosetta Code Biorhythms | https://rosettacode.org/wiki/Biorhythms | 多语言参考实现。 |

**与八字的混合：** 公开检索**未确认**存在成熟的「子平 + 23/28/33 统一理论」开源产品。`bazi-life-curves` 等是八字时间曲线，**不是** Fliess 三周期。二者可并列展示，不宜混称为同一科学机制。

### 2.5 商业与半商业产品（学架构与产品表述，非抄代码）

| 产品 | URL | 可学之处 |
|------|-----|----------|
| OpenFate | https://openfate.ai | 计算优先叙事；开源 MCP；合盘与多体系。 |
| Shunshi / 顺时 | https://shunshi.ai | 娱乐免责声明；对话胜于断言；开源 core。 |
| Cantian / 参天 AI | https://cantian.ai | GPT 应用落地再开源 MCP；工具化排盘。 |
| 问真八字等排盘站 | 检索「问真八字」 | 多引擎用作**对拍基准**（Shunshi README 提及）；非开源引擎本身。 |

### 2.6 古典文献与公版来源

| 资源 | URL | 说明 |
|------|-----|------|
| 《渊海子平》维基文库 | https://zh.wikisource.org/wiki/%E6%B7%B5%E6%B5%B7%E5%AD%90%E5%B9%B3 | 公版文本入口（版本需自行标注）。 |
| 《滴天髓》维基文库 | https://zh.wikisource.org/zh-hant/%E6%BB%B4%E5%A4%A9%E9%AB%93 | 含辑要；另见任铁樵《滴天髓阐微》流传史。 |
| 《三命通会》（四库本）维基文库 | 例：https://zh.wikisource.org/zh-hans/%E4%B8%89%E5%91%BD%E9%80%9A%E6%9C%83_(%E5%9B%9B%E5%BA%AB%E5%85%A8%E6%9B%B8%E6%9C%AC)/%E5%8D%B712 | 分卷；引用时写明「四库本」等底本。 |

古籍原文多属公有领域；**当代标点、白话译注、出版社排版与汇编**可能仍受著作权与版式权约束。HeiGe 类项目强调「引用前认版本、争议标存疑」，值得效仿。

### 2.7 生物节律批判与时间生物学（学术）

| 文献或条目 | 链接 | 核心论点 |
|------------|------|----------|
| Wikipedia: Biorhythm (pseudoscience) | https://en.wikipedia.org/wiki/Biorhythm_(pseudoscience) | 23/28/33 固定正弦周期缺乏实证；与昼夜节律不可混为一谈。 |
| Hines, T. M. (1998). Comprehensive review of biorhythm theory. *Psychological Reports*, 83(1), 19–64. | https://doi.org/10.2466/pr0.1998.83.1.19 | 综述约 134 项研究，结论理论无效；支持性研究多有方法学错误。 |
| 时间生物学入门（PMC） | https://pmc.ncbi.nlm.nih.gov/articles/PMC6120700/ | 内源约 24 小时昼夜节律等可测量、可同步环境线索。 |
| 术语辨析（2026 叙事评论，摘要见出版商页） | https://doi.org/10.1080/07420528.2026.2648755 | 批评「biorhythm」一词在科学文献中的误用；主张与现代时间生物学术语区分。【摘要已见公开页；全文细节未逐页核对】 |

产品文案应：**文化趣味或历史观念层呈现 23/28/33**；**健康建议仅可谨慎关联现代昼夜节律常识且不作诊疗**；禁止「临界日致癌」一类医疗宣称。

### 2.8 LLM 限流与反滥用（通用实践）

| 资源 | URL | 可落地做法 |
|------|-----|------------|
| OpenAI Rate limits | https://developers.openai.com/api/docs/guides/rate-limits | RPM/TPM；429 与 Retry-After；指数退避。 |
| OpenAI Cookbook：处理限流 | https://github.com/openai/openai-cookbook（How_to_handle_rate_limits） | 并行请求节流范例。 |
| AI Gateway 限流综述（业界文） | 例：TrueFoundry「Rate Limiting in AI Gateway」 | **按 token 与费用**限流，而非仅按请求次数。 |

面向本仓库建议（综合业界惯例，非抄某一闭源产品）：

1. 用户或会话级日配额（NextAuth 身份 + 匿名 IP 双层）。  
2. 解读接口与排盘接口分离；排盘本地算、不耗 LLM。  
3. 提示与输出 `max_tokens` 上限；zod 校验输入。  
4. 缓存「同八字 + 同问题 hash」短时结果。  
5. Prompt 注入与「请忽略系统提示」类滥用：系统提示固定娱乐免责 + 禁止医疗法律结论。  
6. GitHub Models 已退役：勿再写死其推理 URL。

---

## 3. 借与避（决策表）

### 3.1 建议借用

| 来源类型 | 借用什么 |
|----------|----------|
| OpenFate / Shunshi / Cantian | 计算与解读分层；真太阳时与 metadata；MCP 或等价工具 schema。 |
| lunar-javascript / tyme4ts | 日历与节气；可考虑日后迁移 tyme4ts，但须回归测试。 |
| HeiGe / suangua / FOR-BAZI | 古籍分篇、出处字段、RAG 检索片段而非整书灌入上下文。 |
| bazi-life-curves | 「可审计曲线」产品隐喻；与生物节律曲线 UI 可并列，语义分开标注。 |
| aimy-bio / Rosetta | 清晰的 23/28/33 公式与临界日定义；单测黄金向量。 |
| 维基文库公版 | 原句引用 + 底本说明。 |

### 3.2 建议避免

| 风险 | 说明 |
|------|------|
| 当代注解全书入库 | 《滴天髓阐微》等清人注本原文或已公版，但**今人校注、白话、排版**可能仍受保护；勿批量 OCR 在版权图书。 |
| 医疗与安全宣称 | 生物节律无可靠疗效证据；八字健康断语易触广告与医疗合规红线。 |
| LLM 算历法 | 幻觉高发；业界已用 MCP 纠正。 |
| 无出处的「经典」断语 | 伪托古籍损害可信度与学术声誉。 |
| 非宽松许可混入 | 如 CC BY-NC-SA 计算器逻辑，与拟 MIT 或 Apache 主仓冲突时勿直接 vendoring。 |
| 名称与商标 | `bazi-mingli` 已有他仓；商业名需另行检索。 |

---

## 4. 对本仓库的具体集成建议（可选路线）

当前栈：Next.js 16、`lunar-javascript`、`openai`、`next-auth`、`zod`。

1. **排盘模块**  
   - 短期：在现有 `lunar-javascript` 上封装四柱、藏干、十神、大运，输出带 `policy` 的 JSON。  
   - 中期：对拍 `@openfate/bazi-engine` 或 `shunshi-bazi-core` 黄金例；真太阳时可参考 `@openfate/true-solar-time` 思路（经度 + 均时差），**是否依赖其包需核许可与体积**。  

2. **古籍层**  
   - 自建 `knowledge/`：每条 `{text, work, edition, locator, confidence}`。  
   - 优先维基文库四库本或明确公版；用 BM25 或简单关键词检索注入 prompt，避免一次塞入全书。  

3. **生物节律层**  
   - 独立纯函数：`sin(2π * daysAlive / {23,28,33})`，UTC 或用户时区日界写清。  
   - UI 与八字大运并置时，文案标明「历史流行观念 / 娱乐」，并链到 Hines 1998 或 Wikipedia 条目。  
   - 可选「对照阅读」：大运年份 vs 三周期临界日，**不作因果断言**。  

4. **LLM 解读**  
   - 仅接收结构化命盘 + 检索片段；系统提示强制引用 `locator`。  
   - NextAuth 用户配额 + IP 令牌桶；流式输出；禁用医疗诊断类问题模板。  
   - 提供商：OpenAI 兼容 API 或多后端；文档注明 GitHub Models 已退役。  

5. **差异化表述（README 可用）**  
   > 开源整合：可审计四柱引擎 + 公版命理文献出处 + 经典生物节律可视化（非医疗）+ 限流下的 LLM 解读。  
   > 不宣称：医学疗效、绝对预测、与昼夜节律科学等价。

---

## 5. 推荐纳入本仓「参考文献」清单（精简）

### 引擎与日历

- https://github.com/6tail/lunar-javascript  
- https://github.com/6tail/tyme4ts  
- https://github.com/openfate-ai/bazi-engine  
- https://github.com/openfate-ai/true-solar-time  
- https://github.com/cantian-ai/bazi-mcp  
- https://github.com/shunshi-ai/bazi-reader-mcp  
- https://github.com/china-testing/bazi  

### 古籍与 Agent 实践

- https://zh.wikisource.org/wiki/%E6%B7%B5%E6%B5%B7%E5%AD%90%E5%B9%B3  
- https://zh.wikisource.org/zh-hant/%E6%BB%B4%E5%A4%A9%E9%AB%93  
- https://github.com/HeiGeAi/HeiGe-SuanMing  
- https://github.com/Sudo-Biao/suangua  
- https://github.com/XiaoChu-1208/bazi-life-curves  

### 生物节律与科学对照

- https://en.wikipedia.org/wiki/Biorhythm_(pseudoscience)  
- Hines (1998) DOI: https://doi.org/10.2466/pr0.1998.83.1.19  
- https://pmc.ncbi.nlm.nih.gov/articles/PMC6120700/  
- https://github.com/fiedoruk/aimy-bio-open-biorhythms  
- https://rosettacode.org/wiki/Biorhythms  

### 产品与基础设施

- https://openfate.ai  
- https://shunshi.ai  
- https://cantian.ai  
- https://github.blog/changelog/2026-07-30-github-models-is-now-retired/  
- https://developers.openai.com/api/docs/guides/rate-limits  

---

## 6. 调研缺口（标明未完成）

- 未对上述仓库做完整许可证 SPDX 逐文件审计。  
- 未下载核对各引擎同一组出生时刻的数值一致性。  
- 未系统检索中文学术库中「八字与生物节律」交叉主题论文（若需可另开 CNKI 检索任务）。  
- `molpass/mcp-saju`、部分小众 fork 的维护状态与许可未独立核实。  
- 商业站「问真八字」具体域名与 ToS 未在本文固化（仅作行业对拍语境）。

---

## 7. 历史人物库与历史命例库（本仓实现）

公开检索可见大量“名人八字”博客与付费命书，但**少有**把“符合 / 不符合推演”的反例作为一等数据、并拒绝伪造时辰的开源结构化库。

本仓实现原则（与上文“宜避免”一致）：

1. 出生时辰未知则 `hour: null`，不编造时柱；`birthCertainty` 标注 exact / year-only / disputed / legendary。  
2. `fitAssessment` + `fitDetail.fitsNarrative` / `tensionNotes`；`counterexample: true` 强制进入教学对照。  
3. 匹配是确定性特征类比（日干支、阴阳、季节、五行向量余弦、十神），可选 LLM 只解释已给结果，禁止表述为命运复现。  
4. 与名人商业断语库解耦：只保留公开生平要点与可核日期层；传记不编造。  
5. 种子库强调多样性：不同阶层、时代、领域、中国各省与多国、男女比例刻意纳入。  
6. **双库分立**：`kind=figure` 为名人对照库；`kind=mingli-case` 为排盘与格局教学命例库。后者增加 `pedagogicalFocus`、`lifeOutcomeNotes`、`teachingAngle`，并可用 `linkedFigureId` 互链。典籍示意条目（无可靠生辰）必须标 `资料不足`，不得补造生日时辰。  

| 库 | 数据文件 | API / UI |
|----|----------|----------|
| 名人对照库 | `data/historical-figures.json` | `GET /api/figures`、`GET /api/figures/[id]`；页面「历史人物库」 |
| 历史命例库 | `data/mingli-cases.json` | `GET /api/mingli-cases`、`GET /api/mingli-cases/[id]`；页面「历史命例库」 |
| 相似匹配 | （读人物库） | `POST /api/chart`、`POST /api/figures/match`（结果可含 `linkedCaseId`） |

---

## 8. 修订记录

| 日期 | 说明 |
|------|------|
| 2026-08-02 | 初版：公开 Web/GitHub 检索汇总，写入本文件。 |
| 2026-08-02 | 增补：历史人物库与反例优先的相似命例匹配原则。 |
| 2026-08-02 | 落地：种子库扩展、地理与性别字段、五行余弦匹配、UI“历史上相近人物”。 |
| 2026-08-02 | 增补：独立「历史命例库」数据、筛选浏览 API/UI，与名人库以 kind / linkedFigureId 区分与互链。 |
