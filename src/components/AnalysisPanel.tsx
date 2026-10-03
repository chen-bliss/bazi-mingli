"use client";

import ReactMarkdown from "react-markdown";

export function AnalysisPanel({
  analysis,
  mode,
}: {
  analysis: string;
  mode?: "llm" | "deterministic";
}) {
  return (
    <section className="panel">
      <header className="section-head">
        <h2>综合演算</h2>
        <p>
          {mode === "llm"
            ? "大模型说理（已注入典籍与节律知识约束）"
            : "本地规则与知识库生成"}
        </p>
      </header>
      <article className="analysis-body">
        <ReactMarkdown>{analysis}</ReactMarkdown>
      </article>
    </section>
  );
}
