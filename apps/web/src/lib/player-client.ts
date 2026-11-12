/** Browser-side fetchers for the unified player. Safe for client components. */
import type { ChapterAudioInfo, PlayerReciter, PlayerSegment, PlayerSurah, PlayerTranslation, PlayerWord } from "@qam/core";

export interface PlayerSurahPayload {
  surah: PlayerSurah;
  reciterId: string;
  translationId: number | null;
  segments: PlayerSegment[];
  chapterAudio: ChapterAudioInfo | null;
}

const get = async <T>(path: string): Promise<T> => {
  const res = await fetch(path, { headers: { accept: "application/json" } });
  if (!res.ok) {
    const err = new Error(`Request failed (${res.status})`) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  return (await res.json()) as T;
};

export const reciterParam = (r: Pick<PlayerReciter, "chapterReciterId" | "recitationId"> & { id?: string }): string =>
  [r.chapterReciterId !== null ? `c${r.chapterReciterId}` : null, r.recitationId !== null ? `a${r.recitationId}` : null].filter(Boolean).join(":") || r.id || "";

export const fetchSurahs = (language: string) =>
  get<{ chapters: { id: number; nameArabic: string; nameSimple: string; translatedName: string; versesCount: number; bismillahPre: boolean; revelationPlace: string }[] }>(
    `/api/public/v1/chapters?language=${encodeURIComponent(language)}`,
  ).then((r) =>
    r.chapters.map<PlayerSurah>((c) => ({
      number: c.id,
      arabicName: c.nameArabic,
      latinName: c.translatedName || c.nameSimple,
      verseCount: c.versesCount,
      hasBismillah: c.bismillahPre,
    })),
  );

export const fetchPlayerSurah = (chapterId: number, reciter: Pick<PlayerReciter, "chapterReciterId" | "recitationId">, translationId: number | null) =>
  get<PlayerSurahPayload>(`/api/public/v1/player/surah/${chapterId}?reciter=${encodeURIComponent(reciterParam(reciter))}&translation=${translationId ?? "none"}`);

export const fetchReciters = (profileGender: "male" | "female" | "unspecified") =>
  get<{ reciters: PlayerReciter[] }>(`/api/public/v1/reciters?profileGender=${profileGender}`).then((r) => r.reciters);

export const fetchTranslations = () => get<{ translations: PlayerTranslation[] }>(`/api/public/v1/translations`).then((r) => r.translations);

export const fetchTafsir = (tafsirId: string, verseKey: string) =>
  get<{ tafsir: { name: string; text: string } | null }>(`/api/public/v1/tafsir/${encodeURIComponent(tafsirId)}/${encodeURIComponent(verseKey)}`).then((r) => r.tafsir);

export const fetchWords = (verseKey: string, language: string) =>
  get<{ words: PlayerWord[] }>(`/api/public/v1/words/${encodeURIComponent(verseKey)}?language=${encodeURIComponent(language)}`).then((r) => r.words);

export interface TafsirResource { id: number; name: string; author: string | null; language: string; slug: string }
export const fetchTafsirs = () => get<{ tafsirs: TafsirResource[] }>(`/api/public/v1/tafsirs`).then((r) => r.tafsirs);
export const fetchWallpapers = (surah: number) =>
  get<{ wallpapers: import("@qam/core").Wallpaper[]; internetEnabled: boolean }>(`/api/public/v1/wallpapers?surah=${surah}&source=all`);
