import type { AuthProviderId, AuthUser } from "./auth";

/**
 * Supabase-backed sign-in. Loaded lazily only when the Supabase env is present, so
 * builds without accounts do not need the SDK at runtime. Providers:
 *  - apple: expo-apple-authentication → supabase.auth.signInWithIdToken
 *  - google: expo-auth-session (Google) → signInWithIdToken
 *  - email: signInWithOtp (magic link to quranandmore://auth)
 *  - quran: Quran Foundation OAuth via the web app (/api/auth/start) once QF enables user login
 * The wiring is completed in task "Sign-in" once the Supabase project exists.
 */
export const signInWith = async (provider: AuthProviderId, email?: string): Promise<{ status: "ok" | "sent" | "unavailable" | "failed"; user: AuthUser | null }> => {
  void provider; void email;
  return { status: "unavailable", user: null };
};

export const signOut = async (): Promise<void> => undefined;
