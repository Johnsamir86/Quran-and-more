import type { NextRequest } from "next/server";

import { hashString, seededRandom } from "@qam/core";

import { parseLanguage, publicError, publicJson } from "@/lib/public-api";
import { defaultTranslationFor } from "@/lib/search-api";
import { loadVersesByKeys, randomVerseKeys } from "@/lib/study-api";

export const dynamic = "force-dynamic";

/** GET /api/public/v1/ayah/today?language=en -> the same ayah for everyone on a given day (UTC). */
export async function GET(request: NextRequest) {
  const language = parseLanguage(request.nextUrl.searchParams.get("language"));
  const day = request.nextUrl.searchParams.get("day") ?? new Date().toISOString().slice(0, 10);
  try {
    const [key] = randomVerseKeys(1, seededRandom(hashString(`ayah-of-the-day:${day}`)));
    const [row] = await loadVersesByKeys([key], await defaultTranslationFor(language));
    if (!row) return publicError("No ayah", 502);
    return publicJson({ day, verseKey: key, text: row.text, translation: row.translation, juz: row.juz }, { maxAgeSeconds: 3600 });
  } catch (error) {
    return publicError(error instanceof Error ? error.message : "Failed", 502);
  }
}
