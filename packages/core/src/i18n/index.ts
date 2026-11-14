import { en, type Messages, type PartialMessages } from "./en";
import { ar } from "./ar";
import { EXTRA_DICTIONARIES } from "./registry";

/** Languages that have a UI dictionary; everything else falls back to English UI text. */
const DICTIONARIES: Record<string, PartialMessages> = { ar, ...EXTRA_DICTIONARIES };

const isPlainObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);

const merge = <T>(base: T, over: unknown): T => {
  if (!isPlainObject(base) || !isPlainObject(over)) return (over === undefined ? base : (over as T));
  const out: Record<string, unknown> = { ...base };
  for (const [k, v] of Object.entries(over)) {
    if (v === undefined) continue;
    const b = (base as Record<string, unknown>)[k];
    out[k] = isPlainObject(b) ? merge(b, v) : v;
  }
  return out as T;
};

const cache = new Map<string, Messages>();

/** Full message tree for a locale (English filled in for anything the language lacks). */
export const getMessages = (locale: string | null | undefined): Messages => {
  const code = (locale ?? "en").toLowerCase();
  const base = code.split(/[-_]/)[0];
  const key = DICTIONARIES[code] ? code : DICTIONARIES[base] ? base : "en";
  let m = cache.get(key);
  if (!m) { m = key === "en" ? en : merge(en, DICTIONARIES[key]); cache.set(key, m); }
  return m;
};

export const hasUiDictionary = (locale: string): boolean => locale === "en" || !!DICTIONARIES[locale];
export const UI_DICTIONARY_LOCALES: readonly string[] = ["en", ...Object.keys(DICTIONARIES)];

/** Digits in the locale's preferred numbering (Arabic-Indic for Arabic, Persian/Urdu variants). */
export const formatNumber = (n: number, locale: string): string => {
  if (locale === "ar") return n.toLocaleString("ar-EG", { useGrouping: false });
  if (locale === "fa" || locale === "prs") return n.toLocaleString("fa-IR", { useGrouping: false });
  if (locale === "ur") return n.toLocaleString("ur-PK", { useGrouping: false });
  if (locale === "bn") return n.toLocaleString("bn-BD", { useGrouping: false });
  return String(n);
};

export type { Messages, PartialMessages };
export { en };
