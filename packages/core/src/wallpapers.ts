/**
 * Wallpapers for the player's focus view. Three families:
 *  - "art": procedural Islamic geometric patterns (rendered as inline SVG by the app)
 *  - "live": animated, interactive backgrounds (canvas) that respond to playback
 *  - "nature": photographs. The curated set is hot-linked from Unsplash's CDN
 *    (Unsplash License: free to use, attribution appreciated). When a Pexels
 *    API key is configured the backend adds internet search results per theme.
 * Every surah maps to a theme so the wallpaper changes with the surah.
 */
export type WallpaperKind = "art" | "live" | "nature" | "plain";

export type WallpaperTheme =
  | "light" | "dawn" | "night" | "stars" | "sea" | "mountains" | "forest" | "garden" | "desert"
  | "sky" | "rain" | "snow" | "mosque" | "fields" | "lake";

export interface Wallpaper {
  id: string;
  kind: WallpaperKind;
  title: { ar: string; en: string };
  theme: WallpaperTheme;
  /** nature only */
  url?: string;
  credit?: string;
  /** art/live only: palette seed */
  colors?: [string, string, string];
  /** Preferred text colour over this wallpaper. */
  tone: "dark" | "light";
}

const u = (id: string) => `https://images.unsplash.com/photo-${id}?w=1920&q=80&auto=format&fit=crop`;

export const NATURE_WALLPAPERS: Wallpaper[] = [
  { id: "n-mountain-lake", kind: "nature", theme: "lake", title: { ar: "بحيرة جبلية", en: "Mountain lake" }, url: u("1506905925346-21bda4d32df4"), credit: "Unsplash", tone: "light" },
  { id: "n-foggy-forest", kind: "nature", theme: "forest", title: { ar: "غابة ضبابية", en: "Foggy forest" }, url: u("1470071459604-3b5ec3a7fe05"), credit: "Unsplash", tone: "light" },
  { id: "n-beach", kind: "nature", theme: "sea", title: { ar: "شاطئ", en: "Beach" }, url: u("1507525428034-b723cf961d3e"), credit: "Unsplash", tone: "dark" },
  { id: "n-earth", kind: "nature", theme: "stars", title: { ar: "الأرض من الفضاء", en: "Earth from space" }, url: u("1446776811953-b23d57bd21aa"), credit: "Unsplash", tone: "light" },
  { id: "n-milkyway", kind: "nature", theme: "stars", title: { ar: "درب التبّانة", en: "Milky Way" }, url: u("1419242902214-272b3f66ee7a"), credit: "Unsplash", tone: "light" },
  { id: "n-peaks", kind: "nature", theme: "mountains", title: { ar: "قمم", en: "Peaks" }, url: u("1500530855697-b586d89ba3ee"), credit: "Unsplash", tone: "light" },
  { id: "n-forest-road", kind: "nature", theme: "forest", title: { ar: "طريق الغابة", en: "Forest road" }, url: u("1441974231531-c6227db76b6e"), credit: "Unsplash", tone: "light" },
  { id: "n-field", kind: "nature", theme: "fields", title: { ar: "حقول", en: "Fields" }, url: u("1472214103451-9374bd1c798e"), credit: "Unsplash", tone: "dark" },
  { id: "n-waves", kind: "nature", theme: "sea", title: { ar: "أمواج", en: "Waves" }, url: u("1518837695005-2083093ee35b"), credit: "Unsplash", tone: "light" },
  { id: "n-lake-sunset", kind: "nature", theme: "dawn", title: { ar: "غروب على البحيرة", en: "Lake sunset" }, url: u("1476610182048-b716b8518aae"), credit: "Unsplash", tone: "light" },
  { id: "n-night-sky", kind: "nature", theme: "night", title: { ar: "سماء الليل", en: "Night sky" }, url: u("1444703686981-a3abbc4d4fe3"), credit: "Unsplash", tone: "light" },
  { id: "n-alpine", kind: "nature", theme: "lake", title: { ar: "بحيرة ألبية", en: "Alpine lake" }, url: u("1501785888041-af3ef285b470"), credit: "Unsplash", tone: "light" },
  { id: "n-sunset-hills", kind: "nature", theme: "dawn", title: { ar: "تلال الغروب", en: "Sunset hills" }, url: u("1469474968028-56623f02e42e"), credit: "Unsplash", tone: "light" },
  { id: "n-sunlit-forest", kind: "nature", theme: "light", title: { ar: "غابة مضيئة", en: "Sunlit forest" }, url: u("1447752875215-b2761acb3c5d"), credit: "Unsplash", tone: "light" },
  { id: "n-snow-forest", kind: "nature", theme: "snow", title: { ar: "غابة ثلجية", en: "Snowy forest" }, url: u("1473580044384-7ba9967e16a0"), credit: "Unsplash", tone: "dark" },
  { id: "n-flowers", kind: "nature", theme: "garden", title: { ar: "زهور", en: "Flowers" }, url: u("1490750967868-88aa4486c946"), credit: "Unsplash", tone: "dark" },
  { id: "n-desert", kind: "nature", theme: "desert", title: { ar: "صحراء", en: "Desert" }, url: u("1482192596544-9eb780fc7f66"), credit: "Unsplash", tone: "dark" },
  { id: "n-dunes", kind: "nature", theme: "desert", title: { ar: "كثبان", en: "Dunes" }, url: u("1509316785289-025f5b846b35"), credit: "Unsplash", tone: "dark" },
  { id: "n-mountains", kind: "nature", theme: "mountains", title: { ar: "جبال", en: "Mountains" }, url: u("1464822759023-fed622ff2c3b"), credit: "Unsplash", tone: "light" },
  { id: "n-ocean", kind: "nature", theme: "sea", title: { ar: "محيط", en: "Ocean" }, url: u("1505118380757-91f5f5632de0"), credit: "Unsplash", tone: "light" },
  { id: "n-mosque", kind: "nature", theme: "mosque", title: { ar: "مسجد", en: "Mosque" }, url: u("1564769625905-50e93615e769"), credit: "Unsplash", tone: "light" },
  { id: "n-mosque-dome", kind: "nature", theme: "mosque", title: { ar: "قبة", en: "Dome" }, url: u("1542816417-0983c9c9ad53"), credit: "Unsplash", tone: "light" },
  { id: "n-mosque-interior", kind: "nature", theme: "mosque", title: { ar: "من الداخل", en: "Mosque interior" }, url: u("1591604129939-f1efa4d9f7fa"), credit: "Unsplash", tone: "light" },
  { id: "n-starry-mountain", kind: "nature", theme: "stars", title: { ar: "نجوم فوق الجبل", en: "Stars over the mountain" }, url: u("1519681393784-d120267933ba"), credit: "Unsplash", tone: "light" },
  { id: "n-rain", kind: "nature", theme: "rain", title: { ar: "مطر", en: "Rain" }, url: u("1470252649378-9c29740c9fa8"), credit: "Unsplash", tone: "light" },
  { id: "n-sea-cliff", kind: "nature", theme: "sea", title: { ar: "جرف بحري", en: "Sea cliff" }, url: u("1502082553048-f009c37129b9"), credit: "Unsplash", tone: "light" },
  { id: "n-leaves", kind: "nature", theme: "garden", title: { ar: "أوراق", en: "Leaves" }, url: u("1433086966358-54859d0ed716"), credit: "Unsplash", tone: "dark" },
  { id: "n-valley", kind: "nature", theme: "mountains", title: { ar: "وادٍ", en: "Valley" }, url: u("1475924156734-496f6cac6ec1"), credit: "Unsplash", tone: "light" },
  { id: "n-clouds", kind: "nature", theme: "sky", title: { ar: "غيوم", en: "Clouds" }, url: u("1511884642898-4c92249e20b6"), credit: "Unsplash", tone: "dark" },
  { id: "n-calm-lake", kind: "nature", theme: "lake", title: { ar: "بحيرة هادئة", en: "Calm lake" }, url: u("1439066615861-d1af74d74000"), credit: "Unsplash", tone: "light" },
];

export const ART_WALLPAPERS: Wallpaper[] = [
  { id: "a-star8-emerald", kind: "art", theme: "light", title: { ar: "نجمة ثمانية زمرّدية", en: "Eight-point star, emerald" }, colors: ["#0f3d2e", "#1d9e75", "#e9d8a6"], tone: "light" },
  { id: "a-girih-night", kind: "art", theme: "night", title: { ar: "زخرفة ليلية", en: "Girih, night" }, colors: ["#0b1026", "#2b3a8a", "#c9a227"], tone: "light" },
  { id: "a-tile-andalus", kind: "art", theme: "garden", title: { ar: "بلاط أندلسي", en: "Andalusian tiles" }, colors: ["#143d59", "#f4b41a", "#f7f3e8"], tone: "light" },
  { id: "a-arabesque-sand", kind: "art", theme: "desert", title: { ar: "أرابيسك رملي", en: "Arabesque, sand" }, colors: ["#5b3a1e", "#c88d4b", "#f3e5c8"], tone: "light" },
  { id: "a-lattice-pearl", kind: "art", theme: "sea", title: { ar: "مشربية لؤلؤية", en: "Lattice, pearl" }, colors: ["#f6f3ea", "#9fb0a7", "#1d9e75"], tone: "dark" },
  { id: "a-hex-rose", kind: "art", theme: "dawn", title: { ar: "سداسيات وردية", en: "Hexagons, rose" }, colors: ["#3a1020", "#b23a5a", "#f6c7b6"], tone: "light" },
];

export const LIVE_WALLPAPERS: Wallpaper[] = [
  { id: "l-aurora", kind: "live", theme: "night", title: { ar: "شفق متموّج", en: "Aurora" }, colors: ["#07131f", "#1d9e75", "#5ad4ff"], tone: "light" },
  { id: "l-stars", kind: "live", theme: "stars", title: { ar: "نجوم تتنفّس", en: "Breathing stars" }, colors: ["#050816", "#ffffff", "#c9a227"], tone: "light" },
  { id: "l-waves", kind: "live", theme: "sea", title: { ar: "أمواج هادئة", en: "Calm waves" }, colors: ["#032b3a", "#0f7f8a", "#bfe9f0"], tone: "light" },
  { id: "l-dawn", kind: "live", theme: "dawn", title: { ar: "فجر", en: "Dawn" }, colors: ["#2b1b3d", "#e9a86b", "#fff3d6"], tone: "dark" },
];

export const PLAIN_WALLPAPERS: Wallpaper[] = [
  { id: "p-paper", kind: "plain", theme: "light", title: { ar: "ورق", en: "Paper" }, colors: ["#f6f3ea", "#fffdf7", "#1d9e75"], tone: "dark" },
  { id: "p-night", kind: "plain", theme: "night", title: { ar: "ليل", en: "Night" }, colors: ["#0d1512", "#13201b", "#1d9e75"], tone: "light" },
];

export const WALLPAPERS: Wallpaper[] = [...PLAIN_WALLPAPERS, ...LIVE_WALLPAPERS, ...ART_WALLPAPERS, ...NATURE_WALLPAPERS];

export const wallpaperById = (id: string): Wallpaper | undefined => WALLPAPERS.find((w) => w.id === id);

/** Theme per surah, from the surah's dominant imagery; the rest rotate by juz. */
const SURAH_THEMES: Record<number, WallpaperTheme> = {
  1: "light", 2: "fields", 3: "mountains", 6: "fields", 7: "mountains", 10: "sea", 11: "rain", 12: "desert", 13: "rain",
  14: "mosque", 16: "garden", 17: "night", 18: "mountains", 19: "garden", 20: "desert", 21: "sky", 24: "light", 25: "sky",
  27: "garden", 30: "dawn", 31: "sea", 34: "mountains", 35: "sky", 36: "night", 37: "stars", 41: "sky", 42: "sea", 44: "night",
  48: "mosque", 50: "garden", 51: "sky", 52: "mountains", 53: "stars", 54: "night", 55: "sea", 56: "garden", 57: "light",
  62: "mosque", 65: "light", 67: "stars", 69: "sky", 71: "rain", 73: "night", 74: "dawn", 75: "night", 76: "garden", 77: "sky",
  78: "mountains", 79: "sky", 81: "stars", 82: "sky", 84: "dawn", 85: "stars", 86: "stars", 88: "sky", 89: "dawn", 90: "mosque",
  91: "dawn", 92: "night", 93: "dawn", 94: "light", 95: "garden", 96: "light", 97: "night", 99: "mountains", 103: "dawn",
  105: "desert", 106: "desert", 108: "lake", 110: "mosque", 112: "light", 113: "dawn", 114: "light",
};
const ROTATION: WallpaperTheme[] = ["light", "mountains", "sea", "forest", "garden", "sky", "lake", "dawn", "fields", "desert", "stars", "night"];

export const themeForSurah = (surah: number): WallpaperTheme => SURAH_THEMES[surah] ?? ROTATION[surah % ROTATION.length];

/** Pick a wallpaper of the requested family that matches the surah's theme (deterministic per surah). */
export const wallpaperForSurah = (surah: number, kind: Exclude<WallpaperKind, "plain"> = "nature"): Wallpaper => {
  const theme = themeForSurah(surah);
  const pool = WALLPAPERS.filter((w) => w.kind === kind);
  const matches = pool.filter((w) => w.theme === theme);
  const list = matches.length ? matches : pool;
  return list[surah % list.length];
};

export type WallpaperMode = "auto-nature" | "auto-art" | "auto-live" | "fixed" | "plain";

export const WALLPAPER_STORAGE_KEY = "qam.player.wallpaper";
