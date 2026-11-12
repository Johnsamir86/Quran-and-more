import "server-only";

import { contentGet } from "@/lib/content";
import { getTafsirForAyah } from "@/lib/player-api";
import { searchQuran } from "@/lib/search-api";

/**
 * "Ask the Quran" in restricted mode (Quran.ai / Tazkiya style):
 *  1. retrieve relevant ayat with the Search API and their tafsir excerpts,
 *  2. answer ONLY from those sources, quoting ayat verbatim with keys,
 *  3. label every answer "pending scholarly review" and attach the citations.
 * The language model is optional: without ANTHROPIC_API_KEY the answer is the
 * retrieved sources themselves. With it, the model's output is checked so that
 * every Arabic quotation is a verbatim substring of a retrieved ayah; anything
 * else is dropped before the answer is returned.
 */
export interface AskSource { verseKey: string; text: string; translation: string | null; tafsir: { name: string; text: string } | null }
export interface AskResult {
  question: string; language: string; mode: "retrieval" | "model";
  answer: string | null; sources: AskSource[]; disclaimer: string; model: string | null;
}

const DISCLAIMER: Record<string, string> = {
  ar: "هذه إجابة آلية مبنية على الآيات والتفاسير المذكورة فقط، وهي بانتظار مراجعة علمية. راجع المصادر قبل الاعتماد عليها.",
  en: "This is an automated answer built only from the ayat and tafsir listed below. It is pending scholarly review; check the sources before relying on it.",
};

const TAFSIR_FOR: Record<string, string> = { ar: "16", en: "169", ur: "160", bn: "381", ru: "170", ku: "804" };

const arabicRuns = (s: string): string[] => (s.match(/[؀-ۿ][؀-ۿ\s]{12,}/g) ?? []).map((r) => r.trim());
const norm = (s: string) => s.replace(/[ؐ-ًؚ-ٰٟۖ-ۭـ]/g, "").replace(/\s+/g, " ").trim();

export const askQuran = async (question: string, language: string): Promise<AskResult> => {
  const lang = language in DISCLAIMER ? language : "en";
  const search = await searchQuran({ q: question, mode: "advanced", size: 6, language });
  const tafsirId = TAFSIR_FOR[language] ?? "169";
  const sources: AskSource[] = await Promise.all(search.verses.slice(0, 5).map(async (v) => {
    const t = await getTafsirForAyah(tafsirId, v.verseKey).catch(() => null);
    return { verseKey: v.verseKey, text: v.text, translation: v.translation, tafsir: t ? { name: t.name, text: t.text.slice(0, 1200) } : null };
  }));
  // Surah hits from navigation: include the first ayah so the model has something verbatim to quote.
  if (!sources.length) {
    for (const nav of search.navigation.filter((n) => n.type === "surah").slice(0, 2)) {
      const raw = (await contentGet(`verses/by_key/${nav.key}:1`, { words: false, fields: "text_uthmani" }, 24 * 3600 * 1000).catch(() => null)) as { verse?: { textUthmani?: string } } | null;
      if (raw?.verse?.textUthmani) sources.push({ verseKey: `${nav.key}:1`, text: raw.verse.textUthmani.trim(), translation: null, tafsir: null });
    }
  }
  const base: AskResult = { question, language: lang, mode: "retrieval", answer: null, sources, disclaimer: DISCLAIMER[lang], model: null };
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || !sources.length) return base;

  const model = process.env.ASK_MODEL ?? "claude-sonnet-5-5";
  const system = [
    "You answer questions about the Quran for a family app in RESTRICTED MODE.",
    "Use ONLY the sources provided. Quote ayat verbatim in Arabic exactly as given, each followed by its key in parentheses, e.g. (2:255).",
    "Never paraphrase, translate on your own, or alter a single letter or harakah of an ayah. Translations may be quoted only verbatim from the provided translation text.",
    "When tafsir is quoted, name the tafsir. Keep the commentator's words separate from your own summary.",
    "If the sources do not answer the question, say so plainly and suggest asking a scholar. Do not issue fatwas.",
    `Answer in the language with code "${lang}". Be concise (under 250 words).`,
  ].join("\n");
  const sourceText = sources.map((s, i) => `[${i + 1}] (${s.verseKey})\nArabic: ${s.text}\n${s.translation ? `Translation: ${s.translation}\n` : ""}${s.tafsir ? `Tafsir ${s.tafsir.name}: ${s.tafsir.text}\n` : ""}`).join("\n");
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model, max_tokens: 700, system, messages: [{ role: "user", content: `Question: ${question}\n\nSources:\n${sourceText}` }] }),
    });
    if (!res.ok) return base;
    const json = (await res.json()) as { content?: { type: string; text?: string }[] };
    let answer = (json.content ?? []).filter((c) => c.type === "text").map((c) => c.text ?? "").join("\n").trim();
    // Verbatim guard: every long Arabic run must be a substring of a provided ayah or tafsir; otherwise remove it.
    const allowed = sources.flatMap((s) => [s.text, s.tafsir?.text ?? ""]).map(norm).join("\n");
    for (const run of arabicRuns(answer)) if (!allowed.includes(norm(run))) answer = answer.replace(run, "[…]");
    return { ...base, mode: "model", answer: answer || null, model };
  } catch { return base; }
};
