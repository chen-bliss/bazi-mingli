"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { localDateString } from "@/lib/dates";
import { chartRequestSchema } from "@/lib/validation";

export interface BirthFormValues {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  gender?: "male" | "female";
  dayBoundary: "midnight" | "zi-hour";
  targetDate: string;
  question: string;
  honeypot: string;
  formStartedAt: number;
}

interface Props {
  busy?: boolean;
  llmConfigured?: boolean;
  authConfigured?: boolean;
  onChart: (values: BirthFormValues) => void;
  onAnalyze: (values: BirthFormValues) => void;
}

export function BirthForm({
  busy,
  llmConfigured,
  authConfigured,
  onChart,
  onAnalyze,
}: Props) {
  const startedAt = useRef(0);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    startedAt.current = Date.now();
    const timer = setTimeout(() => setReady(true), 1200);
    return () => clearTimeout(timer);
  }, []);
  const [year, setYear] = useState(1990);
  const [month, setMonth] = useState(5);
  const [day, setDay] = useState(15);
  const [hour, setHour] = useState(10);
  const [minute, setMinute] = useState(0);
  const [gender, setGender] = useState<"" | "male" | "female">("");
  const [dayBoundary, setDayBoundary] = useState<"midnight" | "zi-hour">(
    "midnight",
  );
  const [targetDate, setTargetDate] = useState("");
  const [question, setQuestion] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy || !ready) return;
    const values: BirthFormValues = {
      year,
      month,
      day,
      hour,
      minute,
      gender: gender || undefined,
      dayBoundary,
      targetDate: targetDate || localDateString(),
      question,
      honeypot,
      formStartedAt: startedAt.current,
    };
    const parsed = chartRequestSchema.safeParse(values);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "请检查出生信息");
      return;
    }
    setError("");
    const submitter = (e.nativeEvent as SubmitEvent).submitter;
    if (submitter instanceof HTMLButtonElement && submitter.value === "analyze")
      onAnalyze(values);
    else onChart(values);
  }

  return (
    <form
      className="panel form-grid"
      onSubmit={handleSubmit}
      aria-busy={busy || !ready}
    >
      <header className="section-head">
        <h2>输入出生信息</h2>
        <p>
          使用公历日期与出生地钟表时间。示例生辰可直接排盘，也可修改后查看。
        </p>
      </header>
      <fieldset disabled={busy || !ready} className="form-grid">
        <legend className="sr-only">出生日期与排盘选项</legend>
        <div className="form-row">
          <label>
            年
            <input
              type="number"
              value={year}
              min={1900}
              max={2100}
              onChange={(e) => setYear(Number(e.target.value))}
              required
            />
          </label>
          <label>
            月
            <input
              type="number"
              value={month}
              min={1}
              max={12}
              onChange={(e) => setMonth(Number(e.target.value))}
              required
            />
          </label>
          <label>
            日
            <input
              type="number"
              value={day}
              min={1}
              max={31}
              onChange={(e) => setDay(Number(e.target.value))}
              required
            />
          </label>
          <label>
            时
            <input
              type="number"
              value={hour}
              min={0}
              max={23}
              onChange={(e) => setHour(Number(e.target.value))}
              required
            />
          </label>
          <label>
            分
            <input
              type="number"
              value={minute}
              min={0}
              max={59}
              onChange={(e) => setMinute(Number(e.target.value))}
              required
            />
          </label>
          <label>
            性别（可选）
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as typeof gender)}
            >
              <option value="">不填</option>
              <option value="male">男</option>
              <option value="female">女</option>
            </select>
          </label>
        </div>
        <div className="form-row options-row">
          <label>
            节律观测日期
            <input
              type="date"
              min={`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`}
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              aria-describedby="target-date-note"
            />
          </label>
          <label>
            日柱换日规则
            <select
              value={dayBoundary}
              onChange={(e) =>
                setDayBoundary(e.target.value as typeof dayBoundary)
              }
            >
              <option value="midnight">00:00 换日（默认）</option>
              <option value="zi-hour">23:00 子初换日</option>
            </select>
          </label>
        </div>
        <p className="form-note" id="target-date-note">
          观测日期留空时使用你所在地的今天。换日规则影响 23:00 至 23:59
          的日柱；当前不校正真太阳时或历史夏令时。
        </p>
        <label className="full">
          演算问题（可选）
          <textarea
            value={question}
            maxLength={500}
            rows={3}
            placeholder="例如：请据月令与藏干说明结构，并解释强弱初判的局限。"
            onChange={(e) => setQuestion(e.target.value)}
          />
        </label>
        <label className="hp" aria-hidden="true">
          网站
          <input
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
          />
        </label>
        <div className="actions">
          <button type="submit" value="chart" className="btn-primary">
            {busy ? "处理中……" : ready ? "排盘与节律" : "准备中……"}
          </button>
          <button
            type="submit"
            value="analyze"
            className="btn-secondary"
            disabled={authConfigured === false}
          >
            {authConfigured === false
              ? "解读需配置登录"
              : llmConfigured === false
                ? "知识库解读（需登录）"
                : "AI 解读（需登录）"}
          </button>
        </div>
      </fieldset>
      <p className="form-note">
        生辰用于本次计算；使用 AI 解读时，本次排盘与问题将发送到配置的模型服务。
      </p>
      {error && (
        <p className="caveat" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
