import * as AppleAuthentication from "expo-apple-authentication";
import * as AuthSession from "expo-auth-session";
import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

import type { AuthProviderId, AuthUser } from "./auth";

/**
 * Supabase-backed sign-in. Env (EAS secrets / .env):
 *  EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY
 *  EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID, EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID, EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
 * Supabase dashboard: enable Apple (Services ID + key), Google (web client id) and Email (magic link);
 * add redirect URL quranandmore://auth. Quran.com login is routed through the web app's QF OAuth and
 * arrives here as a Supabase custom token once Quran Foundation enables user login for this client.
 */
WebBrowser.maybeCompleteAuthSession();

const secureStorage = {
  getItem: (k: string) => SecureStore.getItemAsync(k),
  setItem: (k: string, v: string) => SecureStore.setItemAsync(k, v),
  removeItem: (k: string) => SecureStore.deleteItemAsync(k),
};

let client: SupabaseClient | null = null;
export const supabase = (): SupabaseClient => {
  if (!client) client = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL!, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!, { auth: { storage: secureStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false } });
  return client;
};

const toUser = (u: { id: string; email?: string | null; user_metadata?: Record<string, unknown>; app_metadata?: Record<string, unknown> } | null, provider: AuthProviderId): AuthUser | null =>
  u ? { id: u.id, email: u.email ?? null, name: (u.user_metadata?.full_name as string | undefined) ?? (u.user_metadata?.name as string | undefined) ?? null, provider } : null;

export const currentUser = async (): Promise<AuthUser | null> => {
  const { data } = await supabase().auth.getUser();
  return toUser(data.user, (data.user?.app_metadata?.provider as AuthProviderId | undefined) ?? "email");
};

export const signInWith = async (provider: AuthProviderId, email?: string): Promise<{ status: "ok" | "sent" | "unavailable" | "failed"; user: AuthUser | null }> => {
  const sb = supabase();
  if (provider === "apple") {
    if (Platform.OS !== "ios" || !(await AppleAuthentication.isAvailableAsync())) return { status: "unavailable", user: null };
    const rawNonce = Crypto.randomUUID();
    const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);
    const cred = await AppleAuthentication.signInAsync({ requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL], nonce: hashedNonce });
    if (!cred.identityToken) return { status: "failed", user: null };
    const { data, error } = await sb.auth.signInWithIdToken({ provider: "apple", token: cred.identityToken, nonce: rawNonce });
    if (error) return { status: "failed", user: null };
    if (cred.fullName?.givenName) await sb.auth.updateUser({ data: { full_name: `${cred.fullName.givenName} ${cred.fullName.familyName ?? ""}`.trim() } }).catch(() => undefined);
    return { status: "ok", user: toUser(data.user, "apple") };
  }
  if (provider === "google") {
    const clientId = Platform.select({ ios: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID, android: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID, default: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID });
    if (!clientId) return { status: "unavailable", user: null };
    const redirectUri = AuthSession.makeRedirectUri({ scheme: "quranandmore", path: "auth" });
    const discovery = { authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth", tokenEndpoint: "https://oauth2.googleapis.com/token" };
    const request = new AuthSession.AuthRequest({ clientId, redirectUri, scopes: ["openid", "email", "profile"], responseType: AuthSession.ResponseType.IdToken, usePKCE: false, extraParams: { nonce: Crypto.randomUUID() } });
    const result = await request.promptAsync(discovery);
    if (result.type !== "success" || !result.params.id_token) return { status: result.type === "cancel" ? "failed" : "failed", user: null };
    const { data, error } = await sb.auth.signInWithIdToken({ provider: "google", token: result.params.id_token });
    return error ? { status: "failed", user: null } : { status: "ok", user: toUser(data.user, "google") };
  }
  if (provider === "email") {
    if (!email) return { status: "failed", user: null };
    const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: "quranandmore://auth" } });
    return { status: error ? "failed" : "sent", user: null };
  }
  // quran: open the web app's Quran Foundation login; the callback returns to quranandmore://auth with a Supabase session token.
  const base = process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://quran-and-more.netlify.app";
  const res = await WebBrowser.openAuthSessionAsync(`${base}/api/auth/start?mobile=1`, "quranandmore://auth");
  if (res.type !== "success") return { status: "failed", user: null };
  const url = new URL(res.url);
  const access = url.searchParams.get("access_token"); const refresh = url.searchParams.get("refresh_token");
  if (!access || !refresh) return { status: "failed", user: null };
  const { data, error } = await sb.auth.setSession({ access_token: access, refresh_token: refresh });
  return error ? { status: "failed", user: null } : { status: "ok", user: toUser(data.user, "quran") };
};

export const signOut = async (): Promise<void> => { await supabase().auth.signOut(); };
