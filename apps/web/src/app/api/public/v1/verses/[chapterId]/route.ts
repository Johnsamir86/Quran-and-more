import type { NextRequest } from "next/server";

import { absoluteAudioUrl } from "@qam/core";

import { getContentClient, publicError, publicJson } from "@/lib/public-api";

export const dynamic = "force-dynamic";

interface WordLike { id: number; position: number; textUthmani?: string; text?: string; audioUrl?: string; translation?: { text?: string }; transliteration?: { text?: string }; charTypeName?: string; lineNumber?: number; pageNumber?: number }
interface VerseLike { id: number; verseKey: string; verseNumber: number; pageNumber?: number; juzNumber?: number; textUthmani?: string; textIndopak?: string; textUthmaniTajweed?: string; words?: WordLike[]; translations?: { resourceId: number; text: string }[]; audio?: { url?: string } }

/**
 * GET /api/public/v1/verses/:chapterId?translations=85,131&reciter=7&words=1&page=1&perPage=50
 * Returns verbatim Quran text (never altered), optional word-by-word, translations and audio URLs.
 */
export async function GET(request: NextRequest, context: { params: Promise<{ chapterId: string }> }) {
  const { chapterId } = await context.params;
  const id = Number.parseInt(chapterId, 10);
  if (!Number.isInteger(id) || id < 1 || id > 114) return publicError("chapterId must be 1..114");

  const sp = request.nextUrl.searchParams;
  const translations = (sp.get("translations") ?? "").split(",").map((s) => Number.parseInt(s, 10)).filter((n) => Number.isInteger(n) && n > 0);
  const reciter = Number.parseInt(sp.get("reciter") ?? "", 10);
  const words = sp.get("words") === "1";
  const page = Math.max(1, Number.parseInt(sp.get("page") ?? "1", 10) || 1);
  const perPage = Math.min(300, Math.max(1, Number.parseInt(sp.get("perPage") ?? "50", 10) || 50));

  try {
    const client = await getContentClient();
    const raw = (await client.content.v4.verses.byChapter(String(id) as never, {
      page,
      perPage,
      words,
      translations: translations.length ? translations : undefined,
      audio: Number.isInteger(reciter) ? reciter : undefined,
      fields: { textUthmani: true, textIndopak: true, textUthmaniTajweed: true },
      wordFields: { textUthmani: true, translation: true, transliteration: true },
    })) as unknown;
    const verses = (Array.isArray(raw) ? raw : (raw as { verses?: VerseLike[] }).verses ?? []) as VerseLike[];
    return publicJson({
      chapterId: id,
      page,
      perPage,
      verses: verses.map((v) => ({
        verseKey: v.verseKey,
        verseNumber: v.verseNumber,
        pageNumber: v.pageNumber ?? null,
        juzNumber: v.juzNumber ?? null,
        text: { uthmani: v.textUthmani ?? "", indopak: v.textIndopak ?? "", tajweed: v.textUthmaniTajweed ?? "" },
        translations: (v.translations ?? []).map((t) => ({ resourceId: t.resourceId, text: t.text })),
        audioUrl: v.audio?.url ? absoluteAudioUrl(v.audio.url, "verse") : null,
        words: words
          ? (v.words ?? []).map((w) => ({
              position: w.position,
              type: w.charTypeName ?? "word",
              text: w.textUthmani ?? w.text ?? "",
              translation: w.translation?.text ?? null,
              transliteration: w.transliteration?.text ?? null,
              audioUrl: w.audioUrl ? absoluteAudioUrl(w.audioUrl, "word") : null,
              line: w.lineNumber ?? null,
              page: w.pageNumber ?? null,
            }))
          : undefined,
      })),
    });
  } catch (error) {
    return publicError(error instanceof Error ? error.message : "Failed to load verses", 502);
  }
}
