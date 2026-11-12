import type { NextRequest } from "next/server";

import { loadPlayerSurah } from "@/lib/player-api";
import { publicError, publicJson } from "@/lib/public-api";

export const dynamic = "force-dynamic";

/**
 * GET /api/public/v1/player/surah/:chapterId?reciter=c7&translation=85
 *   reciter: "c<chapterReciterId>" (gapless, with timestamps) or "a<recitationId>" (ayah-by-ayah),
 *            or "c7:a7" to supply both. Legacy numeric value is treated as an ayah-by-ayah id.
 * Returns segments (Basmala + ayat) with verbatim text, words, translation,
 * per-ayah audio, full-surah audio and verse/word timestamps.
 */
export async function GET(request: NextRequest, context: { params: Promise<{ chapterId: string }> }) {
  const { chapterId } = await context.params;
  const id = Number.parseInt(chapterId, 10);
  if (!Number.isInteger(id) || id < 1 || id > 114) return publicError("chapterId must be 1..114");
  const sp = request.nextUrl.searchParams;
  const reciterParam = sp.get("reciter") ?? "c7:a7";
  let chapterReciterId: number | null = null;
  let recitationId: number | null = null;
  for (const part of reciterParam.split(":")) {
    const m = /^([ca])?(\d+)$/.exec(part.trim());
    if (!m) continue;
    const n = Number.parseInt(m[2], 10);
    if (m[1] === "c") chapterReciterId = n;
    else recitationId = n;
  }
  if (chapterReciterId === null && recitationId === null) return publicError("reciter must look like c7, a7 or c7:a7");
  const translationRaw = sp.get("translation");
  const translation = translationRaw && translationRaw !== "none" ? Number.parseInt(translationRaw, 10) || null : null;
  try {
    const payload = await loadPlayerSurah(id, { chapterReciterId, recitationId, id: reciterParam }, translation);
    if (!payload) return publicError("Surah not available", 404);
    return publicJson(payload, { maxAgeSeconds: 3600 });
  } catch (error) {
    return publicError(error instanceof Error ? error.message : "Failed to load surah", 502);
  }
}
