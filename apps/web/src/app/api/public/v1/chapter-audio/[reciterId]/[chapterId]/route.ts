import { getChapterAudio } from "@/lib/player-api";
import { publicError, publicJson } from "@/lib/public-api";

export const dynamic = "force-dynamic";

/** GET /api/public/v1/chapter-audio/:reciterId/:chapterId  (full-surah file for radio/continuous listening) */
export async function GET(_request: Request, context: { params: Promise<{ reciterId: string; chapterId: string }> }) {
  const { reciterId, chapterId } = await context.params;
  const r = Number.parseInt(reciterId, 10);
  const c = Number.parseInt(chapterId, 10);
  if (!Number.isInteger(r) || !Number.isInteger(c) || c < 1 || c > 114) return publicError("invalid ids");
  try {
    const audio = await getChapterAudio(r, c, _request.url.includes("timestamps=1"));
    if (!audio) return publicError("Audio not available", 404);
    return publicJson({ audio }, { maxAgeSeconds: 86400 });
  } catch (error) {
    return publicError(error instanceof Error ? error.message : "Failed to load audio", 502);
  }
}
