import type { NextRequest } from "next/server";

import { parseLanguage, publicError, publicJson } from "@/lib/public-api";
import { loadStudy } from "@/lib/study-api";

export const dynamic = "force-dynamic";

/** GET /api/public/v1/study/2:255?language=en&translations=131,20 -> everything about one ayah. */
export async function GET(request: NextRequest, context: { params: Promise<{ verseKey: string }> }) {
  const { verseKey } = await context.params;
  const key = decodeURIComponent(verseKey);
  if (!/^\d{1,3}:\d{1,3}$/.test(key)) return publicError("verseKey must look like 2:255");
  const sp = request.nextUrl.searchParams;
  const translations = (sp.get("translations") ?? "").split(",").map((s) => Number.parseInt(s, 10)).filter((n) => Number.isInteger(n) && n > 0);
  try {
    const bundle = await loadStudy(key, parseLanguage(sp.get("language")), translations.length ? translations : undefined);
    if (!bundle) return publicError("Ayah not found", 404);
    return publicJson(bundle, { maxAgeSeconds: 3600 });
  } catch (error) {
    return publicError(error instanceof Error ? error.message : "Failed to load study bundle", 502);
  }
}
