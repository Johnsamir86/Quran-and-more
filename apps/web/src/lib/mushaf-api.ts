import "server-only";

import {
  buildMushafLines,
  mushafLayoutById,
  pageFontFamily,
  pageFontUrl,
  type MushafLayout,
  type MushafPage,
  type MushafVerseInput,
} from "@qam/core";

import { contentGet } from "@/lib/content";

interface WordLike { position: number; charTypeName?: string; lineNumber?: number; pageNumber?: number; codeV1?: string; codeV2?: string; textUthmani?: string; textQpcHafs?: string; textIndopak?: string; text?: string }
interface VerseLike { verseKey: string; juzNumber?: number; hizbNumber?: number; words?: WordLike[] }
interface ChapterLike { id: number; nameArabic?: string; bismillahPre?: boolean; pages?: number[] }

const unwrap = <T>(raw: unknown, key: string): T[] => (Array.isArray(raw) ? raw : ((raw as Record<string, T[]>)?.[key] ?? [])) as T[];

const glyphOf = (layout: MushafLayout, w: WordLike): string => {
  switch (layout.glyph) {
    case "codeV1": return w.codeV1 ?? w.text ?? "";
    case "codeV2": return w.codeV2 ?? w.text ?? "";
    case "textQpcHafs": return w.textQpcHafs ?? w.textUthmani ?? w.text ?? "";
    case "textIndopak": return w.textIndopak ?? w.textUthmani ?? w.text ?? "";
    default: return w.textUthmani ?? w.text ?? "";
  }
};

const chapterCache = new Map<string, Promise<ChapterLike[]>>();
const getChapters = (): Promise<ChapterLike[]> => {
  const key = "ar";
  let p = chapterCache.get(key);
  if (!p) {
    p = contentGet("chapters", { language: "ar" }, 24 * 3600 * 1000).then((raw) => unwrap<ChapterLike>(raw, "chapters"));
    chapterCache.set(key, p);
    p.catch(() => chapterCache.delete(key));
  }
  return p;
};

export const loadMushafPage = async (page: number, layoutId: string): Promise<MushafPage> => {
  const layout = mushafLayoutById(layoutId);
  const [raw, chapters] = await Promise.all([
    contentGet(`verses/by_page/${page}`, { words: true, mushaf: layout.mushafId, per_page: 50, word_fields: "code_v1,code_v2,text_uthmani,text_qpc_hafs,text_indopak,line_number,page_number", fields: "text_uthmani" }, 24 * 3600 * 1000),
    getChapters(),
  ]);
  const verses = unwrap<VerseLike>(raw, "verses");
  const byId = new Map(chapters.map((c) => [c.id, c]));
  const surahStarts = new Map<string, { number: number; hasBasmala: boolean }>();
  const surahs: MushafPage["surahs"] = [];
  const seen = new Set<number>();
  for (const v of verses) {
    const [s, a] = v.verseKey.split(":").map(Number);
    if (!seen.has(s)) {
      seen.add(s);
      const ch = byId.get(s);
      surahs.push({ number: s, nameArabic: ch?.nameArabic ?? String(s), firstVerseKey: v.verseKey });
    }
    if (a === 1) surahStarts.set(v.verseKey, { number: s, hasBasmala: s !== 1 && s !== 9 && (byId.get(s)?.bismillahPre ?? true) });
  }
  const input: MushafVerseInput[] = verses.map((v) => ({
    verseKey: v.verseKey,
    words: (v.words ?? []).filter((w) => (w.pageNumber ?? page) === page).map((w) => ({
      position: w.position,
      charTypeName: w.charTypeName,
      lineNumber: w.lineNumber ?? 1,
      glyph: glyphOf(layout, w),
      text: w.textUthmani ?? w.text ?? "",
    })),
  }));
  return {
    layoutId: layout.id,
    page,
    lines: buildMushafLines(layout, input, surahStarts),
    surahs,
    juz: verses[0]?.juzNumber ?? null,
    hizb: verses[0]?.hizbNumber ?? null,
    fontFamily: pageFontFamily(layout, page),
    fontUrl: pageFontUrl(layout, page),
  };
};
