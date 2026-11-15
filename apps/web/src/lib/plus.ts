"use client";

import { useCallback, useEffect, useState } from "react";

import { PLAN_LIMITS, bumpUsage, usageAllowed, type PlanId, type UsageRecord } from "@qam/core";

/**
 * Plans on the web. There is no web checkout yet, so the plan is a local value the future
 * account / Stripe flow will set; NEXT_PUBLIC_PAYWALL=off turns the gates off entirely.
 */
export const PAYWALL_ENABLED = process.env.NEXT_PUBLIC_PAYWALL !== "off";
const KEY = "qam.plus";
const USAGE_KEY = "qam.usage.v1";

export const readPlan = (): PlanId => {
  try { const v = JSON.parse(window.localStorage.getItem(KEY) ?? "null"); if (v === true) return "unlimited"; return v === "plus" || v === "unlimited" ? v : "free"; } catch { return "free"; }
};
export const writePlan = (plan: PlanId) => { try { window.localStorage.setItem(KEY, JSON.stringify(plan)); window.dispatchEvent(new Event("qam-plus")); } catch { /* ignore */ } };

export const usePlus = () => {
  const [plan, setPlanState] = useState<PlanId>(PAYWALL_ENABLED ? "free" : "unlimited");
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!PAYWALL_ENABLED) { setReady(true); return; }
    const sync = () => setPlanState(readPlan());
    const q = new URLSearchParams(window.location.search).get("plus");
    if (q === "0" || q === "1" || q === "2") writePlan(q === "0" ? "free" : q === "1" ? "plus" : "unlimited");
    sync(); setReady(true);
    window.addEventListener("storage", sync); window.addEventListener("qam-plus", sync);
    return () => { window.removeEventListener("storage", sync); window.removeEventListener("qam-plus", sync); };
  }, []);
  const setPlan = useCallback((v: PlanId) => { writePlan(v); setPlanState(v); }, []);
  return { plan, plus: plan !== "free", unlimited: plan === "unlimited", limits: PLAN_LIMITS[plan], ready, enabled: PAYWALL_ENABLED, setPlan };
};

/** Device-side counters for the Plus limits (Ask per day, videos per month). */
export const useUsage = () => {
  const { plan } = usePlus();
  const read = (): UsageRecord | null => { try { return JSON.parse(window.localStorage.getItem(USAGE_KEY) ?? "null") as UsageRecord | null; } catch { return null; } };
  const allowed = (kind: "ask" | "video") => usageAllowed(plan, read(), kind, new Date());
  const bump = (kind: "ask" | "video") => { try { window.localStorage.setItem(USAGE_KEY, JSON.stringify(bumpUsage(read(), kind, new Date()))); } catch { /* ignore */ } };
  return { allowed, bump, plan };
};
