import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useRef, useState } from "react";

/** AsyncStorage-backed state: loads once, writes on every change. `ready` turns true after the first read. */
export function useStored<T>(key: string, initial: () => T): [T, (next: T | ((prev: T) => T)) => void, boolean] {
  const [value, setValue] = useState<T>(initial);
  const [ready, setReady] = useState(false);
  const latest = useRef(value);
  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(key).then((raw) => { if (alive && raw) { const v = JSON.parse(raw) as T; latest.current = v; setValue(v); } }).catch(() => undefined).finally(() => { if (alive) setReady(true); });
    return () => { alive = false; };
  }, [key]);
  const set = useCallback((next: T | ((prev: T) => T)) => {
    setValue((prev) => {
      const v = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
      latest.current = v;
      AsyncStorage.setItem(key, JSON.stringify(v)).catch(() => undefined);
      return v;
    });
  }, [key]);
  return [value, set, ready];
}

export const fmt = (s: string, vars: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
