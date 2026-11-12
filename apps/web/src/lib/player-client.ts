/** Browser-side fetchers for the unified player. Safe for client components. */
import type { PlayerReciter, PlayerSegment, PlayerSurah, PlayerTranslation } from "@qam/core";

export interface PlayerSurahPayload {
  surah: PlayerSurah;
  reciterId: number;
  translationId: number | null;
  segments: PlayerSegment[];
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

export const fetchPlayerSurah = (chapterId: number, reciterId: number, translationId: number | null) =>
  get<PlayerSurahPayload>(`/api/public/v1/player/surah/${chapterId}?reciter=${reciterId}&translation=${translationId ?? "none"}`);

export const fetchReciters = (profileGender: "male" | "female" | "unspecified") =>
  get<{ reciters: PlayerReciter[] }>(`/api/public/v1/reciters?profileGender=${profileGender}`).then((r) => r.reciters);

export const fetchTranslations = () => get<{ translations: PlayerTranslation[] }>(`/api/public/v1/translations`).then((r) => r.translations);

export const fetchTafsir = (tafsirId: string, verseKey: string) =>
  get<{ tafsir: { name: string; text: string } | null }>(`/api/public/v1/tafsir/${encodeURIComponent(tafsirId)}/${encodeURIComponent(verseKey)}`).then((r) => r.tafsir);

export const fetchChapterAudio = (reciterId: number, chapterId: number) =>
  get<{ audio: { audioUrl: string; durationMs: number } }>(`/api/public/v1/chapter-audio/${reciterId}/${chapterId}`).then((r) => r.audio);
