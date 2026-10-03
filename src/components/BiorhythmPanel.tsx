"use client";

import type { BiorhythmResult } from "@/lib/biorhythm";

function Bar({
  label,
  percent,
  phase,
  tone,
}: {
  label: string;
  percent: number;
  phase: string;
  tone: string;
}) {
  const width = Math.abs(percent) / 2;
  const positive = percent >= 0;
  return (
    <div className="bio-row">
      <div className="bio-label">
        <span>{label}</span>
        <span>
          {percent.toFixed(1)}% · {phase}
        </span>
      </div>
      <div className="bio-track">
        <div className="bio-mid" />
        <div
          className="bio-fill"
          style={{
            width: `${width}%`,
            background: tone,
            left: positive ? "50%" : `calc(50% - ${width}%)`,
          }}
        />
      </div>
    </div>
  );
}

export function BiorhythmPanel({ data }: { data: BiorhythmResult }) {
  const spark = data.series;
  const w = 320;
  const h = 80;
  const pathFor = (key: "physical" | "emotional" | "intellectual") => {
    return spark
      .map((p, i) => {
        const x = (i / Math.max(1, spark.length - 1)) * w;
        const y = h / 2 - p[key] * (h / 2 - 4);
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  };

  return (
    <section className="panel">
      <header className="section-head">
        <h2>生物节律</h2>
        <p>
          出生 {data.birthDate} · 观测 {data.targetDate} · 已历 {data.daysAlive}{" "}
          日
        </p>
      </header>

      <Bar
        label="体力 23 日"
        percent={data.today.physical.percent}
        phase={data.today.physical.phase}
        tone="var(--accent-teal)"
      />
      <Bar
        label="情绪 28 日"
        percent={data.today.emotional.percent}
        phase={data.today.emotional.phase}
        tone="var(--accent-rose)"
      />
      <Bar
        label="智力 33 日"
        percent={data.today.intellectual.percent}
        phase={data.today.intellectual.phase}
        tone="var(--accent-gold)"
      />

      <svg
        className="bio-spark"
        viewBox={`0 0 ${w} ${h}`}
        role="img"
        aria-label={`从 ${data.targetDate} 起未来 ${spark.length - 1} 日节律曲线：青色体力、红色情绪、金色智力`}
      >
        <line
          x1="0"
          y1={h / 2}
          x2={w}
          y2={h / 2}
          stroke="var(--line)"
          strokeDasharray="4 4"
        />
        <path
          d={pathFor("physical")}
          fill="none"
          stroke="var(--accent-teal)"
          strokeWidth="2"
        />
        <path
          d={pathFor("emotional")}
          fill="none"
          stroke="var(--accent-rose)"
          strokeWidth="2"
        />
        <path
          d={pathFor("intellectual")}
          fill="none"
          stroke="var(--accent-gold)"
          strokeWidth="2"
        />
      </svg>

      <div className="spark-caption">
        <span>{spark[0]?.date}</span>
        <span>{spark.at(-1)?.date}</span>
      </div>
      <div className="spark-legend">
        <span className="tone-physical">体力 · 23 日</span>
        <span className="tone-emotional">情绪 · 28 日</span>
        <span className="tone-intellectual">智力 · 33 日</span>
      </div>
      <details className="calculation-note">
        <summary>查看每日曲线数值</summary>
        <div className="daily-values">
          <table>
            <caption>观测日起的节律百分比（文化趣味参考）</caption>
            <thead>
              <tr>
                <th>日期</th>
                <th>体力</th>
                <th>情绪</th>
                <th>智力</th>
              </tr>
            </thead>
            <tbody>
              {spark.map((point) => (
                <tr key={point.date}>
                  <th scope="row">{point.date}</th>
                  <td>{(point.physical * 100).toFixed(1)}%</td>
                  <td>{(point.emotional * 100).toFixed(1)}%</td>
                  <td>{(point.intellectual * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
      {data.criticalDaysAhead.length > 0 && (
        <p className="meta-block">
          <strong>未来临界日（趣味参考）</strong>{" "}
          {data.criticalDaysAhead.join("、")}
        </p>
      )}

      <p className="caveat">{data.scientificCaveat}</p>
    </section>
  );
}
