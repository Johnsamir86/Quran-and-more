import type { NextRequest } from "next/server";

import { askQuran } from "@/lib/ask-api";
import { parseLanguage, publicError, publicJson } from "@/lib/public-api";

export const dynamic = "force-dynamic";

/** POST /api/ask { question, language } -> restricted-mode answer with verbatim citations. */
export async function POST(request: NextRequest) {
  let body: { question?: string; language?: string } = {};
  try { body = (await request.json()) as typeof body; } catch { /* empty */ }
  const question = (body.question ?? "").trim().slice(0, 500);
  if (question.length < 3) return publicError("question is required");
  try {
    return publicJson(await askQuran(question, parseLanguage(body.language ?? null)), { maxAgeSeconds: 0 });
  } catch (error) {
    return publicError(error instanceof Error ? error.message : "Ask failed", 502);
  }
}
