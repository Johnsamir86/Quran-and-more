import { getStore } from "@netlify/blobs";
import type { Config } from "@netlify/functions";

/**
 * Scheduled: every 5 minutes ask the Next.js app to announce prayers that just
 * came in for every push subscriber. The logic lives in /api/azan/tick so it
 * shares the prayer-time engine and the Blobs store with the pages. The shared
 * secret is CRON_SECRET when set, else the one the app generated into Blobs.
 */
export default async () => {
  const base = process.env.URL ?? process.env.APP_BASE_URL ?? "https://quran-and-more.netlify.app";
  let secret = process.env.CRON_SECRET ?? "";
  if (!secret) {
    const cfg = (await getStore({ name: "azan", consistency: "strong" }).get("config:azan", { type: "json" }).catch(() => null)) as { cronSecret?: string } | null;
    secret = cfg?.cronSecret ?? "";
  }
  if (!secret) {
    // First run on a fresh site: the app creates the config on its first request. Warm it up.
    await fetch(`${base}/api/azan/subscribe`).catch(() => undefined);
    return new Response("azan config not ready yet", { status: 202 });
  }
  const res = await fetch(`${base}/api/azan/tick`, { method: "POST", headers: { "x-cron-key": secret } });
  const text = await res.text();
  console.log("azan-tick", res.status, text.slice(0, 300));
  return new Response(text, { status: res.status });
};

export const config: Config = { schedule: "*/5 * * * *" };
