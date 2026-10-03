"use client";

import { useEffect, useRef, useState } from "react";

async function fetchJson(url: string, signal: AbortSignal) {
  const response = await fetch(url, {
    signal: AbortSignal.any([signal, AbortSignal.timeout(15_000)]),
  });
  if (!response.ok) throw new Error("资料加载失败，请稍后重试");
  return response.json();
}

export function useCatalog<Row, Stats>(endpoint: string, rowKey: string) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const controller = useRef<AbortController | null>(null);

  useEffect(() => {
    const initial = new AbortController();
    controller.current = initial;
    Promise.all([
      fetchJson(`${endpoint}?stats=1`, initial.signal),
      fetchJson(endpoint, initial.signal),
    ])
      .then(([summary, data]) => {
        if (!initial.signal.aborted) {
          setStats(summary);
          setRows(data[rowKey] ?? []);
        }
      })
      .catch(() => {
        if (!initial.signal.aborted) setError("资料加载失败，请点击筛选重试。");
      })
      .finally(() => {
        if (!initial.signal.aborted) setBusy(false);
      });
    return () => {
      controller.current?.abort();
    };
  }, [endpoint, rowKey]);

  async function load(params = new URLSearchParams()) {
    controller.current?.abort();
    const request = new AbortController();
    controller.current = request;
    setBusy(true);
    setError("");
    try {
      const [summary, data] = await Promise.all([
        stats
          ? Promise.resolve(stats)
          : fetchJson(`${endpoint}?stats=1`, request.signal),
        fetchJson(`${endpoint}?${params}`, request.signal),
      ]);
      if (!request.signal.aborted) {
        setStats(summary);
        setRows(data[rowKey] ?? []);
      }
    } catch {
      if (!request.signal.aborted)
        setError("资料加载失败，请稍后重试。当前保留上次结果。");
    } finally {
      if (!request.signal.aborted) setBusy(false);
    }
  }
  return { stats, rows, busy, error, load };
}

export function useHashSelection(prefix: string) {
  const [openId, setOpenId] = useState<string | null>(null);
  useEffect(() => {
    const readHash = () => {
      if (window.location.hash.startsWith(prefix)) {
        setOpenId(window.location.hash.slice(prefix.length));
      }
    };
    window.addEventListener("hashchange", readHash);
    queueMicrotask(readHash);
    return () => window.removeEventListener("hashchange", readHash);
  }, [prefix]);
  return [openId, setOpenId] as const;
}
