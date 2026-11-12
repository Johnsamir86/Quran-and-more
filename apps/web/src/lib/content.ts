import "server-only";

import { CONTENT_SCOPES, resolveQfEnvironment } from "@qam/core";

/**
 * Content source for Quran data (text, audio, translations, tafsirs, mushaf layouts).
 *
 *  - "qf"  : Quran Foundation gateway (`/content/api/v4`) with client-credentials
 *            auth. The prelive sandbox only carries Surah 1-2; production needs
 *            production credentials.
 *  - "qdc" : the open Quran.com v4 API (`api.quran.com/api/v4`), the same data the
 *            quran.com site and apps read: the whole mushaf, every reciter,
 *            translation and tafsir. Default until production QF credentials exist.
 *
 * Both return the same v4 JSON shapes; we camel-case keys so the rest of the
 * server code is source agnostic.
 */
export type ContentSource = "qf" | "qdc";

export const contentSource = (): ContentSource => (process.env.CONTENT_SOURCE === "qf" ? "qf" : "qdc");

const QDC_BASE = process.env.QDC_BASE_URL ?? "https://api.quran.com/api/v4";

const camel = (k: string) => k.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());
export const deepCamel = (v: unknown): unknown => {
  if (Array.isArray(v)) return v.map(deepCamel);
  if (v && typeof v === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(v as Record<string, unknown>)) out[camel(k)] = deepCamel(x);
    return out;
  }
  return v;
};

/* ---------- Quran Foundation client-credentials token (qf source) ---------- */
let tokenCache: { token: string; expiresAt: number } | null = null;
const getQfToken = async (): Promise<{ token: string; clientId: string }> => {
  const clientId = process.env.CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("CLIENT_ID and CLIENT_SECRET are required for the qf content source");
  if (tokenCache && tokenCache.expiresAt > Date.now() + 30_000) return { token: tokenCache.token, clientId };
  const { oauth2BaseUrl } = resolveQfEnvironment(process.env);
  const scope = (process.env.CONTENT_SCOPES ?? CONTENT_SCOPES.join(" ")).trim();
  const res = await fetch(`${oauth2BaseUrl}/oauth2/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}` },
    body: new URLSearchParams({ grant_type: "client_credentials", scope }).toString(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Token request failed (${res.status})`);
  const json = (await res.json()) as { access_token: string; expires_in?: number };
  tokenCache = { token: json.access_token, expiresAt: Date.now() + (json.expires_in ?? 3600) * 1000 };
  return { token: json.access_token, clientId };
};

/* ---------- GET with query, retry and a small in-memory TTL cache ---------- */
export type Query = Record<string, string | number | boolean | (string | number)[] | undefined | null>;

const memo = new Map<string, { at: number; value: Promise<unknown> }>();

export class ContentError extends Error {
  status: number;
  constructor(message: string, status: number) { super(message); this.status = status; }
}

const buildUrl = (base: string, path: string, query?: Query): string => {
  const url = new URL(`${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`);
  for (const [k, v] of Object.entries(query ?? {})) {
    if (v === undefined || v === null || v === "") continue;
    url.searchParams.set(k, Array.isArray(v) ? v.join(",") : String(v));
  }
  return url.toString();
};

const fetchJson = async (url: string, headers: Record<string, string>, attempt = 0): Promise<unknown> => {
  const res = await fetch(url, { headers: { accept: "application/json", ...headers }, cache: "no-store" });
  if (res.status === 429 || res.status >= 500) {
    if (attempt < 2) { await new Promise((r) => setTimeout(r, 400 * (attempt + 1))); return fetchJson(url, headers, attempt + 1); }
  }
  if (!res.ok) throw new ContentError(`Content request failed (${res.status}) for ${new URL(url).pathname}`, res.status);
  return deepCamel(await res.json());
};

/**
 * GET a v4 content path such as `chapters`, `verses/by_chapter/2`,
 * `resources/translations`. `ttlMs` memoises identical requests in-process.
 */
export const contentGet = async <T = unknown>(path: string, query?: Query, ttlMs = 10 * 60 * 1000): Promise<T> => {
  const source = contentSource();
  let url: string;
  let headers: Record<string, string> = {};
  if (source === "qf") {
    const { gatewayUrl } = resolveQfEnvironment(process.env);
    const { token, clientId } = await getQfToken();
    url = buildUrl(`${gatewayUrl}/content/api/v4`, path, query);
    headers = { "x-auth-token": token, "x-client-id": clientId };
  } else {
    url = buildUrl(QDC_BASE, path, query);
  }
  const key = `${source}|${url}`;
  const hit = memo.get(key);
  if (hit && Date.now() - hit.at < ttlMs) return hit.value as Promise<T>;
  const value = fetchJson(url, headers).catch((e) => { memo.delete(key); throw e; });
  memo.set(key, { at: Date.now(), value });
  if (memo.size > 2000) { const oldest = memo.keys().next().value; if (oldest) memo.delete(oldest); }
  return value as Promise<T>;
};

/** Paginate a list endpoint until `pagination.nextPage` is null. */
export const contentGetAll = async <T>(path: string, listKey: string, query: Query = {}, perPage = 50, ttlMs?: number): Promise<T[]> => {
  const out: T[] = [];
  let page = 1;
  for (;;) {
    const raw = await contentGet<Record<string, unknown>>(path, { ...query, page, per_page: perPage }, ttlMs);
    const items = (raw[listKey] as T[] | undefined) ?? [];
    out.push(...items);
    const next = (raw.pagination as { nextPage?: number | null } | undefined)?.nextPage;
    if (!next || !items.length || page > 50) break;
    page = next;
  }
  return out;
};
