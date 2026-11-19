import type { NextRequest } from "next/server";

import { buildRound, hashString, seededRandom, type GameAyah, type GameKind, type GameSurah } from "@qam/core";

import { listPlayerSurahs } from "@/lib/player-api";
import { parseLanguage, publicError, publicJson } from "@/lib/public-api";
import { defaultTranslationFor } from "@/lib/search-api";
import { CHAPTER_VERSE_COUNTS, loadVersesByKeys, randomVerseKeys } from "@/lib/study-api";

export const dynamic = "force-dynamic";

const KINDS: GameKind[] = ["guess-surah", "next-ayah", "missing-word", "which-juz"];

/** GET /api/public/v1/games/round?type=guess-surah&count=8&scope=juz30|surah:2|all&language=ar&seed=x */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const kind = (sp.get("type") ?? "guess-surah") as GameKind;
  if (!KINDS.includes(kind)) return publicError(`type must be one of ${KINDS.join(", ")}`);
  const count = Math.min(15, Math.max(3, Number.parseInt(sp.get("count") ?? "8", 10) || 8));
  const language = parseLanguage(sp.get("language"));
  const seed = sp.get("seed") ?? `${kind}-${Date.now()}`;
  const scope = sp.get("scope") ?? "all";
  let within: number[] | undefined;
  if (scope === "juz30") within = Array.from({ length: 37 }, (_, i) => 78 + i);
  else if (scope.startsWith("surah:")) { const s = Number(scope.slice(6)); if (s >= 1 && s <= 114) within = [s]; }
  else if (scope === "short") within = Array.from({ length: 114 }, (_, i) => i + 1).filter((c) => CHAPTER_VERSE_COUNTS[c - 1] <= 30);
  try {
    const rnd = seededRandom(hashString(seed));
    const [surahsRaw, translationId] = await Promise.all([listPlayerSurahs(language), defaultTranslationFor(language)]);
    const surahs: GameSurah[] = surahsRaw.map((s) => ({ number: s.number, arabicName: s.arabicName, latinName: s.latinName, verseCount: s.verseCount }));
    const keys = randomVerseKeys(count * 2, rnd, within);
    const nextKeys = kind === "next-ayah" ? keys.map((k) => { const [c, n] = k.split(":").map(Number); return n < CHAPTER_VERSE_COUNTS[c - 1] ? `${c}:${n + 1}` : null; }) : [];
    const rows = await loadVersesByKeys([...keys, ...nextKeys.filter((k): k is string => !!k)], kind === "next-ayah" ? null : translationId);
    const byKey = new Map(rows.map((r) => [r.verseKey, r]));
    const ayahs: GameAyah[] = keys.map((k, i) => { const r = byKey.get(k); const nk = nextKeys[i]; const nr = nk ? byKey.get(nk) : undefined; return r ? { verseKey: k, text: r.text, words: r.words, juz: r.juz, next: nr ? { verseKey: nk!, text: nr.text } : null } : null; }).filter((a): a is GameAyah => !!a);
    const round = buildRound(kind, surahs, ayahs, { seed, count, arabicNames: language === "ar" });
    return publicJson({ round, seed }, { maxAgeSeconds: 0 });
  } catch (error) {
    return publicError(error instanceof Error ? error.message : "Failed to build round", 502);
  }
}
