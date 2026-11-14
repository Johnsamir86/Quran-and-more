import type { NextRequest } from "next/server";

import { parseLanguage, publicError, publicJson } from "@/lib/public-api";
import { searchQuran, type SearchMode } from "@/lib/search-api";

export const dynamic = "force-dynamic";

/**
 * GET /api/public/v1/search?q=mercy&mode=quick|advanced&page=1&size=20&language=en&translations=131&exact=1
 * Quran Foundation Search API with verse hydration; falls back to the open v4 search.
 */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const q = (sp.get("q") ?? sp.get("query") ?? "").trim();
  if (!q) return publicError("q is required");
  const mode: SearchMode = sp.get("mode") === "advanced" ? "advanced" : "quick";
  const translationIds = (sp.get("translations") ?? "").split(",").map((s) => Number.parseInt(s, 10)).filter((n) => Number.isInteger(n) && n > 0);
  try {
    const result = await searchQuran({ q, mode, page: Number.parseInt(sp.get("page") ?? "1", 10) || 1, size: Number.parseInt(sp.get("size") ?? "", 10) || undefined, language: parseLanguage(sp.get("language")), translationIds: translationIds.length ? translationIds : undefined, exact: sp.get("exact") === "1" });
    return publicJson(result, { maxAgeSeconds: 600 });
  } catch (error) {
    return publicError(error instanceof Error ? error.message : "Search failed", 502);
  }
}
