import Constants from "expo-constants";

/**
 * The mobile app talks to our own backend (apps/web), never to the Quran
 * Foundation API directly, so the client secret stays on the server and
 * every platform shares one cache, one family model and one audit trail.
 */
export const API_BASE_URL: string =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) ??
  "http://localhost:3000";

export interface ChapterSummary {
  id: number;
  nameArabic: string;
  nameSimple: string;
  translatedName: string;
  versesCount: number;
  revelationPlace: string;
}

export interface VerseRow {
  id: string;
  verseKey: string;
  verseNumber: number;
  arabicText: string;
  translationText: string | null;
}

export interface ReaderPayload {
  chapter: { id: number; nameArabic: string; nameSimple: string; translatedName: string; versesCount: number };
  translationIds: number[];
  verses: VerseRow[];
}

const get = async <T>(path: string): Promise<T> => {
  const res = await fetch(`${API_BASE_URL}${path}`, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return (await res.json()) as T;
};

export const fetchChapters = (locale = "en") => get<{ chapters: ChapterSummary[] }>(`/api/public/v1/chapters?language=${locale}`);
/** Translation resource ids. Prelive sandbox has 85 (Abdel Haleem); production default is 131 (The Clear Quran). */
const TRANSLATION_IDS = (process.env.EXPO_PUBLIC_TRANSLATION_IDS ?? "85").split(",").map((id: string) => id.trim()).filter(Boolean);

interface PublicVerse {
  verseKey: string;
  verseNumber: number;
  text: { uthmani: string; indopak: string; tajweed: string };
  translations: { resourceId: number; text: string }[];
}

export const fetchReader = async (chapterId: number | string): Promise<ReaderPayload> => {
  const [chaptersRes, versesRes] = await Promise.all([
    fetchChapters(),
    get<{ chapterId: number; verses: PublicVerse[] }>(
      `/api/public/v1/verses/${chapterId}?translations=${TRANSLATION_IDS.join(",")}&perPage=300`,
    ),
  ]);
  const chapter = chaptersRes.chapters.find((c) => String(c.id) === String(chapterId));
  if (!chapter) throw new Error(`Unknown chapter ${chapterId}`);
  return {
    chapter: { id: chapter.id, nameArabic: chapter.nameArabic, nameSimple: chapter.nameSimple, translatedName: chapter.translatedName, versesCount: chapter.versesCount },
    translationIds: TRANSLATION_IDS.map(Number),
    verses: versesRes.verses.map((v) => ({
      id: v.verseKey,
      verseKey: v.verseKey,
      verseNumber: v.verseNumber,
      arabicText: v.text.uthmani,
      translationText: v.translations[0]?.text ?? null,
    })),
  };
};
