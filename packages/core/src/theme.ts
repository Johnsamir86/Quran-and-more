/**
 * Brand themes. Four selectable looks, each with a light and a dark variant,
 * shared by web (CSS variables) and mobile (palette object). Every pair that
 * carries text is checked for WCAG AA contrast in theme.test.ts.
 */
export type ThemeId = "serene" | "classic" | "night" | "warm";

export interface ThemeTokens {
  /** page background */
  bg: string;
  /** raised surface (cards, sheets) */
  card: string;
  /** second surface level (inputs, chips) */
  surface: string;
  /** primary text */
  ink: string;
  /** secondary text */
  muted: string;
  /** hairlines */
  line: string;
  /** brand action colour (buttons, active tab, links) */
  accent: string;
  /** text on accent */
  onAccent: string;
  /** tinted accent background (selected chips, highlights) */
  accentSoft: string;
  /** secondary brand colour (gold, sage, teal) for ornaments and progress */
  accent2: string;
  ok: string;
  warn: string;
  bad: string;
  /** background behind the Arabic text plate in the player */
  plate: string;
  /** tab bar / nav background */
  nav: string;
}

export interface Theme {
  id: ThemeId;
  name: { en: string; ar: string };
  tagline: { en: string; ar: string };
  /** Arabic display face preference; the app falls back to the system Naskh. */
  arabicFont: "naskh" | "amiri" | "kufi";
  /** corner radius scale, px */
  radius: { sm: number; md: number; lg: number; pill: number };
  light: ThemeTokens;
  dark: ThemeTokens;
}

export const THEMES: Record<ThemeId, Theme> = {
  serene: {
    id: "serene",
    name: { en: "Serene", ar: "سكينة" },
    tagline: { en: "Emerald and cream, calm and airy", ar: "زمرّدي وكريمي، هادئ ورحب" },
    arabicFont: "naskh",
    radius: { sm: 10, md: 16, lg: 22, pill: 999 },
    light: { bg: "#f6f3ea", card: "#fffdf7", surface: "#f0ece1", ink: "#15201b", muted: "#55625b", line: "rgba(21,32,27,0.12)", accent: "#14805f", onAccent: "#ffffff", accentSoft: "rgba(20,128,95,0.12)", accent2: "#b8893a", ok: "#15805f", warn: "#a86a12", bad: "#b3261e", plate: "rgba(255,253,247,0.72)", nav: "rgba(255,253,247,0.92)" },
    dark: { bg: "#0d1512", card: "#13201b", surface: "#192a24", ink: "#e9efea", muted: "#a3b3aa", line: "rgba(233,239,234,0.14)", accent: "#3dba91", onAccent: "#06211a", accentSoft: "rgba(61,186,145,0.18)", accent2: "#d8ad5c", ok: "#3dba91", warn: "#e0a84a", bad: "#f28b82", plate: "rgba(8,14,12,0.55)", nav: "rgba(13,21,18,0.92)" },
  },
  classic: {
    id: "classic",
    name: { en: "Classic", ar: "تراث" },
    tagline: { en: "Teal and gold on parchment, scholarly", ar: "فيروزي وذهبي على الرَّق، عِلمي" },
    arabicFont: "amiri",
    radius: { sm: 6, md: 12, lg: 16, pill: 999 },
    light: { bg: "#f3eee1", card: "#fbf7ec", surface: "#ebe4d2", ink: "#1b2a2f", muted: "#55666b", line: "rgba(27,42,47,0.14)", accent: "#0f6a6e", onAccent: "#ffffff", accentSoft: "rgba(15,106,110,0.12)", accent2: "#a3782a", ok: "#2f7d4f", warn: "#9a6a12", bad: "#a8322a", plate: "rgba(251,247,236,0.78)", nav: "rgba(251,247,236,0.94)" },
    dark: { bg: "#0f1b1e", card: "#14262a", surface: "#1b3135", ink: "#ece6d6", muted: "#a9b5b4", line: "rgba(236,230,214,0.14)", accent: "#3fb0ad", onAccent: "#062224", accentSoft: "rgba(63,176,173,0.18)", accent2: "#d6b35e", ok: "#5cbf86", warn: "#e2b35a", bad: "#f0948c", plate: "rgba(8,16,18,0.55)", nav: "rgba(15,27,30,0.94)" },
  },
  night: {
    id: "night",
    name: { en: "Night", ar: "ليل" },
    tagline: { en: "Deep navy with glowing gold, immersive", ar: "كحلي عميق بذهب متوهّج، غامر" },
    arabicFont: "naskh",
    radius: { sm: 10, md: 16, lg: 24, pill: 999 },
    light: { bg: "#f2f1ec", card: "#ffffff", surface: "#e9e7df", ink: "#1a1b2e", muted: "#5a5c70", line: "rgba(26,27,46,0.12)", accent: "#7a5d14", onAccent: "#ffffff", accentSoft: "rgba(122,93,20,0.12)", accent2: "#2b3a73", ok: "#2f7d4f", warn: "#9a6a12", bad: "#b3261e", plate: "rgba(255,255,255,0.75)", nav: "rgba(255,255,255,0.94)" },
    dark: { bg: "#0b1020", card: "#121a33", surface: "#192345", ink: "#f1ecdd", muted: "#aeb3c8", line: "rgba(241,236,221,0.14)", accent: "#d9b24c", onAccent: "#1a1400", accentSoft: "rgba(217,178,76,0.18)", accent2: "#7f8fd6", ok: "#5cbf86", warn: "#e9b85a", bad: "#f28b82", plate: "rgba(6,9,20,0.6)", nav: "rgba(11,16,32,0.94)" },
  },
  warm: {
    id: "warm",
    name: { en: "Warm", ar: "دفء" },
    tagline: { en: "Sand, terracotta and sage, friendly for all ages", ar: "رملي وطيني وميرميّ، ودود لكل الأعمار" },
    arabicFont: "naskh",
    radius: { sm: 12, md: 18, lg: 26, pill: 999 },
    light: { bg: "#fbf4ec", card: "#fffaf4", surface: "#f3e8dc", ink: "#3a2a22", muted: "#71584b", line: "rgba(58,42,34,0.12)", accent: "#b4552f", onAccent: "#ffffff", accentSoft: "rgba(180,85,47,0.12)", accent2: "#6f8f62", ok: "#4f8a4a", warn: "#a86a12", bad: "#b3261e", plate: "rgba(255,250,244,0.78)", nav: "rgba(255,250,244,0.94)" },
    dark: { bg: "#1d1613", card: "#2a201b", surface: "#352922", ink: "#f6ebe2", muted: "#c6b1a3", line: "rgba(246,235,226,0.14)", accent: "#ec936a", onAccent: "#2a1208", accentSoft: "rgba(236,147,106,0.18)", accent2: "#9dbb8f", ok: "#7fc27a", warn: "#e9b85a", bad: "#f28b82", plate: "rgba(20,12,9,0.55)", nav: "rgba(29,22,19,0.94)" },
  },
};

export const THEME_IDS = Object.keys(THEMES) as ThemeId[];
export const DEFAULT_THEME: ThemeId = "serene";
export const THEME_STORAGE_KEY = "qam.theme.v1";
export type ColorScheme = "light" | "dark";
export type SchemePreference = ColorScheme | "system";
export const SCHEME_STORAGE_KEY = "qam.scheme.v1";

export const isThemeId = (v: unknown): v is ThemeId => typeof v === "string" && (THEME_IDS as string[]).includes(v);

export const themeTokens = (id: ThemeId, scheme: ColorScheme): ThemeTokens => (THEMES[id] ?? THEMES[DEFAULT_THEME])[scheme];

/** CSS custom properties for the web (`--bg`, `--card`, …) plus radius variables. */
export const themeCssVars = (id: ThemeId, scheme: ColorScheme): Record<string, string> => {
  const t = THEMES[id] ?? THEMES[DEFAULT_THEME];
  const k = t[scheme];
  const vars: Record<string, string> = {};
  for (const [name, value] of Object.entries(k)) vars[`--${name}`] = value;
  vars["--r-sm"] = `${t.radius.sm}px`;
  vars["--r-md"] = `${t.radius.md}px`;
  vars["--r-lg"] = `${t.radius.lg}px`;
  vars["--r-pill"] = `${t.radius.pill}px`;
  return vars;
};

// ---- contrast helpers (used by tests and by the theme picker preview) ----
const channel = (c: number) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
export const hexToRgb = (hex: string): [number, number, number] => {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((x) => x + x).join("") : h;
  const n = parseInt(full.slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
export const luminance = (hex: string): number => { const [r, g, b] = hexToRgb(hex); return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b); };
export const contrastRatio = (a: string, b: string): number => { const la = luminance(a), lb = luminance(b); const [hi, lo] = la > lb ? [la, lb] : [lb, la]; return (hi + 0.05) / (lo + 0.05); };
