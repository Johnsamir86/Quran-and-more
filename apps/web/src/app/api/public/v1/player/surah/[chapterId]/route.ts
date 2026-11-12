import type { NextRequest } from "next/server";

import { loadPlayerSurah } from "@/lib/player-api";
import { publicError, publicJson } from "@/lib/public-api";

export const dynamic = "force-dynamic";

/**
 * GET /api/public/v1/player/surah/:chapterId?reciter=7&translation=85
 * Ready-to-play segments: Basmala (when applicable) + every ayah with
 * verbatim Arabic, optional translation and the reciter's audio URL.
 */
export async function GET(request: NextRequest, context: { params: Promise<{ chapterId: string }> }) {
  const { chapterId } = await context.params;
  const id = Number.parseInt(chapterId, 10);
  if (!Number.isInteger(id) || id < 1 || id > 114) return publicError("chapterId must be 1..114");
  const sp = request.nextUrl.searchParams;
  const reciter = Number.parseInt(sp.get("reciter") ?? "7", 10) || 7;
  const translationRaw = sp.get("translation");
  const translation = translationRaw && translationRaw !== "none" ? Number.parseInt(translationRaw, 10) || null : null;
  try {
    const payload = await loadPlayerSurah(id, reciter, translation);
    if (!payload) return publicError("Surah not available", 404);
    return publicJson(payload, { maxAgeSeconds: 3600 });
  } catch (error) {
    return publicError(error instanceof Error ? error.message : "Failed to load surah", 502);
  }
}
