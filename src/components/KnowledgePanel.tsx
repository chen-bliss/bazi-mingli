"use client";

import { useState } from "react";
import { CLASSIC_ENTRIES } from "@/lib/knowledge";

export function KnowledgePanel() {
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLowerCase();
  const entries = CLASSIC_ENTRIES.filter((entry) =>
    [entry.title, entry.source, entry.theme, entry.excerpt].some((value) =>
      value.toLowerCase().includes(normalized),
    ),
  );
  return (
    <section className="panel" id="knowledge">
      <header className="section-head">
        <h2>典籍研习摘记</h2>
        <p>把日主、月令、十神与用神放回文献框架中理解。</p>
      </header>
      <p className="form-note knowledge-note">
        以下为项目整理的研习摘要，部分含短引文；尚未标注具体版本、卷次与页码，不宜作为论文引用或古籍逐字原文。
      </p>
      <label>
        搜索典籍与主题
        <input
          type="search"
          value={query}
          placeholder="例如：十神、旺衰、滴天髓"
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      <p className="status-line" role="status">
        找到 {entries.length} 条摘记
      </p>
      <div className="knowledge-grid">
        {entries.map((entry) => (
          <details className="knowledge-entry" key={entry.id}>
            <summary>
              {entry.title}
              <span className="muted"> · {entry.source}</span>
            </summary>
            <p className="muted">
              {entry.era} · {entry.theme}
            </p>
            <p>{entry.excerpt}</p>
            <p>
              <strong>研习应用：</strong>
              {entry.application}
            </p>
          </details>
        ))}
      </div>
      {entries.length === 0 && (
        <p className="empty-state">暂无相关摘记，请换一个关键词。</p>
      )}
    </section>
  );
}
