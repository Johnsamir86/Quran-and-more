import type { NextRequest } from "next/server";

import { WALLPAPERS, themeForSurah, type Wallpaper, type WallpaperTheme } from "@qam/core";

import { publicError, publicJson } from "@/lib/public-api";

export const dynamic = "force-dynamic";

const PEXELS_QUERY: Record<WallpaperTheme, string> = {
  light: "sunlight rays", dawn: "sunrise landscape", night: "night landscape", stars: "milky way stars", sea: "ocean waves",
  mountains: "mountains landscape", forest: "forest", garden: "flowers garden", desert: "desert dunes", sky: "sky clouds",
  rain: "rain nature", snow: "snow landscape", mosque: "mosque architecture", fields: "green fields", lake: "calm lake",
};

/**
 * GET /api/public/v1/wallpapers?surah=18            curated set for the surah's theme
 * GET /api/public/v1/wallpapers?theme=sea&source=pexels   adds internet results when PEXELS_API_KEY is set
 */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const surah = Number.parseInt(sp.get("surah") ?? "", 10);
  const theme = (sp.get("theme") as WallpaperTheme | null) ?? (Number.isInteger(surah) ? themeForSurah(surah) : null);
  const kind = sp.get("kind");
  let items: Wallpaper[] = WALLPAPERS.filter((w) => (!kind || w.kind === kind) && (!theme || w.theme === theme || w.kind !== "nature"));

  const wantInternet = sp.get("source") === "pexels" || sp.get("source") === "all";
  const key = process.env.PEXELS_API_KEY;
  let internet: Wallpaper[] = [];
  if (wantInternet && key && theme) {
    try {
      const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(PEXELS_QUERY[theme])}&orientation=landscape&per_page=12`, { headers: { Authorization: key }, next: { revalidate: 86400 } });
      if (res.ok) {
        const data = (await res.json()) as { photos: { id: number; src: { large2x: string }; photographer: string; avg_color?: string }[] };
        internet = data.photos.map((p) => ({ id: `px-${p.id}`, kind: "nature", theme, title: { ar: p.photographer, en: p.photographer }, url: p.src.large2x, credit: `${p.photographer} · Pexels`, tone: "light" }));
      }
    } catch { /* ignore internet failures; curated set still returns */ }
  }
  if (!items.length && !internet.length) return publicError("no wallpapers", 404);
  items = [...items, ...internet];
  return publicJson({ theme, internetEnabled: Boolean(key), wallpapers: items }, { maxAgeSeconds: 86400 });
}
