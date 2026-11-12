import "server-only";

import {
  absoluteAudioUrl,
  buildSegments,
  reciterGender,
  stripHtml,
  type PlayerAyah,
  type PlayerReciter,
  type PlayerSegment,
  type PlayerSurah,
  type PlayerTranslation,
} from "@qam/core";

import { getContentClient } from "@/lib/public-api";

/* Loose shapes of the SDK responses we read. */
interface ChapterLike { id: number; nameArabic?: string; nameSimple?: string; versesCount?: number; bismillahPre?: boolean; revelationPlace?: string; translatedName?: { name?: string } | string }
interface VerseLike { verseNumber: number; verseKey: string; textUthmani?: string; translations?: { resourceId: number; text: string }[]; audio?: { url?: string; segments?: unknown; duration?: number } }
interface RecitationLike { id: number; reciterName?: string; style?: string | null; translatedName?: { name?: string } }
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

const toAyah = (v: VerseLike, translationId: number | null): PlayerAyah => {
  const translation = translationId ? v.translations?.find((t) => t.resourceId === translationId)?.text ?? v.translations?.[0]?.text : null;
  return {
    number: v.verseNumber,
    key: v.verseKey,
    arabic: (v.textUthmani ?? "").trim(),
    translation: translation ? stripHtml(translation) || null : null,
    audioUrl: v.audio?.url ? absoluteAudioUrl(v.audio.url, "verse") : null,
    durationMs: Math.round((v.audio?.duration ?? 0) * 1000),
  };
};

export const listPlayerSurahs = async (language: string): Promise<PlayerSurah[]> => {
  const client = await getContentClient();
  const raw = (await client.content.v4.chapters.list({ language } as never)) as unknown;
  return unwrap<ChapterLike>(raw, "chapters").map(toPlayerSurah);
};

export const listReciters = async (): Promise<PlayerReciter[]> => {
  const client = await getContentClient();
  const raw = (await client.content.v4.resources.recitations.list({ language: "ar" } as never)) as unknown;
  return unwrap<RecitationLike>(raw, "recitations").map((r) => ({
    id: r.id,
    arabicName: r.translatedName?.name ?? r.reciterName ?? String(r.id),
    latinName: r.reciterName ?? String(r.id),
    riwayah: "حفص عن عاصم",
    style: r.style ?? null,
    imageUrl: null,
    gender: reciterGender(r.id) === "female" ? "female" : "male",
  }));
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

export interface PlayerSurahPayload {
  surah: PlayerSurah;
  reciterId: number;
  translationId: number | null;
  segments: PlayerSegment[];
}

export const loadPlayerSurah = async (
  chapterId: number,
  reciterId: number,
  translationId: number | null,
): Promise<PlayerSurahPayload | null> => {
  const client = await getContentClient();
  const chapterRaw = (await client.content.v4.chapters.get(String(chapterId) as never, { language: "ar" } as never)) as unknown;
  const chapter = ((chapterRaw as { chapter?: ChapterLike })?.chapter ?? chapterRaw) as ChapterLike | undefined;
  if (!chapter?.id) return null;
  const surah = toPlayerSurah(chapter);

  const query = {
    page: 1,
    perPage: 300,
    words: false,
    audio: reciterId,
    translations: translationId ? [translationId] : undefined,
    fields: { textUthmani: true },
  };
  const [versesRaw, basmalaRaw] = await Promise.all([
    client.content.v4.verses.byChapter(String(chapterId) as never, query as never) as Promise<unknown>,
    surah.hasBismillah && chapterId !== 1
      ? (client.content.v4.verses.byKey("1:1" as never, { words: false, audio: reciterId, fields: { textUthmani: true } } as never) as Promise<unknown>)
      : Promise.resolve(null),
  ]);
  const verses = unwrap<VerseLike>(versesRaw, "verses");
  const basmalaVerse = basmalaRaw ? (((basmalaRaw as { verse?: VerseLike }).verse ?? basmalaRaw) as VerseLike) : null;
  const ayahs = verses.map((v) => toAyah(v, translationId));
  const basmala = basmalaVerse?.verseKey ? toAyah(basmalaVerse, null) : null;
  return { surah, reciterId, translationId, segments: buildSegments(surah, ayahs, basmala) };
};

export interface ChapterAudio { chapterId: number; reciterId: number; audioUrl: string; durationMs: number; fileSize: number | null }

export const getChapterAudio = async (reciterId: number, chapterId: number): Promise<ChapterAudio | null> => {
  const client = await getContentClient();
  const raw = (await client.content.v4.audio.chapterRecitation.get(String(reciterId) as never, String(chapterId) as never)) as unknown;
  const f = ((raw as { audioFile?: Record<string, unknown> })?.audioFile ?? raw) as { audioUrl?: string; audio_url?: string; duration?: number; fileSize?: number } | undefined;
  const url = f?.audioUrl ?? f?.audio_url;
  if (!url) return null;
  return { chapterId, reciterId, audioUrl: url, durationMs: f?.duration ?? 0, fileSize: f?.fileSize ?? null };
};
