import { useCallback, useEffect, useState } from "react";

/**
 * Offline Audio subscription (RevenueCat). Product ids:
 *  - offline_audio_monthly  $1.99 / month
 *  - offline_audio_yearly   $14.99 / year  (7-day trial)
 * Until EXPO_PUBLIC_REVENUECAT_IOS_KEY / _ANDROID_KEY are set the hook reports
 * `enabled: false` and nothing is gated in test builds.
 */
export const OFFLINE_AUDIO_ENTITLEMENT = "offline_audio";
export const PRODUCT_IDS = { monthly: "offline_audio_monthly", yearly: "offline_audio_yearly" } as const;
export const PURCHASES_ENABLED = Boolean(process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY);

export interface Entitlements { offlineAudio: boolean; expiresAt: string | null }

export const useEntitlements = () => {
  const [ent, setEnt] = useState<Entitlements>({ offlineAudio: !PURCHASES_ENABLED, expiresAt: null });
  const [busy, setBusy] = useState(false);
  const refresh = useCallback(async () => {
    if (!PURCHASES_ENABLED) return;
    try { const mod = await import("./purchases-revenuecat"); setEnt(await mod.getEntitlements()); } catch { /* keep */ }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  const purchase = useCallback(async (plan: keyof typeof PRODUCT_IDS): Promise<"ok" | "cancelled" | "unavailable" | "failed"> => {
    if (!PURCHASES_ENABLED) return "unavailable";
    setBusy(true);
    try { const mod = await import("./purchases-revenuecat"); const r = await mod.purchase(PRODUCT_IDS[plan]); await refresh(); return r; } catch { return "failed"; } finally { setBusy(false); }
  }, [refresh]);
  const restore = useCallback(async () => { if (!PURCHASES_ENABLED) return; setBusy(true); try { const mod = await import("./purchases-revenuecat"); await mod.restore(); await refresh(); } finally { setBusy(false); } }, [refresh]);
  return { enabled: PURCHASES_ENABLED, entitlements: ent, busy, purchase, restore };
};
