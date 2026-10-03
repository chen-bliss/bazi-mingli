"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { AnalysisPanel } from "@/components/AnalysisPanel";
import { AuthButton } from "@/components/AuthButton";
import { BirthForm, type BirthFormValues } from "@/components/BirthForm";
import { BiorhythmPanel } from "@/components/BiorhythmPanel";
import { ChartPanel } from "@/components/ChartPanel";
import { FiguresBrowser } from "@/components/FiguresBrowser";
import { MingliCasesBrowser } from "@/components/MingliCasesBrowser";
import { KnowledgePanel } from "@/components/KnowledgePanel";
import { MatchPanel } from "@/components/MatchPanel";
import { buildReport } from "@/lib/report";
import type { BaZiChart } from "@/lib/bazi";
import type { BiorhythmResult } from "@/lib/biorhythm";
import type { FigureMatch } from "@/lib/figures";

interface QuotaInfo {
  authenticated: boolean;
  authConfigured?: boolean;
  llmConfigured?: boolean;
  quota?: { remaining: number; limit: number; used: number };
  user?: { login?: string; name?: string | null };
}
interface Reading {
  chart: BaZiChart;
  biorhythm: BiorhythmResult;
  matches: FigureMatch[];
  analysis?: string;
  mode?: "llm" | "deterministic";
}

async function loadQuota(): Promise<QuotaInfo> {
  const res = await fetch("/api/quota", {
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error("配额状态暂时不可用");
  return res.json();
}

export default function Home() {
  const { status } = useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reading, setReading] = useState<Reading | null>(null);
  const [quota, setQuota] = useState<QuotaInfo | null>(null);
  const [quotaError, setQuotaError] = useState("");

  useEffect(() => {
    let active = true;
    loadQuota()
      .then((data) => {
        if (active) {
          setQuota(data);
          setQuotaError("");
        }
      })
      .catch(() => {
        if (active) setQuotaError("登录与配额状态暂时不可用，请稍后重试。");
      });
    return () => {
      active = false;
    };
  }, [status]);

  async function run(values: BirthFormValues, action: "chart" | "analyze") {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          ...(action === "analyze" ? { useLlm: true } : {}),
        }),
        signal: AbortSignal.timeout(110_000),
      });
      const data = await res.json().catch(() => {
        throw new Error("服务暂时不可用，请稍后重试");
      });
      if (!res.ok) throw new Error(data.error || "请求失败，请稍后重试");
      setReading(data);
    } catch (e) {
      setError(
        e instanceof Error && e.name !== "TimeoutError"
          ? e.message
          : "请求超时，请稍后重试",
      );
    } finally {
      if (action === "analyze") {
        await loadQuota()
          .then((data) => {
            setQuota(data);
            setQuotaError("");
          })
          .catch(() => setQuotaError("配额状态更新失败，请稍后重试。"));
      }
      setBusy(false);
    }
  }

  function downloadReport() {
    if (!reading) return;
    const { chart, biorhythm, matches, analysis } = reading;
    const url = URL.createObjectURL(
      new Blob([buildReport(chart, biorhythm, matches, analysis)], {
        type: "text/markdown;charset=utf-8",
      }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `八字研习-${chart.solarDate.slice(0, 10)}-${biorhythm.targetDate}.md`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div className="site-shell">
      <a className="skip-link" href="#birth-form">
        跳到出生信息
      </a>
      <div className="topbar">
        <nav aria-label="主导航">
          <a href="#birth-form">排盘</a>
          <a href="#knowledge">典籍</a>
          <a href="#figures">人物库</a>
          <a href="#mingli-cases">命例库</a>
          <a
            href="https://github.com/chen-bliss/bazi-mingli"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
        </nav>
        <AuthButton configured={quota?.authConfigured} />
      </div>
      <header className="hero">
        <p className="eyebrow">子平文献 · 四柱结构 · 文化对照</p>
        <h1 className="brand">八字命理</h1>
        <p className="hero-lead">
          从四柱出发，读懂干支、藏干与十神。结合经典文献研习命理结构，浏览历史人物与教学命例，保留反例与资料缺口。
        </p>
        <div className="hero-tags">
          <span>免费排盘</span>
          <span>典籍研习</span>
          <span>历史命例对照</span>
        </div>
      </header>
      <main>
        <div id="birth-form">
          <BirthForm
            authConfigured={quota?.authConfigured}
            busy={busy}
            llmConfigured={quota?.llmConfigured}
            onChart={(v) => void run(v, "chart")}
            onAnalyze={(v) => void run(v, "analyze")}
          />
        </div>
        <p className="status-line" aria-live="polite">
          {quotaError ||
            (quota
              ? quota.authenticated
                ? `已登录${quota.user?.login ? ` @${quota.user.login}` : ""} · 今日 AI 剩余 ${quota.quota?.remaining ?? "-"} / ${quota.quota?.limit ?? "-"}（UTC 00:00 重置）`
                : quota.authConfigured === false
                  ? "GitHub 登录尚未配置，排盘与资料浏览可正常使用。"
                  : "排盘与资料浏览无需登录；AI 解读需 GitHub 登录。"
              : "正在读取登录状态……")}
          {quota?.llmConfigured === false
            ? quota.authConfigured === false
              ? " · 模型服务尚未配置。"
              : " · 当前使用知识库解读，不扣每日 AI 配额。"
            : ""}
        </p>
        {error && (
          <p className="caveat" role="alert">
            {error}
            {reading ? " 下方仍为上一次成功计算的结果。" : ""}
          </p>
        )}
        {reading && (
          <>
            <div className="result-toolbar">
              <p>
                出生 {reading.chart.solarDate} · 观测{" "}
                {reading.biorhythm.targetDate}
              </p>
              <div className="actions">
                <button className="btn-ghost" onClick={downloadReport}>
                  导出研习报告
                </button>
                <button className="btn-ghost" onClick={() => window.print()}>
                  打印 / 保存 PDF
                </button>
              </div>
            </div>
            <div className="layout-grid two" id="chart">
              <ChartPanel chart={reading.chart} />
              <div id="biorhythm">
                <BiorhythmPanel data={reading.biorhythm} />
              </div>
            </div>
            {reading.matches.length > 0 && (
              <div className="layout-grid" id="matches">
                <MatchPanel matches={reading.matches} />
              </div>
            )}
            {reading.analysis && (
              <div className="layout-grid" id="analyze">
                <AnalysisPanel
                  analysis={reading.analysis}
                  mode={reading.mode}
                />
              </div>
            )}
          </>
        )}
        <div className="layout-grid">
          <KnowledgePanel />
        </div>
        <div className="layout-grid">
          <FiguresBrowser />
        </div>
        <div className="layout-grid">
          <MingliCasesBrowser />
        </div>
      </main>
      <footer className="footnote">
        仅供传统文化与教育研习。强弱与喜用为简化规则的入门参考；人物相似不等于命运复现。经典
        23/28/33
        日生物节律缺乏可靠现代科学支持。本站不提供医疗、法律或投资建议。
      </footer>
    </div>
  );
}
