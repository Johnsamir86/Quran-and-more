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
  /** Stable key for UI and persistence: "c<chapterReciterId>" or "a<recitationId>". */
  id: string;
  /** Full-surah (gapless) audio catalogue id, when available. */
  chapterReciterId: number | null;
  /** Ayah-by-ayah audio catalogue id, when available. */
  recitationId: number | null;
  arabicName: string;
  latinName: string;
  riwayah: string; // qira'at / riwayah label, e.g. "حفص عن عاصم"
  style: string | null; // murattal | mujawwad | muallim
  imageUrl: string | null;
  gender: "male" | "female";
  /** Set for reciters served outside the API catalogue (see extra-reciters.ts). */
  source?: "qf" | "quranicaudio";
  audioBase?: string;
  /** True when word-level timestamps exist for gapless playback. Unknown until a surah is loaded. */
  hasTimestamps?: boolean;
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

export interface PlayerWord {
  position: number; // 1-based position in the ayah
  text: string;
  translation?: string | null;
  transliteration?: string | null;
  audioUrl?: string | null;
}

/** [wordPosition, fromMs, toMs] in the timeline of the audio the segment plays from. */
export type WordTiming = [number, number, number];

export interface PlayerAyah {
  number: number;
  key: string; // "2:255"
  arabic: string;
  translation: string | null;
  words: PlayerWord[];
  /** Per-ayah audio file (ayah-by-ayah engine). */
  audioUrl: string | null;
  durationMs: number;
  /** Word timings relative to the per-ayah file. */
  ayahWordTimings: WordTiming[];
}

export interface PlayerSegment {
  key: string; // "basmala" | verse key
  ayah: PlayerAyah | null; // null for Basmala
  arabic: string;
  translation: string | null;
  words: PlayerWord[];
  /** Per-ayah file for the ayah-by-ayah engine. */
  audioUrl: string | null;
  durationMs: number;
  /** Position in the full-surah file (gapless engine). Null when the reciter has no timestamps. */
  fromMs: number | null;
  toMs: number | null;
  /** Word timings in the full-surah file timeline. */
  wordTimings: WordTiming[];
}

export interface ChapterAudioInfo {
  url: string;
  durationMs: number;
  /** True when every ayah has fromMs/toMs. */
  hasTimestamps: boolean;
}

export type AudioEngine = "gapless" | "ayah";

/** Pick the engine: gapless whenever the reciter's full-surah file has timestamps. */
export const chooseEngine = (chapterAudio: ChapterAudioInfo | null, segments: PlayerSegment[]): AudioEngine => {
  if (chapterAudio?.hasTimestamps) return "gapless";
  if (segments.some((s) => s.audioUrl)) return "ayah";
  return chapterAudio ? "gapless" : "ayah";
};

export const BASMALA_TEXT = "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ";

/**
 * Build the playable segment list for a surah. The Basmala segment (audio of
 * 1:1 from the same reciter) is prepended for every surah except Al-Fatihah
 * (where 1:1 is itself an ayah) and At-Tawbah (no Basmala).
 */
export interface ChapterTimestamp {
  verseKey: string;
  fromMs: number;
  toMs: number;
  /** [position, fromMs, toMs] absolute in the chapter file. Malformed entries are dropped. */
  words: WordTiming[];
}

export const buildSegments = (
  surah: PlayerSurah,
  ayahs: PlayerAyah[],
  basmala: PlayerAyah | null,
  timestamps: ChapterTimestamp[] = [],
): PlayerSegment[] => {
  const byKey = new Map(timestamps.map((t) => [t.verseKey, t]));
  const segments: PlayerSegment[] = [];
  const firstTs = timestamps[0];
  if (surah.hasBismillah && surah.number !== 1 && surah.number !== 9 && basmala) {
    // In a full-surah file the Basmala is recited before the first ayah. When the
    // first timestamp starts later than 0 the Basmala owns [0, firstFrom); when the
    // reciter's timestamps already start at 0 the Basmala is inside ayah 1's window,
    // so it gets a zero-length range and the gapless locator never lands on it.
    const hasTimeline = Boolean(firstTs);
    const basmalaTo = firstTs && firstTs.fromMs > 400 ? firstTs.fromMs : 0;
    segments.push({
      key: "basmala",
      ayah: null,
      arabic: basmala.arabic || BASMALA_TEXT,
      translation: null,
      words: basmala.words,
      audioUrl: basmala.audioUrl,
      durationMs: basmala.durationMs,
      fromMs: hasTimeline ? 0 : null,
      toMs: hasTimeline ? basmalaTo : null,
      wordTimings: [],
    });
  }
  for (const ayah of ayahs) {
    const ts = byKey.get(ayah.key);
    segments.push({
      key: ayah.key,
      ayah,
      arabic: ayah.arabic,
      translation: ayah.translation,
      words: ayah.words,
      audioUrl: ayah.audioUrl,
      durationMs: ayah.durationMs,
      fromMs: ts?.fromMs ?? null,
      toMs: ts?.toMs ?? null,
      wordTimings: ts?.words ?? [],
    });
  }
  return segments;
};

/** Normalise raw API timestamp rows; drops malformed word entries such as [1]. */
export const normaliseTimestamps = (
  rows: { verseKey?: string; verse_key?: string; timestampFrom?: number; timestamp_from?: number; timestampTo?: number; timestamp_to?: number; segments?: unknown[] }[],
): ChapterTimestamp[] =>
  rows
    .map((r) => ({
      verseKey: r.verseKey ?? r.verse_key ?? "",
      fromMs: r.timestampFrom ?? r.timestamp_from ?? 0,
      toMs: r.timestampTo ?? r.timestamp_to ?? 0,
      words: (r.segments ?? [])
        .filter((w): w is number[] => Array.isArray(w) && w.length >= 3 && w.every((n) => typeof n === "number"))
        .map((w) => [w[0], w[1], w[2]] as WordTiming),
    }))
    .filter((t) => t.verseKey);

/** Per-ayah file timings arrive as [wordIndex0, position1, fromMs, toMs]. */
export const normaliseAyahWordTimings = (rows: unknown[] | undefined): WordTiming[] =>
  (rows ?? [])
    .filter((w): w is number[] => Array.isArray(w) && w.length >= 4 && w.every((n) => typeof n === "number"))
    .map((w) => [w[1], w[2], w[3]] as WordTiming);

/** Locate the segment and word at a time in the full-surah file. */
export const locateInChapter = (segments: PlayerSegment[], ms: number): { index: number; wordPosition: number | null } => {
  let index = -1;
  for (let i = 0; i < segments.length; i += 1) {
    const s = segments[i];
    if (s.fromMs !== null && s.toMs !== null && ms >= s.fromMs && ms < s.toMs) { index = i; break; }
    if (s.fromMs !== null && ms >= s.fromMs) index = i; // keep the last started segment (gaps between ayat)
  }
  if (index < 0) return { index: 0, wordPosition: null };
  const w = segments[index].wordTimings.find(([, from, to]) => ms >= from && ms < to);
  return { index, wordPosition: w ? w[0] : null };
};

/** Locate the word at a time inside a per-ayah file. */
export const locateInAyah = (segment: PlayerSegment, ms: number): number | null => {
  const t = segment.ayah?.ayahWordTimings.find(([, from, to]) => ms >= from && ms < to);
  return t ? t[0] : null;
};

export type RepeatMode = "off" | "ayah" | "range" | "surah";

export interface RepeatSettings {
  mode: RepeatMode;
  /** Times each unit is played (1 = once). Infinity allowed. */
  count: number;
  /** Inclusive segment indexes for range mode. */
  from: number;
  to: number;
  /** Seconds of silence after each ayah (reflection pause). */
  pauseSeconds: number;
}

export const DEFAULT_REPEAT: RepeatSettings = { mode: "off", count: 1, from: 0, to: 0, pauseSeconds: 0 };

export const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5, 2] as const;

export interface PlayerState {
  surah: PlayerSurah | null;
  segments: PlayerSegment[];
  chapterAudio: ChapterAudioInfo | null;
  engine: AudioEngine;
  index: number;
  /** Active word position within the current segment (null between words). */
  wordPosition: number | null;
  repeat: RepeatSettings;
  /** Plays remaining for the current repeat unit. */
  repeatRemaining: number;
  playbackRate: number;
  /** Epoch ms when playback should stop, or null. */
  sleepUntil: number | null;
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
  chapterAudio: null,
  engine: "ayah",
  index: 0,
  wordPosition: null,
  repeat: DEFAULT_REPEAT,
  repeatRemaining: 1,
  playbackRate: 1,
  sleepUntil: null,
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
  | { type: "loaded"; segments: PlayerSegment[]; chapterAudio?: ChapterAudioInfo | null }
  | { type: "word"; position: number | null }
  | { type: "repeat"; settings: Partial<RepeatSettings> }
  | { type: "repeatConsumed" }
  | { type: "rate"; rate: number }
  | { type: "sleep"; minutes: number | null }
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
      const chapterAudio = action.chapterAudio ?? null;
      return {
        ...state,
        segments: action.segments,
        chapterAudio,
        engine: chooseEngine(chapterAudio, action.segments),
        index,
        wordPosition: null,
        repeatRemaining: state.repeat.count,
        status: action.segments.length ? "ready" : "unavailable",
        resume: state.surah ? { surahNumber: state.surah.number, segment: index } : state.resume,
      };
    }
    case "word":
      return state.wordPosition === action.position ? state : { ...state, wordPosition: action.position };
    case "repeat": {
      const repeat = { ...state.repeat, ...action.settings };
      if (repeat.mode === "range") {
        const max = Math.max(0, state.segments.length - 1);
        repeat.from = clamp(repeat.from, 0, max);
        repeat.to = clamp(Math.max(repeat.to, repeat.from), 0, max);
      }
      return { ...state, repeat, repeatRemaining: repeat.count };
    }
    case "repeatConsumed":
      return { ...state, repeatRemaining: Math.max(0, state.repeatRemaining - 1) };
    case "rate":
      return { ...state, playbackRate: action.rate };
    case "sleep":
      return { ...state, sleepUntil: action.minutes ? Date.now() + action.minutes * 60_000 : null };
    case "failed":
      return { ...state, status: action.status, isPlaying: false };
    case "seek": {
      if (!state.segments.length) return state;
      const index = clamp(action.index, 0, state.segments.length - 1);
      return {
        ...state,
        index,
        wordPosition: null,
        repeatRemaining: index === state.index ? state.repeatRemaining : state.repeat.count,
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

export type SegmentEndDecision =
  | { action: "replay" }           // play the same segment again (repeat ayah)
  | { action: "seek"; index: number } // jump to another segment
  | { action: "ended" };           // surah finished

/**
 * What to do when the current segment finishes, given repeat settings.
 * Pure; the host applies the decision and dispatches "repeatConsumed" on replay.
 */
export const decideAtSegmentEnd = (state: PlayerState): SegmentEndDecision => {
  const last = state.segments.length - 1;
  const { repeat } = state;
  if (repeat.mode === "ayah" && state.repeatRemaining > 1) return { action: "replay" };
  if (repeat.mode === "range") {
    if (state.index < repeat.to) return { action: "seek", index: state.index + 1 };
    if (state.repeatRemaining > 1 || repeat.count === Infinity) return { action: "seek", index: repeat.from };
    return state.index < last ? { action: "seek", index: state.index + 1 } : { action: "ended" };
  }
  if (state.index < last) return { action: "seek", index: state.index + 1 };
  if (repeat.mode === "surah" && (state.repeatRemaining > 1 || repeat.count === Infinity)) return { action: "seek", index: 0 };
  return { action: "ended" };
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

/**
 * Split Uthmani ayah text into words whose positions match the official
 * word-by-word API (1-based). Quranic annotation signs that stand alone
 * between spaces (waqf marks, sajdah, etc.) belong to the preceding word, as
 * in the official word list. Validated against the words API for every ayah
 * of surahs 1 and 2: identical word counts in 293 of 293 ayat.
 */
const STANDALONE_SIGN = /^[ؐ-ؚۖ-ۭ࣓-ٰࣿ]+$/;

export const splitUthmaniWords = (text: string): PlayerWord[] => {
  const out: string[] = [];
  for (const token of text.trim().split(/\s+/)) {
    if (!token) continue;
    if (STANDALONE_SIGN.test(token) && out.length) out[out.length - 1] += ` ${token}`;
    else out.push(token);
  }
  return out.map((t, i) => ({ position: i + 1, text: t }));
};
