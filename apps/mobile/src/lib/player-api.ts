import type { ChapterAudioInfo, PlayerReciter, PlayerSegment, PlayerSurah, PlayerTranslation } from "@qam/core";

import { API_BASE_URL } from "./api";

export interface PlayerSurahPayload { surah: PlayerSurah; reciterId: string; translationId: number | null; segments: PlayerSegment[]; chapterAudio: ChapterAudioInfo | null }

export const reciterParam = (r: Pick<PlayerReciter, "chapterReciterId" | "recitationId"> & { id?: string }): string =>
  [r.chapterReciterId !== null ? `c${r.chapterReciterId}` : null, r.recitationId !== null ? `a${r.recitationId}` : null].filter(Boolean).join(":") || r.id || "";

const get = async <T>(path: string): Promise<T> => {
  const res = await fetch(`${API_BASE_URL}${path}`, { headers: { accept: "application/json" } });
  if (!res.ok) { const e = new Error(`Request failed (${res.status})`) as Error & { status?: number }; e.status = res.status; throw e; }
  return (await res.json()) as T;
};

export const fetchSurahs = (language: string) =>
  get<{ chapters: { id: number; nameArabic: string; nameSimple: string; translatedName: string; versesCount: number; bismillahPre: boolean }[] }>(`/api/public/v1/chapters?language=${language}`)
    .then((r) => r.chapters.map<PlayerSurah>((c) => ({ number: c.id, arabicName: c.nameArabic, latinName: c.translatedName || c.nameSimple, verseCount: c.versesCount, hasBismillah: c.bismillahPre })));
export const fetchPlayerSurah = (chapterId: number, reciter: Pick<PlayerReciter, "chapterReciterId" | "recitationId">, translationId: number | null) =>
  get<PlayerSurahPayload>(`/api/public/v1/player/surah/${chapterId}?reciter=${encodeURIComponent(reciterParam(reciter))}&translation=${translationId ?? "none"}`);
export const fetchReciters = (profileGender: string) => get<{ reciters: PlayerReciter[] }>(`/api/public/v1/reciters?profileGender=${profileGender}`).then((r) => r.reciters);
export const fetchTranslations = () => get<{ translations: PlayerTranslation[] }>(`/api/public/v1/translations`).then((r) => r.translations);
export const fetchTafsir = (tafsirId: string, verseKey: string) =>
  get<{ tafsir: { name: string; text: string } | null }>(`/api/public/v1/tafsir/${tafsirId}/${encodeURIComponent(verseKey)}`).then((r) => r.tafsir);
export interface TafsirResource { id: number; name: string; author: string | null; language: string; slug: string }
export const fetchTafsirs = () => get<{ tafsirs: TafsirResource[] }>(`/api/public/v1/tafsirs`).then((r) => r.tafsirs);
