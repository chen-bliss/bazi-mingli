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
   - 种子数据见 [`data/historical-figures.json`](./data/historical-figures.json)（约 170+ 人；`npm run figures:enrich` 可合并扩展批次）
   - 覆盖东亚与西方、非洲、拉美及其他地区；提高女性比例；中国多省与多国文明圈；政治/科学/艺术/军事/商业/宗教/医学/体育/社会运动等
   - 字段含 `gender`、`country`/`region`、`birthCertainty`（exact / year-only / disputed / legendary）、`fitDetail`、`baziFeatures`
   - **符合 / 部分符合 / 不符合 / 资料不足** 与 `counterexample` 均为一等公民，用于抑制确认偏误
   - 排盘后按日主、日柱、阴阳、月令季节、五行向量余弦、十神倾向类比，并尽量纳入反例
   - **不伪造未知时辰**；legendary / year-only 不参与或仅弱参与自动八字匹配
   - 浏览页可按领域、推演评估、性别、国家与关键词筛选
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

| 方法 | 路径                     | 说明                                                                        |
| ---- | ------------------------ | --------------------------------------------------------------------------- |
| POST | `/api/chart`             | 排盘 + 生物节律 + 相似命例（IP 限流；含 linkedCaseId）                      |
| POST | `/api/figures/match`     | 仅相似命例匹配                                                              |
| POST | `/api/match-figures`     | 同上（别名）                                                                |
| GET  | `/api/figures`           | 浏览人物库；`?stats=1` 看统计；可按 field/fit/gender/country/q 筛选         |
| GET  | `/api/figures/[id]`      | 单条人物；若有命例库互链则返回 `linkedCaseId`                               |
| GET  | `/api/mingli-cases`      | 浏览历史命例库；`?stats=1`；可按 field/fit/gender/country/region/era/q 筛选 |
| GET  | `/api/mingli-cases/[id]` | 单条命例                                                                    |
| POST | `/api/analyze`           | 需 GitHub 登录；LLM 或本地文稿                                              |
| GET  | `/api/quota`             | 查看登录态与剩余配额                                                        |
| GET  | `/api/knowledge`         | 典籍与节律知识条目                                                          |
| *    | `/api/auth/*`            | NextAuth（GitHub）                                                          |

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

## 排盘口径与日期

- 输入采用公历（1900–2100 年）与钟表时间；真实日期会在前后端同时校验，2 月 30 日等输入返回 400，不会滚动到其他日期。
- `dayBoundary` 可选 `midnight`（默认，00:00 换日）或 `zi-hour`（23:00 子初换日），对应 `lunar-javascript` 的 `setSect(2/1)`。历史人物未知时辰仍不补造时柱。
- 返回 `chart.calculation` 说明计算约定；四柱现在包含 `hiddenStems` 藏干，与 `shiShenZhi` 按位置对应。
- 五行统计为四柱干支本气八项计数；强弱仍为简化教学算法，不包含月令、藏干权重、合化、真太阳时、历史夏令时、大运或流年计算。页面与解读明确显示这些局限。
- 历史人物时辰未知时，自动五行匹配只统计年、月、日三柱六项，强弱标为“不明”；非公历、仅年份、传说或无效日期不自动补算日柱。
- 节律按公历日期差计算，与服务器时区及夏令时无关。`targetDate` 须为真实的 `YYYY-MM-DD`，不能早于生日。界面默认发送用户所在地的今天；API 省略时采用 UTC 今天。直接调用 `calculateBiorhythm` 时，字符串按日历日期处理，`Date` 参数按其 UTC 日期处理。
- 可下载 Markdown 研习报告，也可通过浏览器打印保存 PDF。典籍摘记页展示现有知识库摘要，未标注版本卷页的摘要不作为古籍原文引用。

请求示例（脚本调试时需显式开启 `ALLOW_SCRIPT_CLIENTS=1`）：

```json
{
  "year": 1990,
  "month": 5,
  "day": 15,
  "hour": 23,
  "minute": 30,
  "dayBoundary": "midnight",
  "targetDate": "2026-10-03"
}
```

## 验证与维护

建议使用 Node.js 22 LTS，先 `npm ci` 安装锁定依赖：

```bash
npm run check       # lint、类型检查、回归测试、种子数据冒烟测试
npm run build       # 生产构建
npm audit --omit=dev
```

回归测试覆盖真实日期与闰年、四种主机时区及夏令时、子时换日、未知时辰三柱统计、接口异常、匹配与解读一致性、跨进程配额并发及模型失败退还配额。模型测试使用本地模拟服务，不需要真实 API 密钥。GitHub Actions 模板位于 `.github/ci.example.yml`，启用后可对每个 PR 自动运行这些检查；Dependabot 定期检查依赖更新。由于当前提交凭据缺少 `workflow` 权限，模板暂未放入 `.github/workflows/`。仓库管理员可通过 GitHub 网页新建 `.github/workflows/ci.yml` 并粘贴模板，或使用具备该权限的凭据执行以下步骤后提交：

```bash
mkdir -p .github/workflows
cp .github/ci.example.yml .github/workflows/ci.yml
```

## 部署与配额存储

- 排盘、人物库、命例库、典籍浏览不需要任何密钥。未配置 `AUTH_SECRET`、`AUTH_GITHUB_ID`、`AUTH_GITHUB_SECRET` 时，页面明确提示登录未配置，匿名会话正常返回，解读接口仍拒绝未登录请求。
- 解读接口继续要求 GitHub 登录。仅实际调用配置好的模型才扣每日 AI 配额；本地知识库稿不扣每日配额，但仍受 IP 小时限流。模型报错或返回空内容时退还用户每日次数；IP 计数保留以限制反复失败请求。LLM 每次请求超时 45 秒，最多重试一次。
- 默认配额写入 `.data/quota.json`，使用 `proper-lockfile` 跨进程文件锁、临时文件原子替换与过期记录清理。损坏或不可读的存储会拒绝请求，不能静默重置限额。
- 生产部署需挂载持久化可写磁盘，可设置绝对路径 `QUOTA_STORE_PATH`。多进程必须读写同一配额文件。**独立磁盘的多副本或无服务器实例需另接共享数据库/Redis；当前文件方案不适用于这种架构。** 不要在服务运行时手动删除锁文件；备份或修复配额文件前应停止所有实例。
- `TRUST_PROXY_HEADERS=0` 为默认值，忽略可伪造的 IP 请求头，所有请求共用 `unknown` IP 桶。只有受信任反向代理会清除外部同名头并写入真实 IP 时，才设置为 `1`。客户端 Origin 与 User-Agent 检查只是辅助措施，不能替代身份验证或入口层限流。
- JSON 写入接口只接受 `application/json` 且最多 16 KiB，错误分别返回 400、413、415；API 响应禁止缓存，避免排盘或配额数据被中间缓存复用。
- Next.js 与配套 ESLint 配置已升级到 16.3.8，运行时依赖审计通过。本轮仍有 `braces` 经 `micromatch → fast-glob → @next/eslint-plugin-next` 引入的开发工具审计告警；未按审计建议强制降级 Next.js ESLint 主版本，待上游修复后更新。不要把开发服务器开放到公网。
