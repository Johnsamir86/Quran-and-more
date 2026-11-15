"use client";

import { useCallback, useEffect, useState } from "react";

/** localStorage-backed state that survives reloads; falls back to memory in private mode. */
export function useLocal<T>(key: string, initial: () => T): [T, (next: T | ((prev: T) => T)) => void, boolean] {
  const [value, setValue] = useState<T>(initial);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try { const raw = window.localStorage.getItem(key); if (raw) setValue(JSON.parse(raw) as T); } catch { /* ignore */ }
    setReady(true);
  }, [key]);
  const set = useCallback((next: T | ((prev: T) => T)) => {
    setValue((prev) => {
      const v = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
      try { window.localStorage.setItem(key, JSON.stringify(v)); } catch { /* ignore */ }
      return v;
    });
  }, [key]);
  return [value, set, ready];
}

export const fmt = (s: string, vars: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
