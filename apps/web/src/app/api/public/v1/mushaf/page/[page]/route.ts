import type { NextRequest } from "next/server";

import { DEFAULT_MUSHAF_LAYOUT, MUSHAF_LAYOUTS } from "@qam/core";

import { loadMushafPage } from "@/lib/mushaf-api";
import { publicError, publicJson } from "@/lib/public-api";

export const dynamic = "force-dynamic";

/** GET /api/public/v1/mushaf/page/3?layout=madani_v2  -> lines of words with glyphs for the layout's page font */
export async function GET(request: NextRequest, context: { params: Promise<{ page: string }> }) {
  const { page } = await context.params;
  const n = Number.parseInt(page, 10);
  const layoutId = request.nextUrl.searchParams.get("layout") ?? DEFAULT_MUSHAF_LAYOUT;
  const layout = MUSHAF_LAYOUTS.find((l) => l.id === layoutId);
  if (!layout) return publicError(`layout must be one of ${MUSHAF_LAYOUTS.map((l) => l.id).join(", ")}`);
  if (!Number.isInteger(n) || n < 1 || n > layout.pages) return publicError(`page must be 1..${layout.pages}`);
  try {
    return publicJson(await loadMushafPage(n, layout.id), { maxAgeSeconds: 86400 });
  } catch (error) {
    return publicError(error instanceof Error ? error.message : "Failed to load page", 502);
  }
}
