"use client";

import { useEffect, useState } from "react";
import { useCatalog, useHashSelection } from "./useCatalog";
import type { HistoricalFigure } from "@/lib/figures";

interface Stats {
  total: number;
  counterexamples: number;
  fitAssessment: Record<string, number>;
  fields: string[];
  countries?: string[];
  female?: number;
  countryCount?: number;
  withComputableDay?: number;
}

export function FiguresBrowser() {
  const {
    stats,
    rows: figures,
    busy,
    error,
    load: loadRows,
  } = useCatalog<HistoricalFigure, Stats>("/api/figures", "figures");
  const [field, setField] = useState("");
  const [fit, setFit] = useState("");
  const [gender, setGender] = useState("");
  const [country, setCountry] = useState("");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useHashSelection("#figure-");

  async function load() {
    const params = new URLSearchParams();
    if (field) params.set("field", field);
    if (fit) params.set("fit", fit);
    if (gender) params.set("gender", gender);
    if (country) params.set("country", country);
    if (q) params.set("q", q);
    await loadRows(params);
  }

  useEffect(() => {
    if (!openId) return;
    const frame = requestAnimationFrame(() =>
      document
        .getElementById(`figure-${openId}`)
        ?.scrollIntoView({ block: "nearest" }),
    );
    return () => cancelAnimationFrame(frame);
  }, [openId, figures]);

  return (
    <section className="panel" id="figures">
      <header className="section-head">
        <h2>历史人物库（名人对照）</h2>
        <p>
          {stats
            ? `共 ${stats.total} 人（女 ${stats.female ?? "-"}，反例 ${stats.counterexamples}，可排日柱约 ${stats.withComputableDay ?? "-"}）；约 ${stats.countryCount ?? "-"} 个国家或文明圈，${stats.fields.length} 个领域标签`
            : "加载中……"}
          。本库用于相似人物对照；格局教学见下方「历史命例库」。详见{" "}
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

      <form
        className="browser-filters"
        onSubmit={(event) => {
          event.preventDefault();
          void load();
        }}
      >
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
          搜索
          <input
            value={q}
            placeholder="姓名、国家或关键词"
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
        <button type="submit" className="btn-secondary">
          {busy ? "加载中……" : "筛选"}
        </button>
        <button
          type="button"
          className="btn-ghost"
          onClick={() => {
            setField("");
            setFit("");
            setGender("");
            setCountry("");
            setQ("");
            void loadRows();
          }}
        >
          重置
        </button>
      </form>

      {error && (
        <p className="caveat" role="alert">
          {error}
        </p>
      )}
      <p className="status-line" role="status">
        {busy ? "正在加载资料……" : `当前显示 ${figures.length} 条`}
      </p>
      {!busy && !error && figures.length === 0 && (
        <p className="empty-state">
          没有符合条件的资料，请调整筛选或点击重置。
        </p>
      )}
      <div className="figure-table" aria-busy={busy}>
        {figures.map((f) => {
          const open = openId === f.id;
          return (
            <div key={f.id} className="figure-row" id={`figure-${f.id}`}>
              <button
                type="button"
                className="figure-row-btn"
                aria-expanded={open}
                aria-controls={`detail-${f.id}`}
                onClick={() => setOpenId(open ? null : f.id)}
              >
                <span>
                  <strong>{f.name}</strong>
                  <span className="muted">
                    {" "}
                    {f.era} · {f.country} · {f.field.join("、")}
                  </span>
                </span>
                <span className={`fit-tag fit-${f.fitAssessment}`}>
                  {f.fitAssessment}
                  {f.counterexample ? "·反例" : ""}
                </span>
              </button>
              {open && (
                <div className="figure-detail" id={`detail-${f.id}`}>
                  <p>
                    <strong>阶层</strong> {f.socialClass} ·{" "}
                    <strong>时期</strong> {f.dynastyOrPeriod} ·{" "}
                    <strong>性别</strong>{" "}
                    {f.gender === "female"
                      ? "女"
                      : f.gender === "male"
                        ? "男"
                        : "未标"}
                  </p>
                  <p>
                    <strong>地域</strong> {f.country}
                    {f.region ? ` · ${f.region}` : ""}
                    {f.birthPlace ? ` · ${f.birthPlace}` : ""}
                  </p>
                  <p>{f.situation}</p>
                  <p className="muted">{f.bio}</p>
                  <p>
                    <strong>出生信息</strong>{" "}
                    {f.birth.birthCertainty ?? f.birth.precision}
                    {f.birth.year
                      ? ` · ${f.birth.year}${f.birth.month ? `-${f.birth.month}` : ""}${f.birth.day ? `-${f.birth.day}` : ""}`
                      : " · 日期不可考"}
                    {f.birth.hour == null
                      ? " · 时辰未知"
                      : ` · 时 ${f.birth.hour}`}
                  </p>
                  <p className="muted">{f.birth.note}</p>
                  <p>
                    <strong>结构标签</strong> 日主{" "}
                    {f.chartTags.dayMaster ?? "不明"}
                    {f.chartTags.dayPillar
                      ? ` · 日柱 ${f.chartTags.dayPillar}`
                      : ""}
                    {f.chartTags.dayMasterYinYang
                      ? ` · ${f.chartTags.dayMasterYinYang}`
                      : ""}
                    {f.chartTags.seasonality
                      ? ` · ${f.chartTags.seasonality}`
                      : ""}
                    {f.chartTags.strength ? ` · ${f.chartTags.strength}` : ""}
                  </p>
                  <p className="analysis-note">
                    {f.fitDetail?.tensionNotes ?? f.analysisNotes}
                  </p>
                  {f.biorhythmNote ? (
                    <p className="caveat">{f.biorhythmNote}</p>
                  ) : null}
                  <p className="muted">来源：{f.sources.join("；")}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
