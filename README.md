# 八字命理 · 生物节律对照（bazi-mingli）

公开的传统文化研习工具：四柱八字排盘 + 子平文献依据 + 经典生物节律并置 + OpenAI 兼容大模型说理演算，并带有防滥用限流。

> **重要**：GitHub Models 已于 **2026-07-30** 正式退役。本项目改为可配置的 OpenAI 兼容接口（如 Azure AI Foundry、OpenAI、DeepSeek 等）。

## 功能

1. **四柱八字排盘**（`lunar-javascript`）
   - 年月日时柱、纳音、十神、五行统计
   - 日主强弱初判与喜用倾向
   - 知识约束来自《渊海子平》《三命通会》《滴天髓阐微》与子平通则摘要
2. **生物节律（Biorhythm）**
   - 经典 23/28/33 日体力、情绪、智力正弦周期
   - 展示今日相位、近月曲线与临界日
   - 明确标注：经典三周期缺乏可靠现代科学支持；昼夜节律与时间生物学才是科学研究
3. **历史人物库与相似命例**（`kind=figure`，名人对照库）
   - 种子数据见 [`data/historical-figures.json`](./data/historical-figures.json)（约 70+ 人，可扩展）
   - 覆盖东亚与西方及其他地区、男女、帝王与平民、政治/科学/艺术/军事/商业/宗教/文学等
   - 字段含 `gender`、`country`/`region`、`birthCertainty`（exact / year-only / disputed / legendary）、`fitDetail`、`baziFeatures`
   - **符合 / 部分符合 / 不符合 / 资料不足** 与 `counterexample` 均为一等公民，用于抑制确认偏误
   - 排盘后按日主、日柱、阴阳、月令季节、五行向量余弦、十神倾向类比，并尽量纳入反例
   - **不伪造未知时辰**；legendary / year-only 不参与或仅弱参与自动八字匹配
4. **历史命例库**（`kind=mingli-case`，偏排盘与格局教学）
   - 种子数据见 [`data/mingli-cases.json`](./data/mingli-cases.json)
   - 收录有一定生辰文献基础的近现代与历史案例，以及明确标注“资料不足”的典籍示意条目
   - 字段在人物库基础上增加 `pedagogicalFocus`、`lifeOutcomeNotes`、`teachingAngle`；可用 `linkedFigureId` 互链名人库
   - 筛选：时期、性别、国家、地域、领域、推演评估；浏览页「历史命例库」
   - 排盘匹配若命中互链人物，结果含 `linkedCaseId`，可跳转教学条目
5. **并置而非互证**
   - 八字、生物节律、历史人物与命例库同屏对照
   - 大模型提示词禁止用节律或名人轨迹“验证”八字，禁止编造出生数据，也禁止医疗建议
6. **LLM 演算与防滥用**
   - GitHub OAuth 登录后才可调用 `/api/analyze`
   - 每用户每日配额（默认 5 次）
   - 每 IP 小时限额（排盘 / 演算分开）
   - 蜜罐字段、最短填表时间、User-Agent 与 Origin 校验
   - **先算后解**：`/api/chart` 本地确定性输出，LLM 只解释已算字段

> 命名提示：GitHub 另有 [`Wolke/bazi-mingli`](https://github.com/Wolke/bazi-mingli)。本仓完整路径为 `chen-bliss/bazi-mingli`。

## 快速开始

```bash
npm install --registry=https://registry.npmmirror.com
cp .env.example .env.local
npm run dev
```

浏览器打开 [http://localhost:3000](http://localhost:3000)。

### 环境变量

见 [`.env.example`](./.env.example)。

GitHub OAuth 应用回调示例：

```text
http://localhost:3000/api/auth/callback/github
```

LLM 示例（OpenAI 兼容）：

```env
LLM_API_KEY=sk-...
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4o-mini
```

未配置 LLM 时，`/api/analyze` 仍可在登录后返回**确定性知识库文稿**，便于本地演示。

## API

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/chart` | 排盘 + 生物节律 + 相似命例（IP 限流；含 linkedCaseId） |
| POST | `/api/figures/match` | 仅相似命例匹配 |
| POST | `/api/match-figures` | 同上（别名） |
| GET | `/api/figures` | 浏览人物库；`?stats=1` 看统计；可按 field/fit/gender/country/q 筛选 |
| GET | `/api/figures/[id]` | 单条人物；若有命例库互链则返回 `linkedCaseId` |
| GET | `/api/mingli-cases` | 浏览历史命例库；`?stats=1`；可按 field/fit/gender/country/region/era/q 筛选 |
| GET | `/api/mingli-cases/[id]` | 单条命例 |
| POST | `/api/analyze` | 需 GitHub 登录；LLM 或本地文稿 |
| GET | `/api/quota` | 查看登录态与剩余配额 |
| GET | `/api/knowledge` | 典籍与节律知识条目 |
| * | `/api/auth/*` | NextAuth（GitHub） |

## 相似命例如何计分

1. 日主相同、日主五行相同、日柱相同：高权重  
2. 日干阴阳、月令季节、强弱倾向：补充权重  
3. 五行计数向量余弦相似度（木火土金水）：中高权重  
4. 十神倾向、叙事标签：重叠计分  
5. `birthCertainty` 为 disputed / year-only / legendary 或时辰未知：整体降权  
6. 无法计算日柱者：仅用阶层或领域标签弱匹配；**绝不由 LLM 补造生辰**  
7. 结果集尽量包含至少一条反例（`counterexample` 或 `fitAssessment=不符合`）  

这是**类比检索**，不是命运证明。原则见 [`PRIOR_ART.md`](./PRIOR_ART.md) 第 7 节。

## 知识库

目录 [`knowledge/`](./knowledge/)：

- `yuanhai-ziping.md`
- `sanming-tonghui.md`
- `ditiansui.md`
- `ziping-mingli.md`
- `biorhythm.md`

代码内结构化条目见 `src/lib/knowledge/`。

## 八字与生物节律如何结合

1. **同一出生日期**驱动两套计算：干支四柱与三周期正弦曲线。
2. **结果并置**：左侧/主栏看八字结构，右侧看节律相位。
3. **LLM 约束**：必须引用典籍要点，并写明节律的科学边界；不得互相证明。
4. **教育定位**：比较“象义结构时间观”与“固定周期时间观”，而非预测工具。

## 免责声明

- 命理内容仅供传统文化与教育研习。
- 经典生物节律学说**不是**现代医学或心理学共识。
- 本仓库不提供医疗、法律、投资建议。

## 许可证

MIT
