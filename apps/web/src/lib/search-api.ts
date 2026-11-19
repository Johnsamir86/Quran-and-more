import "server-only";

import { stripHtml } from "@qam/core";

import { contentGet, hasQfCredentials, qfGet } from "@/lib/content";
import { listTranslations } from "@/lib/player-api";

/**
 * Quran search.
 *  Primary: Quran Foundation Search API (scope `search`), documented at
 *  https://api-docs.quran.foundation/docs/search_apis_versioned/1.0.0/quran-foundation-search-api/
 *   GET /search/api/v1/search?query=&mode=quick|advanced&page=&size=&translation_ids=&exact_matches_only=
 *   -> result.navigation[] (surah / juz / page / ayah hits) + result.verses[] (keys) + pagination
 *  Fallback: the open v4 `search?q=` endpoint when credentials are missing or the gateway fails.
 * Verse texts and translations are hydrated from the content source so results are verbatim.
 */
export type SearchMode = "quick" | "advanced";

export interface SearchNavItem { type: "surah" | "juz" | "page" | "ayah" | "range" | string; key: string; label: string; href: string }
export interface SearchVerse { verseKey: string; chapter: number; verse: number; text: string; translation: string | null; translationName: string | null; highlight: string | null }
export interface SearchResult {
  query: string; mode: SearchMode; source: "qf" | "legacy";
  navigation: SearchNavItem[]; verses: SearchVerse[];
  pagination: { page: number; size: number; total: number; totalPages: number; nextPage: number | null };
}

interface QfSearchResponse { result?: { navigation?: { key: string; result_type?: string; resultType?: string; name?: string }[]; verses?: { key: string; text?: string; highlighted?: string; translations?: { text?: string; resource_name?: string; resourceName?: string }[] }[] }; pagination?: { total_records?: number; totalRecords?: number; current_page?: number; currentPage?: number; next_page?: number | null; nextPage?: number | null; per_page?: number; perPage?: number; total_pages?: number; totalPages?: number } }

const chapterNames = async (language: string): Promise<Map<number, string>> => {
  const raw = (await contentGet("chapters", { language }, 24 * 3600 * 1000)) as { chapters?: { id: number; nameArabic?: string; nameSimple?: string; translatedName?: { name?: string } }[] };
  return new Map((raw.chapters ?? []).map((c) => [c.id, language === "ar" ? c.nameArabic ?? "" : c.translatedName?.name ?? c.nameSimple ?? ""]));
};

/** Default translation id for a UI language (first catalogue entry; English 131, else 85). */
export const defaultTranslationFor = async (language: string): Promise<number | null> => {
  const all = await listTranslations();
  const langName = new Intl.DisplayNames(["en"], { type: "language" }).of(language.split("-")[0])?.toLowerCase();
  // 131 (The Clear Quran) was withdrawn from the API; 85 (Abdel Haleem) is the English default.
  if (language === "en") return 85;
  const hit = all.find((t) => t.languageName.toLowerCase() === langName && t.apiId !== null);
  return hit?.apiId ?? 85;
};

const hydrate = async (keys: string[], translationId: number | null): Promise<Map<string, { text: string; translation: string | null; translationName: string | null }>> => {
  const out = new Map<string, { text: string; translation: string | null; translationName: string | null }>();
  await Promise.all(keys.map(async (k) => {
    try {
      const raw = (await contentGet(`verses/by_key/${encodeURIComponent(k)}`, { words: false, fields: "text_uthmani", translations: translationId ?? undefined, translation_fields: "resource_name" }, 24 * 3600 * 1000)) as { verse?: { textUthmani?: string; translations?: { text?: string; resourceName?: string }[] } };
      const v = raw.verse;
      const tr = v?.translations?.[0];
      out.set(k, { text: (v?.textUthmani ?? "").trim(), translation: tr?.text ? stripHtml(tr.text) : null, translationName: tr?.resourceName ?? null });
    } catch { /* leave missing */ }
  }));
  return out;
};

const navHref = (type: string, key: string): string => {
  if (type === "surah") return `/player?surah=${key}`;
  if (type === "ayah") return `/study/${key}`;
  if (type === "page") return `/mushaf?page=${key}`;
  if (type === "juz") return `/mushaf?juz=${key}`;
  return `/search?q=${encodeURIComponent(key)}`;
};

export const searchQuran = async (opts: { q: string; mode?: SearchMode; page?: number; size?: number; language?: string; translationIds?: number[]; exact?: boolean }): Promise<SearchResult> => {
  const q = opts.q.trim();
  const mode = opts.mode ?? "quick";
  const page = Math.max(1, opts.page ?? 1);
  const size = Math.min(50, Math.max(1, opts.size ?? (mode === "quick" ? 10 : 20)));
  const language = opts.language ?? "en";
  const translationId = opts.translationIds?.[0] ?? (await defaultTranslationFor(language));
  const names = await chapterNames(language);
  const empty: SearchResult = { query: q, mode, source: "qf", navigation: [], verses: [], pagination: { page, size, total: 0, totalPages: 0, nextPage: null } };
  if (!q) return empty;

  // Direct ayah keys like "2:255" or "2 255" resolve immediately.
  const keyMatch = /^\s*(\d{1,3})\s*[:\s]\s*(\d{1,3})\s*$/.exec(q);
  if (keyMatch) {
    const key = `${keyMatch[1]}:${keyMatch[2]}`;
    const h = await hydrate([key], translationId);
    const v = h.get(key);
    return { ...empty, navigation: [{ type: "ayah", key, label: `${names.get(Number(keyMatch[1])) ?? keyMatch[1]} ${keyMatch[2]}`, href: `/study/${key}` }], verses: v ? [{ verseKey: key, chapter: Number(keyMatch[1]), verse: Number(keyMatch[2]), text: v.text, translation: v.translation, translationName: v.translationName, highlight: null }] : [], pagination: { page: 1, size, total: v ? 1 : 0, totalPages: 1, nextPage: null } };
  }

  let source: "qf" | "legacy" = "qf";
  let keys: string[] = [];
  let navigation: SearchNavItem[] = [];
  let pagination = empty.pagination;
  const legacyText = new Map<string, { text: string; highlight: string | null; translation: string | null; translationName: string | null }>();

  if (hasQfCredentials()) {
    try {
      const raw = await qfGet<QfSearchResponse>("search/api/v1", "search", { query: q, mode, page, size, translation_ids: translationId ?? undefined, exact_matches_only: opts.exact ? 1 : undefined }, 5 * 60 * 1000);
      const r = raw.result ?? {};
      keys = (r.verses ?? []).map((v) => v.key);
      for (const v of r.verses ?? []) if (v.text) legacyText.set(v.key, { text: v.text, highlight: v.highlighted ?? null, translation: v.translations?.[0]?.text ? stripHtml(v.translations[0].text) : null, translationName: v.translations?.[0]?.resource_name ?? v.translations?.[0]?.resourceName ?? null });
      navigation = (r.navigation ?? []).map((n) => {
        const type = (n.result_type ?? n.resultType ?? "surah").toLowerCase();
        const label = type === "surah" ? names.get(Number(n.key)) ?? n.name ?? n.key : type === "ayah" ? `${names.get(Number(n.key.split(":")[0])) ?? ""} ${n.key.split(":")[1] ?? ""}`.trim() : `${type} ${n.key}`;
        return { type, key: n.key, label, href: navHref(type, n.key) };
      });
      const p = raw.pagination ?? {};
      const total = p.total_records ?? p.totalRecords ?? keys.length;
      pagination = { page: p.current_page ?? p.currentPage ?? page, size: p.per_page ?? p.perPage ?? size, total, totalPages: p.total_pages ?? p.totalPages ?? (total ? Math.ceil(total / size) : 0), nextPage: p.next_page ?? p.nextPage ?? null };
    } catch { source = "legacy"; }
  } else source = "legacy";

  if (source === "legacy") {
    const raw = (await contentGet("search", { q, size, page, language }, 5 * 60 * 1000)) as { search?: { totalResults?: number; totalPages?: number; currentPage?: number; results?: { verseKey: string; text?: string; highlighted?: string | null; translations?: { text?: string; name?: string }[] }[] } };
    const s = raw.search ?? {};
    keys = (s.results ?? []).map((r) => r.verseKey);
    for (const r of s.results ?? []) legacyText.set(r.verseKey, { text: r.text ?? "", highlight: r.highlighted ?? null, translation: r.translations?.[0]?.text ? stripHtml(r.translations[0].text) : null, translationName: r.translations?.[0]?.name ?? null });
    const total = s.totalResults ?? keys.length;
    pagination = { page: s.currentPage ?? page, size, total, totalPages: s.totalPages ?? (total ? Math.ceil(total / size) : 0), nextPage: (s.currentPage ?? page) < (s.totalPages ?? 0) ? (s.currentPage ?? page) + 1 : null };
    // Surah-name navigation for the legacy path
    const ql = q.toLowerCase();
    navigation = [...names.entries()].filter(([, n]) => n.toLowerCase().includes(ql)).slice(0, 5).map(([id, n]) => ({ type: "surah", key: String(id), label: n, href: `/player?surah=${id}` }));
  }

  const need = keys.filter((k) => !legacyText.get(k)?.text || (translationId && !legacyText.get(k)?.translation));
  const hydrated = need.length ? await hydrate(need, translacionSafe(translationId)) : new Map();
  const verses: SearchVerse[] = keys.map((k) => {
    const [c, v] = k.split(":").map(Number);
    const l = legacyText.get(k); const h = hydrated.get(k);
    return { verseKey: k, chapter: c, verse: v, text: h?.text || l?.text || "", translation: h?.translation ?? l?.translation ?? null, translationName: h?.translationName ?? l?.translationName ?? null, highlight: l?.highlight ?? null };
  }).filter((v) => v.text);
  return { query: q, mode, source, navigation, verses, pagination };
};

const translacionSafe = (id: number | null) => (id && id > 0 ? id : null);
