import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

import { contentGet } from "@/lib/content";
import { defaultTranslationFor } from "@/lib/search-api";

export const dynamic = "force-dynamic";

const fontCache = new Map<string, Promise<ArrayBuffer | null>>();
const loadFont = (url: string) => {
  if (!fontCache.has(url)) fontCache.set(url, fetch(url).then(async (r) => (r.ok ? r.arrayBuffer() : null)).catch(() => null));
  return fontCache.get(url)!;
};
// satori needs TTF/OTF/WOFF (not woff2). It also cannot shape Arabic (no HarfBuzz), so the
// ayah itself is composed from Quran.com's per-word glyph images; the font only draws Latin.
const LATIN_FONT = "https://cdn.jsdelivr.net/npm/@fontsource/noto-sans@5.2.5/files/noto-sans-latin-400-normal.woff";
const WORD_IMAGE = (c: string, v: string, w: number) => `https://static.qurancdn.com/images/w/rq-color/${c}/${v}/${w}.png`;

const imageCache = new Map<string, Promise<{ dataUrl: string; width: number; height: number } | null>>();
const loadWordImage = (url: string) => {
  if (!imageCache.has(url)) {
    imageCache.set(url, fetch(url).then(async (r) => {
      if (!r.ok) return null;
      const buf = Buffer.from(await r.arrayBuffer());
      if (buf.length < 24) return null;
      // The CDN labels these image/png but serves GIF; read the real signature.
      if (buf.toString("ascii", 1, 4) === "PNG") return { dataUrl: `data:image/png;base64,${buf.toString("base64")}`, width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
      if (buf.toString("ascii", 0, 3) === "GIF") return { dataUrl: `data:image/gif;base64,${buf.toString("base64")}`, width: buf.readUInt16LE(6), height: buf.readUInt16LE(8) };
      return null;
    }).catch(() => null));
    if (imageCache.size > 5000) imageCache.delete(imageCache.keys().next().value!);
  }
  return imageCache.get(url)!;
};

/** GET /api/og/2:255?language=en -> 1200x630 share card: the ayah as Quran.com word glyphs plus a translation. */
export async function GET(request: NextRequest, context: { params: Promise<{ verseKey: string }> }) {
  const { verseKey } = await context.params;
  const key = decodeURIComponent(verseKey);
  if (!/^\d{1,3}:\d{1,3}$/.test(key)) return new Response("bad key", { status: 400 });
  const language = request.nextUrl.searchParams.get("language") ?? "en";
  const [c, n] = key.split(":");
  const [raw, chapterRaw, latinFont] = await Promise.all([
    contentGet(`verses/by_key/${key}`, { words: true, fields: "text_uthmani", translations: await defaultTranslationFor(language), translation_fields: "resource_name" }, 24 * 3600 * 1000) as Promise<{ verse?: { textUthmani?: string; words?: { position: number; charTypeName?: string }[]; translations?: { text?: string; resourceName?: string }[] } }>,
    contentGet(`chapters/${c}`, { language: "en" }, 24 * 3600 * 1000) as Promise<{ chapter?: { nameSimple?: string; translatedName?: { name?: string } } }>,
    loadFont(LATIN_FONT),
  ]);
  const positions = (raw.verse?.words ?? []).filter((w) => (w.charTypeName ?? "word") === "word").map((w) => w.position);
  const images = (await Promise.all(positions.map((pos) => loadWordImage(WORD_IMAGE(c, n, pos))))).filter((i): i is NonNullable<typeof i> => !!i);
  const translation = (raw.verse?.translations?.[0]?.text ?? "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  const trLine = translation ? (translation.length > 260 ? `${translation.slice(0, 260)}...` : translation).replace(/[^\x20-\x7E\u00A0-\u024F]/g, "'") : "";
  const latin = chapterRaw.chapter?.nameSimple ?? `Surah ${c}`;
  const meaning = chapterRaw.chapter?.translatedName?.name ?? "";
  const footer = `${latin}${meaning ? ` (${meaning})` : ""} ${key} - Quran and More`;
  const fonts = latinFont ? [{ name: "Latin", data: latinFont, style: "normal" as const }] : [];
  // Glyph height scales with word count so long ayat still fit the card.
  const h = images.length > 45 ? 44 : images.length > 30 ? 50 : images.length > 18 ? 58 : images.length > 8 ? 68 : 84;
  return new ImageResponse(
    (
      <div style={{ width: 1200, height: 630, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: 48, background: "linear-gradient(160deg,#0d1512 0%,#13302a 60%,#1d9e75 160%)", color: "#f7f5ee", fontFamily: "Latin" }}>
        <div style={{ display: "flex", flexDirection: "row-reverse", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: Math.round(h * 0.22), padding: "28px 36px", borderRadius: 28, background: "#fbf7ec", maxWidth: 1104, maxHeight: 470, overflow: "hidden" }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- satori image node, not a DOM image */}
          {images.map((img, i) => <img key={i} src={img.dataUrl} width={Math.round((img.width * h) / img.height)} height={h} alt="" />)}
          <div style={{ display: "flex", color: "#1d9e75", fontSize: Math.round(h * 0.5), padding: "0 10px" }}>({n})</div>
        </div>
        {trLine ? <div style={{ display: "flex", fontSize: trLine.length > 180 ? 22 : 27, lineHeight: 1.4, textAlign: "center", opacity: 0.9, marginTop: 22, maxWidth: 1040 }}>{trLine}</div> : null}
        <div style={{ display: "flex", position: "absolute", bottom: 28, fontSize: 22, opacity: 0.8 }}>{footer}</div>
      </div>
    ),
    { width: 1200, height: 630, fonts, headers: { "cache-control": "public, s-maxage=86400, stale-while-revalidate=604800", "netlify-vary": "query" } },
  );
}
