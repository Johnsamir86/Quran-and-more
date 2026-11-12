import type { NextRequest } from "next/server";

import { getContentClient, parseLanguage, publicError, publicJson } from "@/lib/public-api";

export const dynamic = "force-dynamic";

interface ChapterLike {
  id: number;
  nameArabic?: string;
  nameSimple?: string;
  versesCount?: number;
  revelationPlace?: string;
  revelationOrder?: number;
  bismillahPre?: boolean;
  pages?: number[];
  translatedName?: { name?: string } | string;
}

/** GET /api/public/v1/chapters?language=ar */
export async function GET(request: NextRequest) {
  const language = parseLanguage(request.nextUrl.searchParams.get("language"));
  try {
    const client = await getContentClient();
    const raw = (await client.content.v4.chapters.list({ language } as never)) as unknown;
    const chapters = (Array.isArray(raw) ? raw : (raw as { chapters?: ChapterLike[] }).chapters ?? []) as ChapterLike[];
    return publicJson({
      language,
      chapters: chapters.map((c) => ({
        id: c.id,
        nameArabic: c.nameArabic ?? "",
        nameSimple: c.nameSimple ?? "",
        translatedName: typeof c.translatedName === "string" ? c.translatedName : c.translatedName?.name ?? "",
        versesCount: c.versesCount ?? 0,
        revelationPlace: c.revelationPlace ?? "",
        revelationOrder: c.revelationOrder ?? null,
        bismillahPre: c.bismillahPre ?? true,
        pages: c.pages ?? [],
      })),
    });
  } catch (error) {
    return publicError(error instanceof Error ? error.message : "Failed to load chapters", 502);
  }
}
