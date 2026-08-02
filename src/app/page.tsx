"use client";

import { useEffect, useState } from "react";
import { AnalysisPanel } from "@/components/AnalysisPanel";
import { AuthButton } from "@/components/AuthButton";
import { BirthForm, type BirthFormValues } from "@/components/BirthForm";
import { BiorhythmPanel } from "@/components/BiorhythmPanel";
import { ChartPanel } from "@/components/ChartPanel";
import { FiguresBrowser } from "@/components/FiguresBrowser";
import { MingliCasesBrowser } from "@/components/MingliCasesBrowser";
import { MatchPanel } from "@/components/MatchPanel";
import type { BaZiChart } from "@/lib/bazi";
import type { BiorhythmResult } from "@/lib/biorhythm";
import type { FigureMatch } from "@/lib/figures";

interface QuotaInfo {
  authenticated: boolean;
  llmConfigured?: boolean;
  quota?: { remaining: number; limit: number; used: number };
  user?: { login?: string; name?: string | null };
}

export default function Home() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [chart, setChart] = useState<BaZiChart | null>(null);
  const [biorhythm, setBiorhythm] = useState<BiorhythmResult | null>(null);
  const [matches, setMatches] = useState<FigureMatch[]>([]);
  const [analysis, setAnalysis] = useState("");
  const [mode, setMode] = useState<"llm" | "deterministic">();
  const [quota, setQuota] = useState<QuotaInfo | null>(null);

  async function refreshQuota() {
    const res = await fetch("/api/quota");
    if (res.ok) setQuota(await res.json());
  }

  useEffect(() => {
    void refreshQuota();
  }, []);

  async function runChart(values: BirthFormValues) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/chart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "排盘失败");
      setChart(data.chart);
      setBiorhythm(data.biorhythm);
      setMatches(data.matches ?? []);
      setAnalysis("");
      setMode(undefined);
    } catch (e) {
      setError(e instanceof Error ? e.message : "排盘失败");
    } finally {
      setBusy(false);
    }
  }

  async function runAnalyze(values: BirthFormValues) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, useLlm: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === "AUTH_REQUIRED") {
          throw new Error("请先点击右上角使用 GitHub 登录，再进行 LLM 演算");
        }
        throw new Error(data.error || "演算失败");
      }
      setChart(data.chart);
      setBiorhythm(data.biorhythm);
      setAnalysis(data.analysis);
      setMode(data.mode);
      if (!matches.length) {
        const mRes = await fetch("/api/figures/match", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
        if (mRes.ok) {
          const mData = await mRes.json();
          setMatches(mData.matches ?? []);
        }
      }
      await refreshQuota();
    } catch (e) {
      setError(e instanceof Error ? e.message : "演算失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="site-shell">
      <div className="topbar">
        <nav>
          <a href="#chart">排盘</a>
          <a href="#biorhythm">节律</a>
          <a href="#matches">相近人物</a>
          <a href="#figures">人物库</a>
          <a href="#mingli-cases">命例库</a>
          <a href="#analyze">演算</a>
          <a
            href="https://github.com/chen-bliss/bazi-mingli"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
        </nav>
        <AuthButton />
      </div>

      <header className="hero">
        <p className="brand">八字命理</p>
        <p className="hero-lead">
          以子平命理、《渊海子平》《三命通会》《滴天髓阐微》为说理依据进行四柱排盘，
          并并置经典生物节律、历史人物相似对照与历史命例库（格局教学，含不符合与资料不足）。大模型演算需
          GitHub 登录并受每日配额约束。
        </p>
      </header>

      <BirthForm busy={busy} onChart={runChart} onAnalyze={runAnalyze} />

      {quota && (
        <p className="status-line">
          {quota.authenticated
            ? `已登录${quota.user?.login ? ` @${quota.user.login}` : ""} · 今日 LLM 剩余 ${quota.quota?.remaining ?? "-"} / ${quota.quota?.limit ?? "-"}`
            : "未登录：可排盘、节律与人物匹配；LLM 演算需 GitHub 登录"}
          {quota.llmConfigured === false ? " · 服务端尚未配置 LLM" : ""}
        </p>
      )}
      {error && <p className="caveat">{error}</p>}

      <div className="layout-grid two" id="chart">
        {chart && <ChartPanel chart={chart} />}
        {biorhythm && (
          <div id="biorhythm">
            <BiorhythmPanel data={biorhythm} />
          </div>
        )}
      </div>

      {matches.length > 0 && (
        <div className="layout-grid" id="matches" style={{ marginTop: "1rem" }}>
          <MatchPanel matches={matches} />
        </div>
      )}

      {analysis && (
        <div className="layout-grid" id="analyze" style={{ marginTop: "1rem" }}>
          <AnalysisPanel analysis={analysis} mode={mode} />
        </div>
      )}

      <div className="layout-grid" style={{ marginTop: "1rem" }}>
        <FiguresBrowser />
      </div>

      <div className="layout-grid" style={{ marginTop: "1rem" }}>
        <MingliCasesBrowser />
      </div>

      <footer className="footnote">
        免责声明：命理、人物匹配与命例库属传统文化与教育对照；经典 23/28/33
        日生物节律缺乏可靠现代科学支持。人物相似不等于命运复现；未知时辰不伪造。本站不作医疗、法律或决策建议。
        GitHub Models 已于 2026-07-30 退役，请使用 Azure AI Foundry 或其他 OpenAI 兼容接口。
        另：GitHub 上已有他仓同名项目，本仓库归属 chen-bliss，请以完整路径区分。
      </footer>
    </div>
  );
}
