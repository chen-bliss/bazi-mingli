"use client";

import type { FigureMatch } from "@/lib/figures";

export function MatchPanel({ matches }: { matches: FigureMatch[] }) {
  if (!matches.length) {
    return (
      <section className="panel">
        <header className="section-head">
          <h2>历史上相近人物</h2>
          <p>暂无足够结构化特征可匹配</p>
        </header>
      </section>
    );
  }

  return (
    <section className="panel">
      <header className="section-head">
        <h2>历史上相近人物</h2>
        <p>
          按日干支、阴阳、月令季节、五行向量余弦与十神倾向做确定性类比；结果尽量纳入“不符合/反例”。
          相似分是检索排序分，不代表概率或命运符合率。属教育对照。详见{" "}
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

      <div className="match-list">
        {matches.map((m) => (
          <article key={m.figure.id} className="match-card">
            <div className="match-top">
              <div>
                <h3>
                  {m.figure.name}
                  {m.figure.nameEn ? (
                    <span className="muted"> · {m.figure.nameEn}</span>
                  ) : null}
                </h3>
                <p className="muted">
                  {m.figure.era} ·{" "}
                  {m.figure.gender === "female"
                    ? "女"
                    : m.figure.gender === "male"
                      ? "男"
                      : "性别未标"}{" "}
                  · {m.figure.country}
                  {m.figure.region ? `/${m.figure.region}` : ""} ·{" "}
                  {m.figure.socialClass} · {m.figure.field.join("、")}
                </p>
              </div>
              <div className="match-score">
                <span>{m.score}</span>
                <small>类比分</small>
              </div>
            </div>

            <p>{m.figure.situation}</p>
            <p className="muted">{m.figure.bio}</p>

            <p>
              <strong>推演评估</strong> {m.figure.fitAssessment}
              {m.figure.counterexample ? " · 反例样本" : ""}
              {m.figure.chartTags.dayMaster
                ? ` · 日主 ${m.figure.chartTags.dayMaster}`
                : ""}
              {m.figure.birth.birthCertainty
                ? ` · 出生置信 ${m.figure.birth.birthCertainty}`
                : ""}
            </p>
            {m.figure.fitDetail?.tensionNotes ? (
              <p className="analysis-note">{m.figure.fitDetail.tensionNotes}</p>
            ) : (
              <p className="analysis-note">{m.figure.analysisNotes}</p>
            )}

            <ul className="hint-list">
              {m.reasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
            {m.caveats.map((c) => (
              <p key={c} className="caveat">
                {c}
              </p>
            ))}
            <p className="muted">
              来源：{m.figure.sources.slice(0, 2).join("；")}
            </p>
            {(m.linkedCaseId || m.figure.linkedCaseId) && (
              <p>
                <a
                  href={`#mingli-case-${m.linkedCaseId || m.figure.linkedCaseId}`}
                >
                  查看命例库教学条目
                </a>
                <span className="muted">（排盘与格局教学，非命运证明）</span>
              </p>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
