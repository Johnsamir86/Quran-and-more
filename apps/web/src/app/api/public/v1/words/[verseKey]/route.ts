import type { NextRequest } from "next/server";

import { getAyahWords } from "@/lib/player-api";
import { parseLanguage, publicError, publicJson } from "@/lib/public-api";

export const dynamic = "force-dynamic";

/** GET /api/public/v1/words/2:255?language=en  word-by-word text, translation, transliteration and audio */
export async function GET(request: NextRequest, context: { params: Promise<{ verseKey: string }> }) {
  const { verseKey } = await context.params;
  if (!/^\d+:\d+$/.test(verseKey)) return publicError("verseKey must look like 2:255");
  const language = parseLanguage(request.nextUrl.searchParams.get("language"));
  try {
    return publicJson({ verseKey, language, words: await getAyahWords(verseKey, language) }, { maxAgeSeconds: 86400 });
  } catch (error) {
    return publicError(error instanceof Error ? error.message : "Failed to load words", 502);
  }
}
