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
  const width = Math.max(4, Math.abs(percent) / 2);
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
  const spark = data.series.slice(0, 16);
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
        aria-label="近两周节律曲线"
      >
        <line
          x1="0"
          y1={h / 2}
          x2={w}
          y2={h / 2}
          stroke="var(--line)"
          strokeDasharray="4 4"
        />
        <path d={pathFor("physical")} fill="none" stroke="var(--accent-teal)" strokeWidth="2" />
        <path d={pathFor("emotional")} fill="none" stroke="var(--accent-rose)" strokeWidth="2" />
        <path d={pathFor("intellectual")} fill="none" stroke="var(--accent-gold)" strokeWidth="2" />
      </svg>

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
