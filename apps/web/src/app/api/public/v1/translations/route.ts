import type { NextRequest } from "next/server";

import { listTranslations } from "@/lib/player-api";
import { publicError, publicJson } from "@/lib/public-api";

export const dynamic = "force-dynamic";

/** GET /api/public/v1/translations?language=ar  (omit language for all) */
export async function GET(request: NextRequest) {
  const language = request.nextUrl.searchParams.get("language") ?? undefined;
  try {
    return publicJson({ translations: await listTranslations(language) }, { maxAgeSeconds: 86400 });
  } catch (error) {
    return publicError(error instanceof Error ? error.message : "Failed to load translations", 502);
  }
}
