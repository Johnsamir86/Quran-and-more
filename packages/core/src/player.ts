/**
 * Unified Quran player: one screen for listening, reading, translation and
 * tafsir, with reciter switching. Pure logic shared by web and mobile.
 *
 * Model (inspired by the Telfaz "Quran" module, rebuilt on our backend):
 *  - A surah is loaded as an ordered list of segments: an optional Basmala
 *    segment followed by one segment per ayah. Each segment has verbatim
 *    Arabic text, an optional translation, and an audio URL for the chosen
 *    reciter. The audio playlist is the segment list, so the highlighted
 *    text and the audio are always the same index.
 *  - Switching reciter or translation reloads segments but keeps the index.
 *  - Auto-advance moves to the next surah when the last segment ends.
 *  - Resume remembers surah + segment index.
 */

export type PlayerStatus = "idle" | "loading" | "ready" | "ended" | "network_error" | "unavailable";

export type PlayerPanel = "surahs" | "reciter" | "translation" | "tafsir" | "settings" | null;

export type TextSize = "small" | "medium" | "large";

export const TEXT_SIZE_SCALE: Record<TextSize, number> = { small: 0.82, medium: 1, large: 1.16 };

export interface PlayerSurah {
  number: number;
  arabicName: string;
  latinName: string;
  verseCount: number;
  hasBismillah: boolean;
}

export interface PlayerReciter {
  id: number;
  arabicName: string;
  latinName: string;
  riwayah: string;
  style: string | null;
  imageUrl: string | null;
  gender: "male" | "female";
}

export interface PlayerTranslation {
  /** "none" or the resource id as string */
  id: string;
  apiId: number | null;
  label: string;
  languageName: string;
  languageKey: string;
}

export const NO_TRANSLATION: PlayerTranslation = {
  id: "none",
  apiId: null,
  label: "بدون ترجمة",
  languageName: "",
  languageKey: "",
};

export interface PlayerAyah {
  number: number;
  key: string; // "2:255"
  arabic: string;
  translation: string | null;
  audioUrl: string | null;
  durationMs: number;
}

export interface PlayerSegment {
  key: string; // "basmala" | verse key
  ayah: PlayerAyah | null; // null for Basmala
  arabic: string;
  translation: string | null;
  audioUrl: string | null;
  durationMs: number;
}

export const BASMALA_TEXT = "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ";

/**
 * Build the playable segment list for a surah. The Basmala segment (audio of
 * 1:1 from the same reciter) is prepended for every surah except Al-Fatihah
 * (where 1:1 is itself an ayah) and At-Tawbah (no Basmala).
 */
export const buildSegments = (
  surah: PlayerSurah,
  ayahs: PlayerAyah[],
  basmala: PlayerAyah | null,
): PlayerSegment[] => {
  const segments: PlayerSegment[] = [];
  if (surah.hasBismillah && surah.number !== 1 && surah.number !== 9 && basmala) {
    segments.push({
      key: "basmala",
      ayah: null,
      arabic: basmala.arabic || BASMALA_TEXT,
      translation: null,
      audioUrl: basmala.audioUrl,
      durationMs: basmala.durationMs,
    });
  }
  for (const ayah of ayahs) {
    segments.push({
      key: ayah.key,
      ayah,
      arabic: ayah.arabic,
      translation: ayah.translation,
      audioUrl: ayah.audioUrl,
      durationMs: ayah.durationMs,
    });
  }
  return segments;
};

export interface PlayerState {
  surah: PlayerSurah | null;
  segments: PlayerSegment[];
  index: number;
  status: PlayerStatus;
  isPlaying: boolean;
  reciter: PlayerReciter | null;
  translation: PlayerTranslation;
  textSize: TextSize;
  autoAdvance: boolean;
  motion: boolean; // auto-scroll / animations
  panel: PlayerPanel;
  tafsir: { key: string; text: string } | null;
  tafsirLoading: boolean;
  resume: { surahNumber: number; segment: number } | null;
}

export const initialPlayerState = (overrides: Partial<PlayerState> = {}): PlayerState => ({
  surah: null,
  segments: [],
  index: 0,
  status: "idle",
  isPlaying: false,
  reciter: null,
  translation: NO_TRANSLATION,
  textSize: "medium",
  autoAdvance: true,
  motion: true,
  panel: null,
  tafsir: null,
  tafsirLoading: false,
  resume: null,
  ...overrides,
});

export type PlayerAction =
  | { type: "open"; surah: PlayerSurah; index?: number; play?: boolean }
  | { type: "loaded"; segments: PlayerSegment[] }
  | { type: "failed"; status: Extract<PlayerStatus, "network_error" | "unavailable"> }
  | { type: "seek"; index: number }
  | { type: "next" }
  | { type: "prev" }
  | { type: "ended" }
  | { type: "play" }
  | { type: "pause" }
  | { type: "toggle" }
  | { type: "reciter"; reciter: PlayerReciter }
  | { type: "translation"; translation: PlayerTranslation }
  | { type: "textSize"; size: TextSize }
  | { type: "autoAdvance"; value: boolean }
  | { type: "motion"; value: boolean }
  | { type: "panel"; panel: PlayerPanel }
  | { type: "tafsirLoading" }
  | { type: "tafsir"; key: string; text: string | null };

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

export const playerReducer = (state: PlayerState, action: PlayerAction): PlayerState => {
  switch (action.type) {
    case "open":
      return {
        ...state,
        surah: action.surah,
        segments: [],
        index: action.index ?? 0,
        status: "loading",
        isPlaying: action.play ?? state.isPlaying,
        tafsir: null,
        panel: state.panel === "surahs" ? null : state.panel,
      };
    case "loaded": {
      const index = clamp(state.index, 0, Math.max(0, action.segments.length - 1));
      return {
        ...state,
        segments: action.segments,
        index,
        status: action.segments.length ? "ready" : "unavailable",
        resume: state.surah ? { surahNumber: state.surah.number, segment: index } : state.resume,
      };
    }
    case "failed":
      return { ...state, status: action.status, isPlaying: false };
    case "seek": {
      if (!state.segments.length) return state;
      const index = clamp(action.index, 0, state.segments.length - 1);
      return {
        ...state,
        index,
        status: state.status === "ended" ? "ready" : state.status,
        tafsir: state.tafsir?.key === state.segments[index]?.key ? state.tafsir : null,
        resume: state.surah ? { surahNumber: state.surah.number, segment: index } : state.resume,
      };
    }
    case "next":
      return playerReducer(state, { type: "seek", index: state.index + 1 });
    case "prev":
      return playerReducer(state, { type: "seek", index: state.index - 1 });
    case "ended":
      // The host decides whether to open the next surah (autoAdvance).
      return { ...state, status: "ended", isPlaying: false };
    case "play":
      return { ...state, isPlaying: true, status: state.status === "ended" ? "ready" : state.status };
    case "pause":
      return { ...state, isPlaying: false };
    case "toggle":
      return playerReducer(state, { type: state.isPlaying ? "pause" : "play" });
    case "reciter":
      return state.reciter?.id === action.reciter.id ? state : { ...state, reciter: action.reciter, panel: null };
    case "translation":
      return state.translation.id === action.translation.id ? state : { ...state, translation: action.translation, panel: null };
    case "textSize":
      return { ...state, textSize: action.size };
    case "autoAdvance":
      return { ...state, autoAdvance: action.value };
    case "motion":
      return { ...state, motion: action.value };
    case "panel":
      return { ...state, panel: state.panel === action.panel ? null : action.panel };
    case "tafsirLoading":
      return { ...state, tafsirLoading: true };
    case "tafsir":
      return { ...state, tafsirLoading: false, tafsir: action.text ? { key: action.key, text: action.text } : null };
    default:
      return state;
  }
};

export const currentSegment = (state: PlayerState): PlayerSegment | null => state.segments[state.index] ?? null;

export const isLastSegment = (state: PlayerState): boolean =>
  state.segments.length > 0 && state.index === state.segments.length - 1;

/** Next surah number for auto-advance, wrapping 114 -> 1. */
export const nextSurahNumber = (current: number): number => (current >= 114 ? 1 : current + 1);

/** Strip HTML (tafsir and translation bodies arrive as HTML) and footnote markers. */
export const stripHtml = (html: string): string =>
  html
    .replace(/<sup[^>]*>[\s\S]*?<\/sup>/g, "")
    .replace(/<\/(p|div|h[1-6]|li|blockquote|tr)>|<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/[ \t]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .trim();

/** Storage keys for persisted player preferences. */
export const PLAYER_STORAGE_KEYS = {
  reciter: "qam.player.reciter",
  translation: "qam.player.translation",
  textSize: "qam.player.textSize",
  autoAdvance: "qam.player.autoAdvance",
  motion: "qam.player.motion",
  resume: "qam.player.resume",
} as const;
