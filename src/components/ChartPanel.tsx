"use client";

import type { BaZiChart } from "@/lib/bazi";

const PILLAR_LABELS = {
  year: "年柱",
  month: "月柱",
  day: "日柱",
  hour: "时柱",
} as const;

export function ChartPanel({ chart }: { chart: BaZiChart }) {
  return (
    <section className="panel">
      <header className="section-head">
        <h2>四柱八字</h2>
        <p>
          {chart.solarDate} · {chart.lunarDate} · 生肖{chart.shengXiao}
        </p>
      </header>

      <div className="pillar-grid">
        {(Object.keys(PILLAR_LABELS) as Array<keyof typeof PILLAR_LABELS>).map(
          (key) => {
            const p = chart.pillars[key];
            return (
              <div key={key} className="pillar">
                <div className="pillar-label">{PILLAR_LABELS[key]}</div>
                <div className="pillar-gz">{p.ganZhi}</div>
                <div className="pillar-meta">纳音 {p.naYin}</div>
                <div className="pillar-meta">五行 {p.wuXing}</div>
                <div className="pillar-meta">
                  十神 {key === "day" ? "日主" : p.shiShenGan}
                </div>
                <div className="pillar-meta">
                  藏干 {p.hiddenStems.join("、")}
                </div>
                <div className="pillar-meta">
                  支十神 {p.shiShenZhi.join("、")}
                </div>
              </div>
            );
          },
        )}
      </div>

      <div className="meta-block">
        <p>
          <strong>日主</strong> {chart.dayMaster}（{chart.dayMasterWuXing}） ·{" "}
          <strong>强弱初判</strong> {chart.strength.label}（
          {chart.strength.score}）
        </p>
        <p>{chart.strength.summary}</p>
        <p>
          <strong>喜用倾向</strong> {chart.usefulGods.join("、")}
        </p>
        <p>
          <strong>五行统计</strong>{" "}
          {Object.entries(chart.wuXingCount)
            .map(([k, v]) => `${k}${v}`)
            .join(" · ")}
        </p>
      </div>

      <div className="element-grid" aria-label="五行表层计数">
        {Object.entries(chart.wuXingCount).map(([element, count]) => (
          <div key={element}>
            <div className="element-bar">
              <span style={{ height: `${(count / 8) * 100}%` }} />
            </div>
            <span>
              {element} · {count}
            </span>
          </div>
        ))}
      </div>
      <details className="calculation-note">
        <summary>排盘口径与初判局限</summary>
        <p>
          日柱：
          {chart.calculation.dayBoundary === "midnight"
            ? "00:00 换日"
            : "23:00 子初换日"}
          。
        </p>
        <p>{chart.calculation.timeBasis}</p>
        <p>{chart.calculation.strengthMethod}</p>
        <p>五行柱形图仅统计四柱天干与地支本气共八项，藏干另列展示。</p>
      </details>
      <ul className="hint-list">
        {chart.classicalHints.map((h) => (
          <li key={h}>{h}</li>
        ))}
      </ul>
    </section>
  );
}
