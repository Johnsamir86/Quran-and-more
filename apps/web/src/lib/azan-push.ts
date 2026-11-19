import crypto from "node:crypto";

import { getStore } from "@netlify/blobs";
import webpush, { type PushSubscription } from "web-push";

import { AZAN_PRAYERS, asrForCountry, civilDateIn, computePrayerTimes, formatPrayerTime, getMessages, methodForCountry, muezzinById, normalizeAzanSettings, resolveCalc, type AzanSettings } from "@qam/core";

/**
 * Web push for azan times. Subscriptions live in Netlify Blobs (store "azan");
 * a scheduled Netlify function calls /api/azan/tick every 5 minutes, which
 * computes each subscriber's prayer times on the server (same engine as the
 * page) and pushes a notification for any prayer that just came in.
 */
export interface AzanSubscription {
  id: string;
  subscription: PushSubscription;
  settings: AzanSettings;
  locale: string;
  createdAt: number;
  updatedAt: number;
  /** ISO day → prayers already announced, so a tick never sends twice. */
  sent: Record<string, string[]>;
}

const memory = new Map<string, AzanSubscription>();

const store = () => {
  try {
    return getStore({ name: "azan", consistency: "strong" });
  } catch {
    return null;
  }
};

export const subscriptionId = (endpoint: string) => crypto.createHash("sha256").update(endpoint).digest("hex").slice(0, 32);

export interface AzanConfig { vapidPublicKey: string; vapidPrivateKey: string; cronSecret: string }

let configCache: AzanConfig | null = null;

/**
 * VAPID key pair + cron secret. Environment variables win when set; otherwise the
 * pair is generated once and kept in the private Blobs store, so a fresh site
 * works without anyone handling private keys.
 */
export const getAzanConfig = async (): Promise<AzanConfig> => {
  if (configCache) return configCache;
  const fromEnv = { vapidPublicKey: process.env.VAPID_PUBLIC_KEY ?? "", vapidPrivateKey: process.env.VAPID_PRIVATE_KEY ?? "", cronSecret: process.env.CRON_SECRET ?? "" };
  if (fromEnv.vapidPublicKey && fromEnv.vapidPrivateKey && fromEnv.cronSecret) return (configCache = fromEnv);
  const s = store();
  const stored = s ? ((await s.get("config:azan", { type: "json" }).catch(() => null)) as Partial<AzanConfig> | null) : null;
  const keys = stored?.vapidPublicKey && stored.vapidPrivateKey ? stored : null;
  const pair = keys ?? (() => { const k = webpush.generateVAPIDKeys(); return { vapidPublicKey: k.publicKey, vapidPrivateKey: k.privateKey }; })();
  const config: AzanConfig = {
    vapidPublicKey: fromEnv.vapidPublicKey || pair.vapidPublicKey!,
    vapidPrivateKey: fromEnv.vapidPrivateKey || pair.vapidPrivateKey!,
    cronSecret: fromEnv.cronSecret || stored?.cronSecret || crypto.randomBytes(24).toString("hex"),
  };
  if (s && JSON.stringify(stored) !== JSON.stringify(config)) await s.setJSON("config:azan", config).catch(() => undefined);
  return (configCache = config);
};

export const vapid = async () => {
  const c = await getAzanConfig();
  const subject = process.env.VAPID_SUBJECT ?? process.env.URL ?? process.env.APP_BASE_URL ?? "https://quran-and-more.netlify.app";
  return { publicKey: c.vapidPublicKey, privateKey: c.vapidPrivateKey, subject, configured: Boolean(c.vapidPublicKey && c.vapidPrivateKey) };
};

export const saveSubscription = async (sub: AzanSubscription) => {
  const s = store();
  if (s) await s.setJSON(sub.id, sub);
  else memory.set(sub.id, sub);
};

export const getSubscription = async (id: string): Promise<AzanSubscription | null> => {
  const s = store();
  if (!s) return memory.get(id) ?? null;
  return ((await s.get(id, { type: "json" })) as AzanSubscription | null) ?? null;
};

export const deleteSubscription = async (id: string) => {
  const s = store();
  if (s) await s.delete(id);
  else memory.delete(id);
};

export const listSubscriptions = async (): Promise<AzanSubscription[]> => {
  const s = store();
  if (!s) return [...memory.values()];
  const { blobs } = await s.list();
  const out: AzanSubscription[] = [];
  for (const b of blobs) {
    if (b.key.startsWith("config:")) continue;
    const v = (await s.get(b.key, { type: "json" })) as AzanSubscription | null;
    if (v?.subscription?.endpoint) out.push(v);
  }
  return out;
};

export const upsertFromRequest = async (body: { subscription?: PushSubscription; settings?: unknown; locale?: string }): Promise<AzanSubscription> => {
  const subscription = body.subscription;
  if (!subscription?.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) throw new Error("invalid subscription");
  if (!/^https:\/\//.test(subscription.endpoint) || subscription.endpoint.length > 2048) throw new Error("invalid endpoint");
  const id = subscriptionId(subscription.endpoint);
  const existing = await getSubscription(id);
  const now = Date.now();
  const sub: AzanSubscription = {
    id,
    subscription: { endpoint: subscription.endpoint, keys: { p256dh: subscription.keys.p256dh, auth: subscription.keys.auth } },
    settings: { ...normalizeAzanSettings(body.settings), notifications: true },
    locale: typeof body.locale === "string" ? body.locale.slice(0, 10) : "en",
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    sent: existing?.sent ?? {},
  };
  await saveSubscription(sub);
  return sub;
};

export interface AzanPayload { title: string; body: string; prayer: string; url: string; tag: string; audio: string; icon: string }

export const buildPayload = (sub: AzanSubscription, prayer: (typeof AZAN_PRAYERS)[number], at: Date, test = false): AzanPayload => {
  const m = getMessages(sub.locale);
  const name = m.azan.prayers[prayer];
  const time = formatPrayerTime(at, sub.settings.timeZone, sub.locale);
  return {
    title: test ? `${m.azan.testNotification} · ${name}` : `${name} · ${sub.settings.city}`,
    body: `${time} · ${m.story.title}`,
    prayer,
    url: `/story?prayer=${prayer}&azan=1`,
    tag: `azan-${prayer}`,
    audio: muezzinById(sub.settings.muezzin).url,
    icon: "/icon-192.png",
  };
};

export const sendPush = async (sub: AzanSubscription, payload: AzanPayload): Promise<"sent" | "gone" | "failed"> => {
  const v = await vapid();
  if (!v.configured) return "failed";
  webpush.setVapidDetails(v.subject, v.publicKey, v.privateKey);
  try {
    await webpush.sendNotification(sub.subscription, JSON.stringify(payload), { TTL: 900, urgency: "high" });
    return "sent";
  } catch (error) {
    const status = (error as { statusCode?: number }).statusCode;
    if (status === 404 || status === 410) {
      await deleteSubscription(sub.id);
      return "gone";
    }
    return "failed";
  }
};

/** Announce every prayer whose time fell inside the last `windowMinutes` and was not announced yet. */
export const tick = async (now = new Date(), windowMinutes = 12) => {
  const subs = await listSubscriptions();
  const summary = { subscribers: subs.length, sent: 0, gone: 0, failed: 0 };
  for (const sub of subs) {
    const s = sub.settings;
    const calc = resolveCalc(s, methodForCountry, asrForCountry);
    const civil = civilDateIn(now, s.timeZone);
    const dayKey = `${civil.year}-${String(civil.month).padStart(2, "0")}-${String(civil.day).padStart(2, "0")}`;
    const times = computePrayerTimes(civil.year, civil.month, civil.day, calc);
    let changed = false;
    for (const prayer of AZAN_PRAYERS) {
      if (!s.prayers[prayer]) continue;
      const at = times[prayer].getTime();
      const age = now.getTime() - at;
      if (age < 0 || age > windowMinutes * 60_000) continue;
      const done = sub.sent[dayKey] ?? [];
      if (done.includes(prayer)) continue;
      const result = await sendPush(sub, buildPayload(sub, prayer, times[prayer]));
      summary[result] += 1;
      if (result === "gone") { changed = false; break; }
      sub.sent[dayKey] = [...done, prayer];
      changed = true;
    }
    if (changed) {
      for (const k of Object.keys(sub.sent)) if (k < dayKey && Date.parse(k) < now.getTime() - 3 * 86_400_000) delete sub.sent[k];
      await saveSubscription(sub);
    }
  }
  return summary;
};

export const cronAuthorized = async (request: Request): Promise<boolean> => {
  const secret = (await getAzanConfig()).cronSecret;
  if (!secret) return false;
  const given = request.headers.get("x-cron-key") ?? new URL(request.url).searchParams.get("key") ?? "";
  return given.length === secret.length && crypto.timingSafeEqual(Buffer.from(given), Buffer.from(secret));
};
