"use client";

import { useEffect, useState } from "react";
import type { MingliCase } from "@/lib/figures";

interface Stats {
  total: number;
  counterexamples: number;
  fitAssessment: Record<string, number>;
  fields: string[];
  eras: string[];
  regions: string[];
  countries: string[];
  female?: number;
  countryCount?: number;
  withComputableDay?: number;
  linkedToFigures?: number;
}

export function MingliCasesBrowser() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [cases, setCases] = useState<MingliCase[]>([]);
  const [field, setField] = useState("");
  const [fit, setFit] = useState("");
  const [gender, setGender] = useState("");
  const [country, setCountry] = useState("");
  const [region, setRegion] = useState("");
  const [era, setEra] = useState("");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  async function load() {
    const params = new URLSearchParams();
    if (field) params.set("field", field);
    if (fit) params.set("fit", fit);
    if (gender) params.set("gender", gender);
    if (country) params.set("country", country);
    if (region) params.set("region", region);
    if (era) params.set("era", era);
    if (q) params.set("q", q);
    const [sRes, cRes] = await Promise.all([
      fetch("/api/mingli-cases?stats=1"),
      fetch(`/api/mingli-cases?${params.toString()}`),
    ]);
    if (sRes.ok) setStats(await sRes.json());
    if (cRes.ok) {
      const data = await cRes.json();
      setCases(data.cases ?? []);
    }
  }

  useEffect(() => {
    void load();
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    if (hash.startsWith("#mingli-case-")) {
      setOpenId(hash.replace("#mingli-case-", ""));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="panel" id="mingli-cases">
      <header className="section-head">
        <h2>历史命例库</h2>
        <p>
          {stats
            ? `共 ${stats.total} 例（女 ${stats.female ?? "-"}，反例 ${stats.counterexamples}，可排日柱约 ${stats.withComputableDay ?? "-"}，与名人库互链 ${stats.linkedToFigures ?? 0}）；约 ${stats.countryCount ?? "-"} 个国家或文明圈`
            : "加载中……"}
          。本库偏排盘与格局教学，与上方“历史人物库”（名人对照）分立；
          <code>kind=mingli-case</code>。未知时辰一律 <code>hour: null</code>
          ，典籍示意条目标为资料不足。详见{" "}
          <a
            href="https://github.com/chen-bliss/bazi-mingli/blob/master/PRIOR_ART.md"
            target="_blank"
            rel="noreferrer"
          >
            PRIOR_ART.md
          </a>
          。
        </p>
      </header>

      <div className="browser-filters">
        <label>
          领域
          <select value={field} onChange={(e) => setField(e.target.value)}>
            <option value="">全部</option>
            {(stats?.fields ?? []).map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </label>
        <label>
          时期
          <select value={era} onChange={(e) => setEra(e.target.value)}>
            <option value="">全部</option>
            {(stats?.eras ?? []).map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </label>
        <label>
          推演评估
          <select value={fit} onChange={(e) => setFit(e.target.value)}>
            <option value="">全部</option>
            <option value="符合">符合</option>
            <option value="部分符合">部分符合</option>
            <option value="不符合">不符合</option>
            <option value="资料不足">资料不足</option>
          </select>
        </label>
        <label>
          性别
          <select value={gender} onChange={(e) => setGender(e.target.value)}>
            <option value="">全部</option>
            <option value="female">女</option>
            <option value="male">男</option>
            <option value="unknown">未标</option>
          </select>
        </label>
        <label>
          国家
          <select value={country} onChange={(e) => setCountry(e.target.value)}>
            <option value="">全部</option>
            {(stats?.countries ?? []).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label>
          地域
          <select value={region} onChange={(e) => setRegion(e.target.value)}>
            <option value="">全部</option>
            {(stats?.regions ?? []).map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <label>
          搜索
          <input
            value={q}
            placeholder="姓名、教学焦点或关键词"
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
        <button type="button" className="btn-secondary" onClick={() => void load()}>
          筛选
        </button>
      </div>

      <div className="figure-table">
        {cases.map((c) => {
          const open = openId === c.id;
          return (
            <div key={c.id} className="figure-row" id={`mingli-case-${c.id}`}>
              <button
                type="button"
                className="figure-row-btn"
                onClick={() => setOpenId(open ? null : c.id)}
              >
                <span>
                  <strong>{c.name}</strong>
                  <span className="muted">
                    {" "}
                    {c.era} · {c.country}
                    {c.region ? ` · ${c.region}` : ""} · {c.field.join("、")}
                  </span>
                </span>
                <span className={`fit-tag fit-${c.fitAssessment}`}>
                  {c.fitAssessment}
                  {c.counterexample ? "·反例" : ""}
                </span>
              </button>
              {open && (
                <div className="figure-detail">
                  <p>
                    <strong>阶层</strong> {c.socialClass} · <strong>时期</strong>{" "}
                    {c.dynastyOrPeriod} · <strong>性别</strong>{" "}
                    {c.gender === "female"
                      ? "女"
                      : c.gender === "male"
                        ? "男"
                        : "未标"}{" "}
                    · <strong>类型</strong> 命例库
                  </p>
                  <p>
                    <strong>地域</strong> {c.country}
                    {c.region ? ` · ${c.region}` : ""}
                    {c.birthPlace ? ` · ${c.birthPlace}` : ""}
                  </p>
                  <p>{c.situation}</p>
                  <p className="muted">{c.bio}</p>
                  <p>
                    <strong>生平结果要点</strong> {c.lifeOutcomeNotes}
                  </p>
                  <p>
                    <strong>教学焦点</strong> {c.pedagogicalFocus.join("、")}
                  </p>
                  {c.teachingAngle ? (
                    <p>
                      <strong>讨论角度</strong> {c.teachingAngle}
                    </p>
                  ) : null}
                  <p>
                    <strong>出生信息</strong>{" "}
                    {c.birth.birthCertainty ?? c.birth.precision}
                    {c.birth.year
                      ? ` · ${c.birth.year}${c.birth.month ? `-${c.birth.month}` : ""}${c.birth.day ? `-${c.birth.day}` : ""}`
                      : " · 日期不可考"}
                    {c.birth.hour == null ? " · 时辰未知" : ` · 时 ${c.birth.hour}`}
                  </p>
                  <p className="muted">{c.birth.note}</p>
                  <p>
                    <strong>结构标签</strong> 日主{" "}
                    {c.chartTags.dayMaster ?? "不明"}
                    {c.chartTags.dayPillar ? ` · 日柱 ${c.chartTags.dayPillar}` : ""}
                    {c.chartTags.yearPillar
                      ? ` · 年 ${c.chartTags.yearPillar}`
                      : ""}
                    {c.chartTags.monthPillar
                      ? ` · 月 ${c.chartTags.monthPillar}`
                      : ""}
                    {c.chartTags.hourPillar
                      ? ` · 时 ${c.chartTags.hourPillar}`
                      : " · 时柱不录"}
                    {c.chartTags.strength ? ` · ${c.chartTags.strength}` : ""}
                  </p>
                  <p className="analysis-note">
                    {c.fitDetail?.tensionNotes ?? c.analysisNotes}
                  </p>
                  {c.linkedFigureId ? (
                    <p className="muted">
                      名人对照库互链：{" "}
                      <a href={`#figures`}>{c.linkedFigureId}</a>
                    </p>
                  ) : null}
                  {c.biorhythmNote ? (
                    <p className="caveat">{c.biorhythmNote}</p>
                  ) : null}
                  <p className="muted">来源：{c.sources.join("；")}</p>
                  <p className="muted">
                    典籍提示：{c.classicalRefs.slice(0, 2).join("；")}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
