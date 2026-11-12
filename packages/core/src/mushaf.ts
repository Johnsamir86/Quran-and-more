/**
 * Mushaf page layouts. Each layout maps to a Quran Foundation `mushaf` id
 * (which decides page and line breaks) and to the glyph or text field used to
 * render a word, plus the font family that renders it.
 *
 * Fonts:
 *  - "page-font": one font file per page (King Fahd Complex glyph fonts,
 *    "QCF"). Word text is a private-use glyph code; the page font draws the
 *    exact calligraphy of the printed Madani mushaf.
 *  - "static-font": one font for all pages; word text is normal Arabic text.
 */
export type GlyphSource = "codeV1" | "codeV2" | "textUthmani" | "textQpcHafs" | "textIndopak";

export interface MushafLayout {
  id: string;
  label: { ar: string; en: string };
  /** Quran Foundation mushaf id for `verses/by_page?mushaf=` */
  mushafId: number;
  lines: number;
  pages: number;
  glyph: GlyphSource;
  fontKind: "page-font" | "static-font";
  /** CSS font-family base; page fonts append `-p{page}`. */
  fontFamily: string;
  /** URL template for the font file; `{page}` is replaced for page fonts. */
  fontUrl: string;
  /** Tajweed colouring is baked into the glyphs (COLRv1 font). */
  tajweed?: boolean;
}

/** Fonts come from the open-source Quran.com frontend (MIT), served by jsDelivr with CORS. */
export const MUSHAF_FONT_CDN = "https://cdn.jsdelivr.net/gh/quran/quran.com-frontend-next@master/public/fonts/quran";

/** Decorative surah-name font (glyph per surah) from the same repository. */
export const SURAH_NAMES_FONT_URL = `${MUSHAF_FONT_CDN}/surah-names/v1/sura_names.woff2`;

export const MUSHAF_LAYOUTS: MushafLayout[] = [
  {
    id: "madani_v2",
    label: { ar: "مصحف المدينة (١٥ سطرًا)", en: "Madani mushaf, 15 lines" },
    mushafId: 1, lines: 15, pages: 604, // QCF V2 (api-docs.quran.foundation font tutorial)
    glyph: "codeV2", fontKind: "page-font", fontFamily: "qcf-v2",
    fontUrl: `${MUSHAF_FONT_CDN}/hafs/v2/woff2/p{page}.woff2`,
  },
  {
    id: "madani_v1",
    label: { ar: "مصحف المدينة (الإصدار الأول)", en: "Madani mushaf, classic glyphs" },
    mushafId: 2, lines: 15, pages: 604, // QCF V1
    glyph: "codeV1", fontKind: "page-font", fontFamily: "qcf-v1",
    fontUrl: `${MUSHAF_FONT_CDN}/hafs/v1/woff2/p{page}.woff2`,
  },
  {
    id: "tajweed",
    label: { ar: "مصحف التجويد الملوّن", en: "Tajweed mushaf, colour coded" },
    mushafId: 19, lines: 15, pages: 604, // QCF V4 tajweed
    glyph: "codeV2", fontKind: "page-font", fontFamily: "qcf-v4-tajweed", tajweed: true,
    fontUrl: `${MUSHAF_FONT_CDN}/hafs/v4/colrv1/woff2/p{page}.woff2`,
  },
  {
    id: "kfgqpc_hafs",
    label: { ar: "مجمع الملك فهد، خط حفص", en: "KFGQPC Uthmanic Hafs" },
    mushafId: 5, lines: 15, pages: 604,
    glyph: "textQpcHafs", fontKind: "static-font", fontFamily: "uthmanic-hafs",
    fontUrl: `${MUSHAF_FONT_CDN}/hafs/uthmanic_hafs/UthmanicHafs1Ver18.woff2`,
  },
  {
    id: "indopak_15",
    label: { ar: "المصحف الهندي الباكستاني (١٥ سطرًا)", en: "IndoPak, 15 lines" },
    mushafId: 6, lines: 15, pages: 610,
    glyph: "textIndopak", fontKind: "static-font", fontFamily: "indopak-nastaleeq",
    fontUrl: `${MUSHAF_FONT_CDN}/hafs/nastaleeq/indopak/indopak-nastaleeq-waqf-lazim-v4.2.1.woff2`,
  },
  {
    id: "indopak_16",
    label: { ar: "المصحف الهندي الباكستاني (١٦ سطرًا)", en: "IndoPak, 16 lines" },
    mushafId: 7, lines: 16, pages: 548,
    glyph: "textIndopak", fontKind: "static-font", fontFamily: "indopak-nastaleeq",
    fontUrl: `${MUSHAF_FONT_CDN}/hafs/nastaleeq/indopak/indopak-nastaleeq-waqf-lazim-v4.2.1.woff2`,
  },
];

export const DEFAULT_MUSHAF_LAYOUT = "madani_v2";

export const mushafLayoutById = (id: string): MushafLayout =>
  MUSHAF_LAYOUTS.find((l) => l.id === id) ?? MUSHAF_LAYOUTS[0];

export const pageFontUrl = (layout: MushafLayout, page: number): string => layout.fontUrl.replace("{page}", String(page));

export const pageFontFamily = (layout: MushafLayout, page: number): string =>
  layout.fontKind === "page-font" ? `${layout.fontFamily}-p${page}` : layout.fontFamily;

export interface MushafWord {
  verseKey: string;
  position: number;
  /** Glyph or text to render in the layout's font. */
  glyph: string;
  /** Plain Uthmani text, for accessibility, copy and fallback. */
  text: string;
  isEndMarker: boolean; // ayah number marker
  line: number;
}

export interface MushafLine {
  number: number;
  words: MushafWord[];
  /** Surah header line (name rendered separately) or Basmala line. */
  kind: "ayat" | "surah-header" | "basmala";
  surahNumber?: number;
}

export interface MushafPage {
  layoutId: string;
  page: number;
  lines: MushafLine[];
  /** Surahs whose ayat appear on this page, in order. */
  surahs: { number: number; nameArabic: string; firstVerseKey: string }[];
  juz: number | null;
  hizb: number | null;
  fontFamily: string;
  fontUrl: string;
}

export interface MushafVerseInput {
  verseKey: string;
  words: { position: number; charTypeName?: string; lineNumber: number; glyph: string; text: string }[];
}

/**
 * Group words into the page's lines. The API's line numbers already reserve
 * the printed header line (and the Basmala line) at the start of a surah, so
 * lines with no words directly above a surah's first line are labelled as
 * header / basmala instead of left blank.
 */
export const buildMushafLines = (
  layout: MushafLayout,
  verses: MushafVerseInput[],
  surahStarts: Map<string, { number: number; hasBasmala: boolean }>,
): MushafLine[] => {
  const byLine = new Map<number, MushafWord[]>();
  const special = new Map<number, { kind: "surah-header" | "basmala"; surahNumber: number }>();
  for (const v of verses) {
    for (const w of v.words) {
      const list = byLine.get(w.lineNumber) ?? [];
      list.push({ verseKey: v.verseKey, position: w.position, glyph: w.glyph, text: w.text, isEndMarker: (w.charTypeName ?? "word") === "end", line: w.lineNumber });
      byLine.set(w.lineNumber, list);
    }
    const start = surahStarts.get(v.verseKey);
    const firstLine = v.words[0]?.lineNumber;
    if (start && firstLine) {
      if (start.hasBasmala) {
        special.set(firstLine - 1, { kind: "basmala", surahNumber: start.number });
        special.set(firstLine - 2, { kind: "surah-header", surahNumber: start.number });
      } else {
        special.set(firstLine - 1, { kind: "surah-header", surahNumber: start.number });
      }
    }
  }
  const maxLine = Math.max(layout.lines, ...byLine.keys());
  const lines: MushafLine[] = [];
  for (let n = 1; n <= maxLine; n += 1) {
    const words = byLine.get(n) ?? [];
    const sp = !words.length ? special.get(n) : undefined;
    lines.push({ number: n, words, kind: sp?.kind ?? "ayat", surahNumber: sp?.surahNumber });
  }
  return lines;
};
