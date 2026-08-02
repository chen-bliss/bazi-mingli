"use client";

import { FormEvent, useMemo, useState } from "react";

export interface BirthFormValues {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  gender?: "male" | "female";
  question: string;
  honeypot: string;
  formStartedAt: number;
}

interface Props {
  busy?: boolean;
  onChart: (values: BirthFormValues) => void;
  onAnalyze: (values: BirthFormValues) => void;
}

export function BirthForm({ busy, onChart, onAnalyze }: Props) {
  const startedAt = useMemo(() => Date.now(), []);
  const [year, setYear] = useState(1990);
  const [month, setMonth] = useState(5);
  const [day, setDay] = useState(15);
  const [hour, setHour] = useState(10);
  const [minute, setMinute] = useState(0);
  const [gender, setGender] = useState<"" | "male" | "female">("");
  const [question, setQuestion] = useState("");
  const [honeypot, setHoneypot] = useState("");

  function collect(): BirthFormValues {
    return {
      year,
      month,
      day,
      hour,
      minute,
      gender: gender || undefined,
      question,
      honeypot,
      formStartedAt: startedAt,
    };
  }

  function handleChart(e: FormEvent) {
    e.preventDefault();
    onChart(collect());
  }

  return (
    <form className="panel form-grid" onSubmit={handleChart}>
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

      <label className="full">
        演算问题（可选）
        <textarea
          value={question}
          maxLength={500}
          rows={3}
          placeholder="例如：请据月令与用神，说明此造气势走向，并对照今日生物节律作文化说明。"
          onChange={(e) => setQuestion(e.target.value)}
        />
      </label>

      {/* honeypot */}
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
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? "计算中……" : "排盘与节律"}
        </button>
        <button
          type="button"
          className="btn-secondary"
          disabled={busy}
          onClick={() => onAnalyze(collect())}
        >
          LLM 演算（需登录）
        </button>
      </div>
    </form>
  );
}
