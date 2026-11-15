"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Plus on the web. There is no web checkout yet, so the entitlement is a local flag that the
 * future account / Stripe flow will set; NEXT_PUBLIC_PAYWALL=off turns the gates off entirely.
 */
export const PAYWALL_ENABLED = process.env.NEXT_PUBLIC_PAYWALL !== "off";
const KEY = "qam.plus";

export const readPlus = (): boolean => { try { return JSON.parse(window.localStorage.getItem(KEY) ?? "false") === true; } catch { return false; } };
export const writePlus = (active: boolean) => { try { window.localStorage.setItem(KEY, JSON.stringify(active)); window.dispatchEvent(new Event("qam-plus")); } catch { /* ignore */ } };

export const usePlus = () => {
  const [plus, setPlusState] = useState<boolean>(!PAYWALL_ENABLED);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!PAYWALL_ENABLED) { setReady(true); return; }
    const sync = () => setPlusState(readPlus());
    const q = new URLSearchParams(window.location.search).get("plus");
    if (q === "1" || q === "0") writePlus(q === "1");
    sync(); setReady(true);
    window.addEventListener("storage", sync); window.addEventListener("qam-plus", sync);
    return () => { window.removeEventListener("storage", sync); window.removeEventListener("qam-plus", sync); };
  }, []);
  const setPlus = useCallback((v: boolean) => { writePlus(v); setPlusState(v); }, []);
  return { plus, ready, enabled: PAYWALL_ENABLED, setPlus };
};
