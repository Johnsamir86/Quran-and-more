import "server-only";

import {
  absoluteAudioUrl,
  buildSegments,
  normaliseAyahWordTimings,
  normaliseTimestamps,
  reciterGender,
  splitUthmaniWords,
  stripHtml,
  type ChapterAudioInfo,
  type ChapterTimestamp,
  type PlayerAyah,
  type PlayerReciter,
  type PlayerSegment,
  type PlayerSurah,
  type PlayerTranslation,
  type PlayerWord,
} from "@qam/core";

import { getContentClient } from "@/lib/public-api";

/* Loose shapes of the SDK responses we read. */
interface ChapterLike { id: number; nameArabic?: string; nameSimple?: string; versesCount?: number; bismillahPre?: boolean; revelationPlace?: string; translatedName?: { name?: string } | string }
interface WordLike { position: number; textUthmani?: string; text?: string; charTypeName?: string; translation?: { text?: string }; transliteration?: { text?: string }; audioUrl?: string }
interface VerseLike { verseNumber: number; verseKey: string; textUthmani?: string; words?: WordLike[]; translations?: { resourceId: number; text: string }[]; audio?: { url?: string; segments?: unknown[]; duration?: number } }
interface RecitationLike { id: number; reciterName?: string; style?: string | null; translatedName?: { name?: string; languageName?: string } }
interface ChapterReciterLike { id: number; reciterId?: number; name?: string; beta?: boolean; style?: { name?: string } | null; qirat?: { name?: string } | null; translatedName?: { name?: string; languageName?: string } }
interface TranslationResourceLike { id: number; name?: string; authorName?: string; languageName?: string; slug?: string; translatedName?: { name?: string } }
interface TafsirResourceLike { id: number; name?: string; authorName?: string; languageName?: string; slug?: string; translatedName?: { name?: string } }

const unwrap = <T>(raw: unknown, key: string): T[] =>
  (Array.isArray(raw) ? raw : ((raw as Record<string, T[]>)?.[key] ?? [])) as T[];

export const toPlayerSurah = (c: ChapterLike): PlayerSurah => ({
  number: c.id,
  arabicName: c.nameArabic ?? "",
  latinName: c.nameSimple ?? "",
  verseCount: c.versesCount ?? 0,
  hasBismillah: c.bismillahPre ?? (c.id !== 1 && c.id !== 9),
});

const toWords = (words: WordLike[] | undefined): PlayerWord[] =>
  (words ?? [])
    .filter((w) => (w.charTypeName ?? "word") === "word")
    .map((w) => ({
      position: w.position,
      text: w.textUthmani ?? w.text ?? "",
      translation: w.translation?.text ?? null,
      transliteration: w.transliteration?.text ?? null,
      audioUrl: w.audioUrl ? absoluteAudioUrl(w.audioUrl, "word") : null,
    }));

const toAyah = (v: VerseLike, translationId: number | null): PlayerAyah => {
  const translation = translationId ? v.translations?.find((t) => t.resourceId === translationId)?.text ?? v.translations?.[0]?.text : null;
  return {
    number: v.verseNumber,
    key: v.verseKey,
    arabic: (v.textUthmani ?? "").trim(),
    translation: translation ? stripHtml(translation) || null : null,
    words: v.words?.length ? toWords(v.words) : splitUthmaniWords(v.textUthmani ?? ""),
    audioUrl: v.audio?.url ? absoluteAudioUrl(v.audio.url, "verse") : null,
    durationMs: Math.round((v.audio?.duration ?? 0) * 1000),
    ayahWordTimings: normaliseAyahWordTimings(v.audio?.segments),
  };
};

export const listPlayerSurahs = async (language: string): Promise<PlayerSurah[]> => {
  const client = await getContentClient();
  const raw = (await client.content.v4.chapters.list({ language } as never)) as unknown;
  return unwrap<ChapterLike>(raw, "chapters").map(toPlayerSurah);
};

/** Loose name key so "Khaleel" and "Khalil" or "Mahmoud" and "Mahmud" match across the two catalogues. */
const normaliseName = (s: string) =>
  s.toLowerCase()
    .replace(/streaming|\(.*?\)/g, "")
    .replace(/[^a-z\u0600-\u06ff ]/g, "")
    .replace(/ee/g, "i").replace(/aa/g, "a").replace(/oo|ou/g, "u").replace(/ah\b/g, "a").replace(/h\b/g, "")
    .replace(/\s+/g, " ").trim();
const styleOf = (s: string | null | undefined) => (s ?? "murattal").toLowerCase();

/**
 * Merged reciter catalogue: full-surah (gapless) reciters from
 * `resources/chapter_reciters` plus ayah-by-ayah reciters from
 * `resources/recitations`, matched by reciter id or name so one row can
 * drive both engines. Every reciter the Quran Foundation offers appears.
 */
export const listReciters = async (): Promise<PlayerReciter[]> => {
  const client = await getContentClient();
  const [chapterRaw, ayahRaw, arabicRaw] = await Promise.all([
    client.content.v4.resources.chapterReciters.list({ language: "en" } as never) as Promise<unknown>,
    client.content.v4.resources.recitations.list({ language: "en" } as never) as Promise<unknown>,
    client.content.v4.resources.chapterReciters.list({ language: "ar" } as never).catch(() => null) as Promise<unknown>,
  ]);
  const chapter = unwrap<ChapterReciterLike>(chapterRaw, "reciters");
  const ayah = unwrap<RecitationLike>(ayahRaw, "recitations");
  const arabicNames = new Map(unwrap<ChapterReciterLike>(arabicRaw, "reciters").map((r) => [r.id, r.translatedName?.name]));

  const result: PlayerReciter[] = [];
  const usedAyah = new Set<number>();

  for (const r of chapter) {
    const latin = (r.name ?? "").replace(/\s*Streaming$/i, "").trim();
    const key = normaliseName(latin);
    const match = ayah.find((a) => !usedAyah.has(a.id) && normaliseName(a.reciterName ?? "") === key && styleOf(a.style) === styleOf(r.style?.name))
      ?? (styleOf(r.style?.name) === "murattal" ? ayah.find((a) => !usedAyah.has(a.id) && normaliseName(a.reciterName ?? "") === key) : undefined);
    if (match) usedAyah.add(match.id);
    const arabic = arabicNames.get(r.id);
    result.push({
      id: `c${r.id}`,
      chapterReciterId: r.id,
      recitationId: match?.id ?? null,
      arabicName: arabic && /[؀-ۿ]/.test(arabic) ? arabic : latin,
      latinName: latin + (/Streaming$/i.test(r.name ?? "") ? " (streaming)" : ""),
      riwayah: r.qirat?.name ? `${r.qirat.name}` : "Hafs",
      style: r.style?.name?.toLowerCase() ?? null,
      imageUrl: null,
      gender: reciterGender(r.id) === "female" ? "female" : "male",
    });
  }
  for (const a of ayah) {
    if (usedAyah.has(a.id)) continue;
    const latin = a.reciterName ?? String(a.id);
    const arabic = a.translatedName?.languageName === "arabic" ? a.translatedName.name : undefined;
    result.push({
      id: `a${a.id}`,
      chapterReciterId: null,
      recitationId: a.id,
      arabicName: arabic ?? latin,
      latinName: latin,
      riwayah: "Hafs",
      style: a.style?.toLowerCase() ?? null,
      imageUrl: null,
      gender: reciterGender(a.id) === "female" ? "female" : "male",
    });
  }
  return result.sort((x, y) => x.latinName.localeCompare(y.latinName));
};

export const listTranslations = async (language?: string): Promise<PlayerTranslation[]> => {
  const client = await getContentClient();
  const raw = (await client.content.v4.resources.translations.list(language ? ({ language } as never) : undefined)) as unknown;
  return unwrap<TranslationResourceLike>(raw, "translations").map((t) => ({
    id: String(t.id),
    apiId: t.id,
    label: t.name ?? t.translatedName?.name ?? String(t.id),
    languageName: t.languageName ?? "",
    languageKey: t.languageName ?? "",
  }));
};

export interface TafsirResource { id: number; name: string; author: string | null; language: string; slug: string }

export const listTafsirs = async (): Promise<TafsirResource[]> => {
  const client = await getContentClient();
  const raw = (await client.content.v4.resources.tafsirs.list()) as unknown;
  return unwrap<TafsirResourceLike>(raw, "tafsirs").map((t) => ({
    id: t.id,
    name: t.name ?? t.translatedName?.name ?? String(t.id),
    author: t.authorName ?? null,
    language: t.languageName ?? "",
    slug: t.slug ?? String(t.id),
  }));
};

export const getTafsirForAyah = async (tafsirId: string, verseKey: string): Promise<{ name: string; text: string } | null> => {
  const client = await getContentClient();
  const op = client.content.v4.raw.listAyahTafsirs;
  if (typeof op !== "function") throw new Error("SDK operation listAyahTafsirs is not available");
  const raw = (await op({ path: { resource_id: tafsirId, ayah_key: verseKey } })) as {
    tafsir?: { resource_name?: string; resourceName?: string; text?: string };
  };
  const t = raw?.tafsir;
  if (!t?.text) return null;
  const text = stripHtml(t.text);
  return text ? { name: t.resourceName ?? t.resource_name ?? tafsirId, text } : null;
};

export interface ChapterAudio { chapterId: number; reciterId: number; audioUrl: string; durationMs: number; fileSize: number | null; timestamps: ChapterTimestamp[] }

export const getChapterAudio = async (chapterReciterId: number, chapterId: number, withTimestamps = true): Promise<ChapterAudio | null> => {
  const client = await getContentClient();
  const raw = (await client.content.v4.audio.chapterRecitation.get(String(chapterReciterId) as never, String(chapterId) as never, (withTimestamps ? { segments: true } : undefined) as never)) as unknown;
  const f = ((raw as { audioFile?: Record<string, unknown> })?.audioFile ?? raw) as { audioUrl?: string; audio_url?: string; duration?: number; fileSize?: number; timestamps?: unknown[] } | undefined;
  const url = f?.audioUrl ?? f?.audio_url;
  if (!url) return null;
  return {
    chapterId,
    reciterId: chapterReciterId,
    audioUrl: absoluteAudioUrl(url),
    durationMs: f?.duration ?? 0,
    fileSize: f?.fileSize ?? null,
    timestamps: normaliseTimestamps((f?.timestamps ?? []) as never),
  };
};

export interface PlayerSurahPayload {
  surah: PlayerSurah;
  reciterId: string;
  translationId: number | null;
  segments: PlayerSegment[];
  chapterAudio: ChapterAudioInfo | null;
}

/* ---------- cached chapter text (reciter independent) ---------- */

interface ChapterText { surah: PlayerSurah; ayahs: PlayerAyah[]; basmala: PlayerAyah | null; fetchedAt: number }
const TEXT_TTL_MS = 60 * 60 * 1000;
const textCache = new Map<string, Promise<ChapterText>>();

const fetchChapterText = async (chapterId: number, translationId: number | null): Promise<ChapterText> => {
  const client = await getContentClient();
  const chapterRaw = (await client.content.v4.chapters.get(String(chapterId) as never, { language: "ar" } as never)) as unknown;
  const chapter = ((chapterRaw as { chapter?: ChapterLike })?.chapter ?? chapterRaw) as ChapterLike | undefined;
  if (!chapter?.id) throw Object.assign(new Error("Surah not found"), { status: 404 });
  const surah = toPlayerSurah(chapter);
  const wantsBasmala = surah.hasBismillah && chapterId !== 1 && chapterId !== 9;
  // words=false keeps this call ~10x smaller; words are derived with splitUthmaniWords.
  const [versesRaw, basmalaRaw] = await Promise.all([
    client.content.v4.verses.byChapter(String(chapterId) as never, { page: 1, perPage: 300, words: false, translations: translationId ? [translationId] : undefined, fields: { textUthmani: true } } as never) as Promise<unknown>,
    wantsBasmala ? (client.content.v4.verses.byKey("1:1" as never, { words: false, fields: { textUthmani: true } } as never) as Promise<unknown>) : Promise.resolve(null),
  ]);
  const verses = unwrap<VerseLike>(versesRaw, "verses");
  const basmalaVerse = basmalaRaw ? (((basmalaRaw as { verse?: VerseLike }).verse ?? basmalaRaw) as VerseLike) : null;
  return { surah, ayahs: verses.map((v) => toAyah(v, translationId)), basmala: basmalaVerse?.verseKey ? toAyah(basmalaVerse, null) : null, fetchedAt: Date.now() };
};

const getChapterText = (chapterId: number, translationId: number | null): Promise<ChapterText> => {
  const key = `${chapterId}|${translationId ?? "none"}`;
  const cached = textCache.get(key);
  if (cached) {
    return cached.then((t) => {
      if (Date.now() - t.fetchedAt < TEXT_TTL_MS) return t;
      textCache.delete(key);
      return getChapterText(chapterId, translationId);
    });
  }
  const p = fetchChapterText(chapterId, translationId).catch((e) => { textCache.delete(key); throw e; });
  textCache.set(key, p);
  return p;
};

/** Per-ayah audio for one reciter and chapter: url + word timings relative to each file. */
const getAyahAudio = async (recitationId: number, chapterId: number): Promise<Map<string, { url: string; timings: ReturnType<typeof normaliseAyahWordTimings> }>> => {
  const client = await getContentClient();
  const raw = (await client.content.v4.audio.verseRecitation.byChapter(String(chapterId) as never, String(recitationId), { perPage: 300, segments: true } as never)) as unknown;
  const files = unwrap<{ verseKey?: string; verse_key?: string; url?: string; segments?: unknown[] }>(raw, "audioFiles");
  const map = new Map<string, { url: string; timings: ReturnType<typeof normaliseAyahWordTimings> }>();
  for (const f of files) {
    const key = f.verseKey ?? f.verse_key;
    if (key && f.url) map.set(key, { url: absoluteAudioUrl(f.url, "verse"), timings: normaliseAyahWordTimings(f.segments) });
  }
  return map;
};

/** Word meanings for one ayah (lazy, on tap). */
export const getAyahWords = async (verseKey: string, wordLocale = "en"): Promise<PlayerWord[]> => {
  const client = await getContentClient();
  const raw = (await client.content.v4.verses.byKey(verseKey as never, { words: true, language: wordLocale, fields: { textUthmani: true }, wordFields: { textUthmani: true, translation: true, transliteration: true } } as never)) as unknown;
  const v = ((raw as { verse?: VerseLike }).verse ?? raw) as VerseLike;
  return toWords(v.words);
};

/**
 * Build the complete player payload for one surah:
 *  - verbatim text and derived words (for word highlighting)
 *  - translation (optional)
 *  - per-ayah audio for the ayah-by-ayah engine (when recitationId is known)
 *  - full-surah audio + verse/word timestamps for the gapless engine (when chapterReciterId is known)
 * Text is cached per (chapter, translation); the audio calls are small, so a
 * reciter switch costs about one second instead of a full reload.
 */
export const loadPlayerSurah = async (
  chapterId: number,
  reciter: { chapterReciterId: number | null; recitationId: number | null; id: string },
  translationId: number | null,
): Promise<PlayerSurahPayload | null> => {
  const [text, ayahAudio, chapterAudio] = await Promise.all([
    getChapterText(chapterId, translationId),
    reciter.recitationId ? getAyahAudio(reciter.recitationId, chapterId).catch(() => new Map()) : Promise.resolve(new Map()),
    reciter.chapterReciterId ? getChapterAudio(reciter.chapterReciterId, chapterId).catch(() => null) : Promise.resolve(null),
  ]);
  const withAudio = (a: PlayerAyah): PlayerAyah => {
    const f = ayahAudio.get(a.key);
    return f ? { ...a, audioUrl: f.url, ayahWordTimings: f.timings } : { ...a, audioUrl: null, ayahWordTimings: [] };
  };
  const ayahs = text.ayahs.map(withAudio);
  let basmala = text.basmala;
  if (basmala && reciter.recitationId) {
    const b = await getAyahAudio(reciter.recitationId, 1).catch(() => new Map());
    const f = b.get("1:1");
    basmala = f ? { ...basmala, audioUrl: f.url, ayahWordTimings: f.timings } : { ...basmala, audioUrl: null, ayahWordTimings: [] };
  }
  const timestamps = chapterAudio?.timestamps ?? [];
  const segments = buildSegments(text.surah, ayahs, basmala, timestamps);
  const hasTimestamps = timestamps.length > 0 && ayahs.every((a) => timestamps.some((t) => t.verseKey === a.key));
  return {
    surah: text.surah,
    reciterId: reciter.id,
    translationId,
    segments,
    chapterAudio: chapterAudio ? { url: chapterAudio.audioUrl, durationMs: chapterAudio.durationMs, hasTimestamps } : null,
  };
};
