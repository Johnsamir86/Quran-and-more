import { AZAN_STORAGE_KEY, DEFAULT_AZAN_SETTINGS, normalizeAzanSettings, type AzanSettings } from "@qam/core";

/** Browser-side helpers for the azan page: settings persistence, geocoding and web push. */

export const loadAzanSettings = (): AzanSettings => {
  try {
    const raw = window.localStorage.getItem(AZAN_STORAGE_KEY);
    return raw ? normalizeAzanSettings(JSON.parse(raw)) : { ...DEFAULT_AZAN_SETTINGS, timeZone: deviceTimeZone() };
  } catch {
    return DEFAULT_AZAN_SETTINGS;
  }
};

export const saveAzanSettings = (s: AzanSettings) => {
  try { window.localStorage.setItem(AZAN_STORAGE_KEY, JSON.stringify(s)); } catch { /* private mode */ }
};

export const hasSavedAzanSettings = (): boolean => {
  try { return Boolean(window.localStorage.getItem(AZAN_STORAGE_KEY)); } catch { return false; }
};

export const deviceTimeZone = (): string => {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"; } catch { return "UTC"; }
};

export interface CityHit { name: string; admin: string | null; country: string; countryCode: string; latitude: number; longitude: number; timeZone: string }

/** Open-Meteo geocoding: free, no key, returns the time zone with each city. */
export const geocodeCity = async (query: string, locale = "en"): Promise<CityHit[]> => {
  const q = query.trim();
  if (q.length < 2) return [];
  const lang = locale.split("-")[0];
  const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=8&language=${encodeURIComponent(lang)}&format=json`);
  if (!res.ok) return [];
  const json = (await res.json()) as { results?: { name: string; admin1?: string; country?: string; country_code?: string; latitude: number; longitude: number; timezone?: string }[] };
  return (json.results ?? []).map((r) => ({ name: r.name, admin: r.admin1 ?? null, country: r.country ?? "", countryCode: (r.country_code ?? "").toUpperCase(), latitude: r.latitude, longitude: r.longitude, timeZone: r.timezone ?? deviceTimeZone() }));
};

/** BigDataCloud reverse geocoding (client endpoint, no key) → city + country for coordinates. */
export const reverseGeocode = async (latitude: number, longitude: number, locale = "en"): Promise<{ city: string; countryCode: string }> => {
  try {
    const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=${encodeURIComponent(locale.split("-")[0])}`);
    const j = (await res.json()) as { city?: string; locality?: string; principalSubdivision?: string; countryCode?: string };
    return { city: j.city || j.locality || j.principalSubdivision || `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`, countryCode: (j.countryCode ?? "").toUpperCase() };
  } catch {
    return { city: `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`, countryCode: "" };
  }
};

export const detectLocation = (locale = "en"): Promise<Pick<AzanSettings, "latitude" | "longitude" | "timeZone" | "city" | "countryCode">> =>
  new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) { reject(new Error("unsupported")); return; }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const place = await reverseGeocode(latitude, longitude, locale);
        resolve({ latitude, longitude, timeZone: deviceTimeZone(), ...place });
      },
      (err) => reject(err),
      { enableHighAccuracy: false, timeout: 15_000, maximumAge: 600_000 },
    );
  });

// ---- web push ----
export const pushSupported = (): boolean => typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

const urlBase64ToUint8Array = (base64: string) => {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
};

export const currentPushSubscription = async (): Promise<PushSubscription | null> => {
  if (!pushSupported()) return null;
  const reg = await navigator.serviceWorker.getRegistration("/");
  return (await reg?.pushManager.getSubscription()) ?? null;
};

export type PushResult = "ok" | "denied" | "unsupported" | "unconfigured" | "failed";

/** Ask permission, register the service worker, subscribe and tell the server where to send azan notifications. */
export const subscribePush = async (settings: AzanSettings, locale: string): Promise<PushResult> => {
  if (!pushSupported()) return "unsupported";
  try {
    const keyRes = await fetch("/api/azan/subscribe");
    const { publicKey, configured } = (await keyRes.json()) as { publicKey: string; configured: boolean };
    if (!configured || !publicKey) return "unconfigured";
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return "denied";
    const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    const subscription = existing ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) }));
    const res = await fetch("/api/azan/subscribe", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ subscription: subscription.toJSON(), settings, locale }) });
    return res.ok ? "ok" : "failed";
  } catch {
    return "failed";
  }
};

/** Push the latest settings to the server if this browser is subscribed. */
export const syncPushSettings = async (settings: AzanSettings, locale: string): Promise<void> => {
  const sub = await currentPushSubscription();
  if (!sub) return;
  await fetch("/api/azan/subscribe", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ subscription: sub.toJSON(), settings, locale }) }).catch(() => undefined);
};

export const unsubscribePush = async (): Promise<void> => {
  const sub = await currentPushSubscription();
  if (!sub) return;
  await fetch("/api/azan/subscribe", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ endpoint: sub.endpoint }) }).catch(() => undefined);
  await sub.unsubscribe().catch(() => undefined);
};

export const sendTestPush = async (): Promise<boolean> => {
  const sub = await currentPushSubscription();
  if (!sub) return false;
  const res = await fetch("/api/azan/test", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ endpoint: sub.endpoint }) });
  return res.ok;
};
