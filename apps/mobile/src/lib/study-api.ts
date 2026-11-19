import type { GameRound, Lesson, LessonAyah } from "@qam/core";

import { API_BASE_URL } from "./api";

/** Client for the study layer of apps/web (search, study bundle, lessons, games, ask). */
const get = async <T>(path: string): Promise<T> => {
  const res = await fetch(`${API_BASE_URL}${path}`, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return (await res.json()) as T;
};

export interface SearchNavItem { type: string; key: string; label: string; href: string }
export interface SearchVerse { verseKey: string; chapter: number; verse: number; text: string; translation: string | null; translationName: string | null; highlight: string | null }
export interface SearchResult { query: string; mode: "quick" | "advanced"; source: "qf" | "legacy"; navigation: SearchNavItem[]; verses: SearchVerse[]; pagination: { page: number; size: number; total: number; totalPages: number; nextPage: number | null } }
export const search = (q: string, language: string, mode: "quick" | "advanced" = "quick", page = 1) =>
  get<SearchResult>(`/api/public/v1/search?q=${encodeURIComponent(q)}&mode=${mode}&page=${page}&size=20&language=${language}`);

export interface StudyWord { position: number; text: string; translation: string | null; transliteration: string | null; audioUrl: string | null }
export interface StudyTranslation { id: number; name: string; language: string; text: string }
export interface TafsirResource { id: number; name: string; author: string | null; language: string; slug: string }
export interface StudyHadith { collection: string; book: string | null; number: string | null; text: string; grade: string | null; url: string | null }
export interface StudyReflection { id: string; author: string; body: string; likes: number; url: string | null; verified: boolean }
export interface StudyBundle {
  verseKey: string; chapter: { number: number; arabicName: string; latinName: string; verseCount: number }; verse: number;
  text: string; words: StudyWord[]; translations: StudyTranslation[]; tafsirs: TafsirResource[]; defaultTafsirs: number[];
  juz: number | null; page: number | null; hizb: number | null; sajdah: boolean;
  chapterInfo: { shortText: string; source: string | null } | null;
  hadith: StudyHadith[] | null; reflections: StudyReflection[] | null;
  availability: { hadith: "ok" | "empty" | "unavailable"; answers: "ok" | "empty" | "unavailable"; reflections: "ok" | "empty" | "unavailable" };
  prev: string | null; next: string | null;
}
export const fetchStudy = (verseKey: string, language: string) => get<StudyBundle>(`/api/public/v1/study/${encodeURIComponent(verseKey)}?language=${language}`);
export const fetchTafsirText = (tafsirId: number, verseKey: string) =>
  get<{ tafsir: { name: string; text: string } | null }>(`/api/public/v1/tafsir/${tafsirId}/${encodeURIComponent(verseKey)}`).then((r) => r.tafsir);

export interface ChapterRow { id: number; nameArabic: string; nameSimple: string; translatedName: string; versesCount: number }
export const fetchChapterRows = (language: string) => get<{ chapters: ChapterRow[] }>(`/api/public/v1/chapters?language=${language}`).then((r) => r.chapters);

export const fetchLesson = (chapterId: number, language: string, seed: string) =>
  get<{ lesson: Lesson; ayahs: LessonAyah[] }>(`/api/public/v1/learn/lesson/${chapterId}?language=${language}&size=10&seed=${encodeURIComponent(seed)}`);

export const fetchRound = (kind: string, scope: string, language: string, count = 8) =>
  get<{ round: GameRound; seed: string }>(`/api/public/v1/games/round?type=${kind}&scope=${encodeURIComponent(scope)}&count=${count}&language=${language}&seed=${Date.now()}`);

export interface AyahOfDay { day: string; verseKey: string; text: string; translation: string | null; juz: number | null }
export const fetchAyahOfDay = (language: string) => get<AyahOfDay>(`/api/public/v1/ayah/today?language=${language}`);

export interface HifzAyah { verseKey: string; verseNumber: number; text: string; translation: string | null; audioUrl: string | null }
export const fetchHifzAyahs = async (chapterId: number, language: string): Promise<HifzAyah[]> => {
  const r = await get<{ verses: { verseKey: string; verseNumber: number; text: { uthmani: string }; translations: { text: string }[]; audioUrl: string | null }[] }>(
    `/api/public/v1/verses/${chapterId}?translations=${language === "ar" ? "" : "85"}&reciter=7&perPage=300`,
  );
  return r.verses.map((v) => ({ verseKey: v.verseKey, verseNumber: v.verseNumber, text: v.text.uthmani, translation: v.translations[0]?.text ?? null, audioUrl: v.audioUrl }));
};

export interface AskSource { verseKey: string; text: string; translation: string | null; tafsir: { name: string; text: string } | null }
export interface AskResult { question: string; language: string; mode: "retrieval" | "model"; answer: string | null; sources: AskSource[]; disclaimer: string; model: string | null }
export const ask = async (question: string, language: string): Promise<AskResult> => {
  const res = await fetch(`${API_BASE_URL}/api/ask`, { method: "POST", headers: { "content-type": "application/json", accept: "application/json" }, body: JSON.stringify({ question, language }) });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return (await res.json()) as AskResult;
};
