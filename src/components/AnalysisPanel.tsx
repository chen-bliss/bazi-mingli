"use client";

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
        {analysis.split("\n").map((line, idx) => {
          if (line.startsWith("## ")) {
            return <h3 key={idx}>{line.replace(/^##\s+/, "")}</h3>;
          }
          if (line.startsWith("- ")) {
            return <li key={idx}>{line.replace(/^-+\s*/, "")}</li>;
          }
          if (!line.trim()) return <br key={idx} />;
          return <p key={idx}>{line}</p>;
        })}
      </article>
    </section>
  );
}
