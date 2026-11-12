import type { NextRequest } from "next/server";

import { buildLesson } from "@qam/core";

import { parseLanguage, publicError, publicJson } from "@/lib/public-api";
import { defaultTranslationFor } from "@/lib/search-api";
import { loadLessonAyahs } from "@/lib/study-api";

export const dynamic = "force-dynamic";

/** GET /api/public/v1/learn/lesson/112?language=en&size=10&seed=2026-01-01 -> Quranlingo-style lesson. */
export async function GET(request: NextRequest, context: { params: Promise<{ chapterId: string }> }) {
  const { chapterId } = await context.params;
  const id = Number.parseInt(chapterId, 10);
  if (!Number.isInteger(id) || id < 1 || id > 114) return publicError("chapterId must be 1..114");
  const sp = request.nextUrl.searchParams;
  const language = parseLanguage(sp.get("language"));
  try {
    const { title, ayahs } = await loadLessonAyahs(id, language, await defaultTranslationFor(language));
    const lesson = buildLesson(id, title, ayahs, { size: Math.min(20, Number.parseInt(sp.get("size") ?? "10", 10) || 10), seed: sp.get("seed") ?? undefined });
    return publicJson({ lesson, ayahs }, { maxAgeSeconds: 3600 });
  } catch (error) {
    return publicError(error instanceof Error ? error.message : "Failed to build lesson", 502);
  }
}
