import { listTafsirs } from "@/lib/player-api";
import { publicError, publicJson } from "@/lib/public-api";

export const dynamic = "force-dynamic";

/** GET /api/public/v1/tafsirs */
export async function GET() {
  try {
    return publicJson({ tafsirs: await listTafsirs() }, { maxAgeSeconds: 86400 });
  } catch (error) {
    return publicError(error instanceof Error ? error.message : "Failed to load tafsirs", 502);
  }
}
