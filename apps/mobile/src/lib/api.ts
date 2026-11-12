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
export const fetchReader = (chapterId: number | string) => get<ReaderPayload>(`/api/reader/${chapterId}`);
