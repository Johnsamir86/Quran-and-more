import { useCallback, useState } from "react";

/**
 * Accounts (Apple, Google, email magic link, Quran.com) through Supabase.
 * Until EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY are set the
 * feature reports `enabled: false` and the UI shows the guest state.
 */
export type AuthProviderId = "apple" | "google" | "email" | "quran";
export interface AuthUser { id: string; email: string | null; name: string | null; provider: AuthProviderId | null }

export const AUTH_ENABLED = Boolean(process.env.EXPO_PUBLIC_SUPABASE_URL && process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [busy, setBusy] = useState<AuthProviderId | null>(null);
  const signIn = useCallback(async (provider: AuthProviderId, email?: string): Promise<"ok" | "sent" | "unavailable" | "failed"> => {
    if (!AUTH_ENABLED) return "unavailable";
    setBusy(provider);
    try {
      const mod = await import("./auth-supabase");
      const r = await mod.signInWith(provider, email);
      if (r.user) setUser(r.user);
      return r.status;
    } catch { return "failed"; } finally { setBusy(null); }
  }, []);
  const signOut = useCallback(async () => {
    if (!AUTH_ENABLED) return;
    try { const mod = await import("./auth-supabase"); await mod.signOut(); } catch { /* ignore */ }
    setUser(null);
  }, []);
  return { enabled: AUTH_ENABLED, user, busy, signIn, signOut };
};
