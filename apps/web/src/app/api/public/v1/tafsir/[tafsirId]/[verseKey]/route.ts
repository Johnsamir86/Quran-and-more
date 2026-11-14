import { getTafsirForAyah } from "@/lib/player-api";
import { publicError, publicJson } from "@/lib/public-api";

export const dynamic = "force-dynamic";

/** GET /api/public/v1/tafsir/:tafsirId/:verseKey  e.g. /tafsir/169/2:255 */
export async function GET(_request: Request, context: { params: Promise<{ tafsirId: string; verseKey: string }> }) {
  const { tafsirId, verseKey } = await context.params;
  if (!/^\d+:\d+$/.test(verseKey)) return publicError("verseKey must look like 2:255");
  if (!/^[\w-]+$/.test(tafsirId)) return publicError("invalid tafsirId");
  try {
    const tafsir = await getTafsirForAyah(tafsirId, verseKey);
    if (!tafsir) return publicJson({ tafsir: null }, { maxAgeSeconds: 3600 });
    return publicJson({ tafsir: { ...tafsir, verseKey, tafsirId } }, { maxAgeSeconds: 86400 });
  } catch (error) {
    return publicError(error instanceof Error ? error.message : "Failed to load tafsir", 502);
  }
}
