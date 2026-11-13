"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";

import {
  NO_TRANSLATION,
  PLAYBACK_RATES,
  PLAYER_STORAGE_KEYS,
  LOCALES,
  TEXT_SIZE_SCALE,
  WALLPAPERS,
  WALLPAPER_STORAGE_KEY,
  bookmarksFor,
  currentSegment,
  isBookmarked,
  notesFor,
  decideAtSegmentEnd,
  initialPlayerState,
  locateInAyah,
  locateInChapter,
  nextSurahNumber,
  playerReducer,
  type PlayerReciter,
  type PlayerState,
  type PlayerSurah,
  type PlayerTranslation,
  type RepeatMode,
  type Station,
  type TextSize,
  type Wallpaper,
  type WallpaperMode,
  wallpaperById,
  wallpaperForSurah,
} from "@qam/core";

import Link from "next/link";

import { useFamily, useProgressTicker } from "@/components/family/family-provider";
import { setUiLocale, useI18n } from "@/lib/i18n";
import { fetchPlayerSurah, fetchReciters, fetchSurahs, fetchTafsir, fetchTafsirs, fetchTranslations, fetchWallpapers, fetchWords, type TafsirResource } from "@/lib/player-client";

import WallpaperLayer from "./wallpaper";

import styles from "./player.module.css";

/* ------------------------------------------------------------------ */
/* Copy (Arabic first, English fallback)                               */
/* ------------------------------------------------------------------ */

/** Default tafsir per UI language. Prelive has 926 (Jalalayn, ar) and 169 (Ibn Kathir, en). */
const DEFAULT_TAFSIR: Record<string, string> = { ar: "926", en: "169" };

const readStorage = <T,>(key: string, fallback: T): T => {
  try { const raw = window.localStorage.getItem(key); return raw ? (JSON.parse(raw) as T) : fallback; } catch { return fallback; }
};
const writeStorage = (key: string, value: unknown) => { try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode */ } };
const toArabicDigits = (n: number) => n.toLocaleString("ar-EG", { useGrouping: false });

interface Props { initialSurah?: number; initialAyah?: number; profileGender?: "male" | "female" | "unspecified" }

type MenuTab = "surahs" | "reciter" | "translation" | "tafsir" | "wallpaper" | "settings";
/** The side panel shares the screen with the player (split layout); it never overlays it. */
type SidePanel = MenuTab | "notes" | null;

export default function QuranPlayer({ initialSurah, initialAyah, profileGender = "unspecified" }: Props) {
  const pendingAyahRef = useRef<number | null>(initialAyah ?? null);
  const { locale, m, isRtl } = useI18n();
  const [view, setView] = useState<"focus" | "list">("focus");
  const [wallpaperMode, setWallpaperMode] = useState<WallpaperMode>("auto-nature");
  const [fixedWallpaper, setFixedWallpaper] = useState<string>("n-mountain-lake");
  const [internetWallpapers, setInternetWallpapers] = useState<Wallpaper[]>([]);
  const [internetEnabled, setInternetEnabled] = useState(false);
  const [tafsirs, setTafsirs] = useState<TafsirResource[]>([]);
  const [tafsirChoice, setTafsirChoice] = useState<string | null>(null);
  const [wbwLocale, setWbwLocale] = useState<string | null>(null);
  const [panel, setPanel] = useState<SidePanel>(null);
  const togglePanel = (p: Exclude<SidePanel, null>) => setPanel((cur) => (cur === p ? null : p));
  const ar = locale === "ar";
  const t = m.player;
  const num = (n: number) => (ar ? toArabicDigits(n) : String(n));

  const [state, dispatch] = useReducer(playerReducer, undefined, () => initialPlayerState());
  const [surahs, setSurahs] = useState<PlayerSurah[]>([]);
  const [reciters, setReciters] = useState<PlayerReciter[]>([]);
  const [translations, setTranslations] = useState<PlayerTranslation[]>([]);
  const [languageFilter, setLanguageFilter] = useState("all");
  const [styleFilter, setStyleFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [progress, setProgress] = useState(0);
  const [station, setStation] = useState<Station | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [wordTip, setWordTip] = useState<{ key: string; position: number } | null>(null);
  const [wordMeanings, setWordMeanings] = useState<Record<string, { translation?: string | null; transliteration?: string | null; audioUrl?: string | null }[]>>({});
  const [toast, setToast] = useState<string | null>(null);
  const family = useFamily();
  const [noteDraft, setNoteDraft] = useState("");

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stateRef = useRef<PlayerState>(state);
  stateRef.current = state;
  const pauseTimerRef = useRef<number | null>(null);

  /* ---------- bootstrap ---------- */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [s, r, tr, tf] = await Promise.all([fetchSurahs(locale), fetchReciters(profileGender), fetchTranslations(), fetchTafsirs().catch(() => [])]);
        if (cancelled) return;
        setSurahs(s); setReciters(r); setTranslations(tr); setTafsirs(tf);
        setView(readStorage<"focus" | "list">("qam.player.view", "focus"));
        const wp = readStorage<{ mode: WallpaperMode; fixed: string } | null>(WALLPAPER_STORAGE_KEY, null);
        if (wp) { setWallpaperMode(wp.mode); setFixedWallpaper(wp.fixed); }
        setTafsirChoice(readStorage<string | null>("qam.player.tafsir", null));
        setWbwLocale(readStorage<string | null>("qam.player.wbw", null));
        const savedReciter = readStorage<string | null>(PLAYER_STORAGE_KEYS.reciter, null);
        const reciter = r.find((x) => x.id === savedReciter) ?? r.find((x) => x.chapterReciterId === 7) ?? r[0];
        if (reciter) dispatch({ type: "reciter", reciter });
        const savedTranslation = readStorage<string | null>(PLAYER_STORAGE_KEYS.translation, null);
        // Default translation: the saved one, else the first in the UI language, else English (85), else none.
        const langName = new Intl.DisplayNames(["en"], { type: "language" }).of(locale.split("-")[0])?.toLowerCase();
        const defaultTranslation = tr.find((x) => x.languageName?.toLowerCase() === langName) ?? tr.find((x) => x.id === "85") ?? tr[0] ?? NO_TRANSLATION;
        dispatch({ type: "translation", translation: savedTranslation === "none" ? NO_TRANSLATION : savedTranslation ? (tr.find((x) => x.id === savedTranslation) ?? defaultTranslation) : defaultTranslation });
        dispatch({ type: "textSize", size: readStorage<TextSize>(PLAYER_STORAGE_KEYS.textSize, "medium") });
        dispatch({ type: "autoAdvance", value: readStorage<boolean>(PLAYER_STORAGE_KEYS.autoAdvance, true) });
        dispatch({ type: "motion", value: readStorage<boolean>(PLAYER_STORAGE_KEYS.motion, true) });
        dispatch({ type: "rate", rate: readStorage<number>("qam.player.rate", 1) });
        const resume = readStorage<{ surahNumber: number; segment: number } | null>(PLAYER_STORAGE_KEYS.resume, null);
        const first = s.find((x) => x.number === (initialSurah ?? resume?.surahNumber)) ?? s[0];
        if (first) dispatch({ type: "open", surah: first, index: initialSurah ? 0 : resume?.segment ?? 0, play: false });
      } catch { dispatch({ type: "failed", status: "network_error" }); }
      setHydrated(true);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- persist ---------- */
  useEffect(() => {
    if (!hydrated) return;
    if (state.reciter) writeStorage(PLAYER_STORAGE_KEYS.reciter, state.reciter.id);
    writeStorage(PLAYER_STORAGE_KEYS.translation, state.translation.id);
    writeStorage(PLAYER_STORAGE_KEYS.textSize, state.textSize);
    writeStorage(PLAYER_STORAGE_KEYS.autoAdvance, state.autoAdvance);
    writeStorage(PLAYER_STORAGE_KEYS.motion, state.motion);
    writeStorage("qam.player.rate", state.playbackRate);
    writeStorage("qam.player.view", view);
    writeStorage(WALLPAPER_STORAGE_KEY, { mode: wallpaperMode, fixed: fixedWallpaper });
    if (tafsirChoice) writeStorage("qam.player.tafsir", tafsirChoice);
    if (wbwLocale) writeStorage("qam.player.wbw", wbwLocale);
    if (state.resume) writeStorage(PLAYER_STORAGE_KEYS.resume, state.resume);
  }, [hydrated, state.reciter, state.translation, state.textSize, state.autoAdvance, state.motion, state.resume, state.playbackRate, view, wallpaperMode, fixedWallpaper, tafsirChoice, wbwLocale]);

  /* ---------- load surah ---------- */
  const loadKey = `${state.surah?.number ?? 0}|${state.reciter?.id ?? ""}|${state.translation.id}`;
  useEffect(() => {
    if (!state.surah || !state.reciter) return;
    let cancelled = false;
    const surah = state.surah;
    if (stateRef.current.status !== "loading") dispatch({ type: "open", surah, index: stateRef.current.index, play: stateRef.current.isPlaying });
    fetchPlayerSurah(surah.number, state.reciter, state.translation.apiId)
      .then((p) => !cancelled && dispatch({ type: "loaded", segments: p.segments, chapterAudio: p.chapterAudio }))
      .catch((e: Error & { status?: number }) => !cancelled && dispatch({ type: "failed", status: e.status && e.status < 500 ? "unavailable" : "network_error" }));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadKey]);

  const segment = currentSegment(state);
  const gapless = state.engine === "gapless" && !!state.chapterAudio;
  useProgressTicker(segment?.ayah?.key ?? null, null, state.isPlaying && !!family.profile);

  /* ---------- audio source + play state ---------- */
  const desiredSrc = gapless ? state.chapterAudio?.url ?? null : segment?.audioUrl ?? null;
  const lastSeekIndexRef = useRef<number>(-1);
  const seekFromTimeRef = useRef(false);
  /** Seek requested before the element has metadata; applied on loadedmetadata. */
  const pendingSeekRef = useRef<number | null>(null);

  const safePlay = useCallback((audio: HTMLAudioElement) => {
    audio.play().catch((err: unknown) => {
      // AbortError means a new load interrupted play(); the next effect run retries.
      if ((err as { name?: string })?.name === "NotAllowedError") dispatch({ type: "pause" });
    });
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !desiredSrc) return;
    const wantSeekMs = gapless && segment?.fromMs !== null && segment?.fromMs !== undefined ? segment.fromMs : null;
    if (audio.src !== desiredSrc) {
      audio.src = desiredSrc;
      audio.load();
      lastSeekIndexRef.current = -1;
      setProgress(0);
      pendingSeekRef.current = wantSeekMs;
    } else if (wantSeekMs !== null && lastSeekIndexRef.current !== state.index) {
      // Seek only when the user or the reducer moved the index, not when timeupdate moved it.
      if (!seekFromTimeRef.current) {
        if (audio.readyState >= 1) audio.currentTime = wantSeekMs / 1000;
        else pendingSeekRef.current = wantSeekMs;
      }
    }
    seekFromTimeRef.current = false;
    lastSeekIndexRef.current = state.index;
    audio.playbackRate = state.playbackRate;
    if (state.isPlaying) safePlay(audio);
    else audio.pause();
  }, [desiredSrc, state.isPlaying, state.index, state.playbackRate, gapless, segment, safePlay]);

  const onLoadedMetadata = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (pendingSeekRef.current !== null) {
      audio.currentTime = pendingSeekRef.current / 1000;
      pendingSeekRef.current = null;
    }
    if (stateRef.current.isPlaying) safePlay(audio);
  }, [safePlay]);

  const openSurahNumber = useCallback((number: number, play: boolean) => {
    const next = surahs.find((s) => s.number === number);
    if (next) dispatch({ type: "open", surah: next, index: 0, play });
  }, [surahs]);

  const finishSurah = useCallback(() => {
    const s = stateRef.current;
    if (station && s.surah) {
      const i = station.surahs.indexOf(s.surah.number);
      const nextInStation = station.surahs[i + 1] ?? (station.loop ? station.surahs[0] : undefined);
      if (nextInStation) { openSurahNumber(nextInStation, true); return; }
    }
    if (s.autoAdvance && s.surah) { openSurahNumber(nextSurahNumber(s.surah.number), true); return; }
    dispatch({ type: "ended" });
  }, [openSurahNumber, station]);

  /** Apply the repeat decision when a segment finishes (both engines). */
  const onSegmentEnd = useCallback(() => {
    const s = stateRef.current;
    const decision = decideAtSegmentEnd(s);
    const audio = audioRef.current;
    const go = () => {
      if (decision.action === "replay") {
        dispatch({ type: "repeatConsumed" });
        if (audio && s.engine === "gapless" && s.segments[s.index]?.fromMs !== null) { audio.currentTime = (s.segments[s.index].fromMs ?? 0) / 1000; safePlay(audio); }
        else if (audio) { audio.currentTime = 0; safePlay(audio); }
      } else if (decision.action === "seek") {
        dispatch({ type: "seek", index: decision.index });
      } else {
        finishSurah();
      }
    };
    if (s.repeat.pauseSeconds > 0 && decision.action !== "ended") {
      audio?.pause();
      pauseTimerRef.current = window.setTimeout(go, s.repeat.pauseSeconds * 1000);
    } else go();
  }, [finishSurah, safePlay]);

  /* ---------- time tracking: highlight + boundaries ---------- */
  const boundaryRef = useRef<string>("");
  const onTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    const s = stateRef.current;
    if (!audio) return;
    const ms = audio.currentTime * 1000;
    if (s.engine === "gapless" && !s.chapterAudio?.hasTimestamps) {
      // Full-surah file without timestamps: no ayah tracking, just progress.
      setProgress(audio.duration ? audio.currentTime / audio.duration : 0);
      return;
    }
    if (s.engine === "gapless") {
      const seg = s.segments[s.index];
      if (seg && seg.toMs !== null && ms >= seg.toMs - 40) {
        const key = `${s.surah?.number}-${s.index}-${s.repeatRemaining}`;
        if (boundaryRef.current !== key) { boundaryRef.current = key; seekFromTimeRef.current = true; onSegmentEnd(); }
        return;
      }
      const loc = locateInChapter(s.segments, ms);
      if (loc.index !== s.index) { seekFromTimeRef.current = true; dispatch({ type: "seek", index: loc.index }); }
      if (loc.wordPosition !== s.wordPosition) dispatch({ type: "word", position: loc.wordPosition });
      const from = seg?.fromMs ?? 0; const to = seg?.toMs ?? audio.duration * 1000;
      setProgress(to > from ? Math.min(1, (ms - from) / (to - from)) : 0);
    } else {
      const seg = s.segments[s.index];
      if (seg) { const w = locateInAyah(seg, ms); if (w !== s.wordPosition) dispatch({ type: "word", position: w }); }
      setProgress(audio.duration ? audio.currentTime / audio.duration : 0);
    }
  }, [onSegmentEnd]);

  const onEnded = useCallback(() => {
    const s = stateRef.current;
    if (s.engine === "gapless") { finishSurah(); return; }
    onSegmentEnd();
  }, [finishSurah, onSegmentEnd]);

  useEffect(() => () => { if (pauseTimerRef.current) window.clearTimeout(pauseTimerRef.current); }, []);

  /* ---------- sleep timer ---------- */
  useEffect(() => {
    if (!state.sleepUntil) return;
    const id = window.setInterval(() => {
      if (Date.now() >= (stateRef.current.sleepUntil ?? 0)) { dispatch({ type: "pause" }); dispatch({ type: "sleep", minutes: null }); }
    }, 1000);
    return () => window.clearInterval(id);
  }, [state.sleepUntil]);

  /* ---------- Media Session (lock screen, headset buttons, TV remotes) ---------- */
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator) || !state.surah) return;
    const ms = navigator.mediaSession;
    ms.metadata = new MediaMetadata({
      title: `${ar ? "سورة" : "Surah"} ${state.surah.arabicName}${segment?.ayah ? ` · ${t.ayah} ${num(segment.ayah.number)}` : ""}`,
      artist: state.reciter ? (ar ? state.reciter.arabicName : state.reciter.latinName) : "",
      album: "Quran and More",
    });
    ms.setActionHandler("play", () => dispatch({ type: "play" }));
    ms.setActionHandler("pause", () => dispatch({ type: "pause" }));
    ms.setActionHandler("previoustrack", () => dispatch({ type: "prev" }));
    ms.setActionHandler("nexttrack", () => dispatch({ type: "next" }));
    ms.playbackState = state.isPlaying ? "playing" : "paused";
  }, [state.surah, state.reciter, segment, state.isPlaying, ar, t.ayah]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------- auto-scroll ---------- */
  useEffect(() => {
    if (!state.motion || !segment) return;
    document.getElementById(`seg-${segment.key}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [segment?.key, state.motion]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------- tafsir ---------- */
  const RTL_LANGS = ["arabic", "urdu", "persian", "farsi", "kurdish", "sindhi", "pashto", "uighur", "uyghur"];
  const tafsirId = tafsirChoice ?? (tafsirs.find((x) => x.language.toLowerCase().startsWith(LOCALES.find((l) => l.code === locale)?.name.toLowerCase() ?? "english"))?.id.toString() ?? DEFAULT_TAFSIR[locale] ?? DEFAULT_TAFSIR.en);
  const tafsirLang = tafsirs.find((x) => String(x.id) === tafsirId)?.language.toLowerCase() ?? (ar ? "arabic" : "english");
  const tafsirDir: "rtl" | "ltr" = RTL_LANGS.some((l) => tafsirLang.startsWith(l)) ? "rtl" : "ltr";
  /* wallpaper per surah (+ internet results when enabled) */
  useEffect(() => {
    if (!state.surah) return;
    let cancelled = false;
    fetchWallpapers(state.surah.number).then((r) => { if (cancelled) return; setInternetEnabled(r.internetEnabled); setInternetWallpapers(r.wallpapers.filter((w) => w.id.startsWith("px-"))); }).catch(() => undefined);
    return () => { cancelled = true; };
  }, [state.surah]);
  const wallpaper: Wallpaper = useMemo(() => {
    const n = state.surah?.number ?? 1;
    if (wallpaperMode === "plain") return wallpaperById(typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches ? "p-night" : "p-paper")!;
    if (wallpaperMode === "fixed") return wallpaperById(fixedWallpaper) ?? internetWallpapers.find((w) => w.id === fixedWallpaper) ?? wallpaperForSurah(n, "nature");
    if (wallpaperMode === "auto-nature" && internetWallpapers.length) return internetWallpapers[n % internetWallpapers.length];
    return wallpaperForSurah(n, wallpaperMode === "auto-art" ? "art" : wallpaperMode === "auto-live" ? "live" : "nature");
  }, [wallpaperMode, fixedWallpaper, state.surah, internetWallpapers]);
  useEffect(() => {
    if (panel !== "tafsir" || !segment?.ayah || state.tafsir?.key === segment.key) return;
    let cancelled = false;
    dispatch({ type: "tafsirLoading" });
    fetchTafsir(tafsirId, segment.ayah.key)
      .then((res) => !cancelled && dispatch({ type: "tafsir", key: segment.key, text: res?.text ?? null }))
      .catch(() => !cancelled && dispatch({ type: "tafsir", key: segment.key, text: null }));
    return () => { cancelled = true; };
  }, [panel, segment, state.tafsir?.key, tafsirId]);

  /* Deep link ?ayah=N: once the requested surah's segments are in, jump to that ayah. */
  useEffect(() => {
    const want = pendingAyahRef.current;
    if (want === null || !state.segments.length || state.surah?.number !== initialSurah) return;
    const idx = state.segments.findIndex((seg) => seg.ayah?.number === want);
    if (idx >= 0) { seekFromTimeRef.current = false; dispatch({ type: "seek", index: idx }); }
    pendingAyahRef.current = null;
  }, [state.segments, state.surah, initialSurah]);

  /* ---------- keyboard / remote ---------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT" || (e.target as HTMLElement)?.tagName === "SELECT") return;
      if (e.key === " " || e.key === "MediaPlayPause") { e.preventDefault(); dispatch({ type: "toggle" }); }
      if (e.key === "ArrowRight" || e.key === "MediaTrackNext") dispatch({ type: isRtl ? "prev" : "next" });
      if (e.key === "ArrowLeft" || e.key === "MediaTrackPrevious") dispatch({ type: isRtl ? "next" : "prev" });
      if (e.key === "Escape") setPanel(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isRtl]);

  /* ---------- derived ---------- */
  const q = query.trim().toLowerCase();
  const filteredSurahs = useMemo(() => (q ? surahs.filter((s) => s.arabicName.includes(q) || s.latinName.toLowerCase().includes(q) || String(s.number) === q) : surahs), [surahs, q]);
  const filteredReciters = useMemo(() => reciters.filter((r) => (styleFilter === "all" || r.style === styleFilter) && (!q || r.arabicName.includes(q) || r.latinName.toLowerCase().includes(q))), [reciters, styleFilter, q]);
  const reciterStyles = useMemo(() => Array.from(new Set(reciters.map((r) => r.style).filter(Boolean))) as string[], [reciters]);
  const languages = useMemo(() => Array.from(new Set(translations.map((x) => x.languageName))).sort(), [translations]);
  const filteredTranslations = languageFilter === "all" ? translations : translations.filter((x) => x.languageName === languageFilter);
  const scale = TEXT_SIZE_SCALE[state.textSize];
  const styleLabel = (s: string | null) => (s === "mujawwad" ? t.styleMujawwad : s === "muallim" ? t.styleMuallim : t.styleMurattal);
  const capability = (r: PlayerReciter) => ((r.source && r.source !== "qf") ? t.noSyncShort : r.chapterReciterId && r.recitationId ? t.both : r.chapterReciterId ? t.gaplessOnly : t.ayahOnly);
  const sleepLeft = state.sleepUntil ? Math.max(0, Math.ceil((state.sleepUntil - Date.now()) / 60000)) : 0;

  const statusLine = (() => {
    if (state.status === "loading") return t.loading;
    if (state.status === "network_error") return t.offline;
    if (state.status === "unavailable") return t.unavailable;
    if (state.status === "ended" && state.surah) return `${t.ended} ${state.surah.arabicName}`;
    const parts = [];
    if (station) parts.push(`${t.playingStation}: ${station.title[ar ? "ar" : "en"]}`);
    else if (state.reciter) parts.push(`${t.listenWith} ${ar ? state.reciter.arabicName : state.reciter.latinName} · ${t.riwayah} ${state.reciter.riwayah}`);
    parts.push(gapless ? (state.chapterAudio?.hasTimestamps ? t.gapless : t.noSync) : t.perAyah);
    if (state.repeat.mode !== "off") parts.push(`${t.repeat}: ${state.repeat.mode === "ayah" ? t.repeatAyah : state.repeat.mode === "range" ? t.repeatRange : t.repeatSurah} ×${state.repeat.count === Infinity ? t.infinite : num(state.repeat.count)}`);
    if (state.sleepUntil) parts.push(`${t.sleep} ${num(sleepLeft)} ${t.minutes}`);
    return parts.join(" · ");
  })();

  /* word meanings are fetched lazily for the tipped ayah */
  useEffect(() => {
    const key = wordTip?.key;
    if (!key || key === "basmala" || wordMeanings[key]) return;
    let cancelled = false;
    fetchWords(key, wbwLocale ?? locale).then((ws) => !cancelled && setWordMeanings((m) => ({ ...m, [key]: ws }))).catch(() => undefined);
    return () => { cancelled = true; };
  }, [wordTip?.key, wordMeanings, locale, wbwLocale]);

  /** Tap a word: jump the audio to that word (gapless) or that ayah, start playing, and show its meaning. */
  const onWordClick = (segIndex: number, position: number) => {
    const seg = state.segments[segIndex];
    const timing = seg?.wordTimings.find(([p]) => p === position);
    setWordTip(wordTip?.key === seg?.key && wordTip.position === position ? null : { key: seg.key, position });
    seekFromTimeRef.current = false;
    dispatch({ type: "seek", index: segIndex });
    dispatch({ type: "play" });
    const audio = audioRef.current;
    if (audio && gapless && timing && audio.readyState >= 1) {
      // Same source: the effect will not seek because the index may be unchanged; seek directly to the word.
      window.setTimeout(() => { audio.currentTime = timing[1] / 1000; lastSeekIndexRef.current = segIndex; }, 0);
    }
  };

  const share = async () => {
    const url = `${window.location.origin}/player?surah=${state.surah?.number ?? 1}${segment?.ayah ? `&ayah=${segment.ayah.number}` : ""}`;
    try {
      if (navigator.share) await navigator.share({ title: `${state.surah?.arabicName}`, url });
      else { await navigator.clipboard.writeText(url); setToast(t.copied); window.setTimeout(() => setToast(null), 1800); }
    } catch { /* cancelled */ }
  };

  const setRepeat = (settings: Partial<typeof state.repeat>) => dispatch({ type: "repeat", settings: { ...settings, ...(settings.mode === "range" && state.repeat.mode !== "range" ? { from: state.index, to: Math.min(state.index + 4, state.segments.length - 1) } : {}) } });

  const panelTitle = (tab: Exclude<SidePanel, null>) => (tab === "wallpaper" ? t.wallpaper : tab === "notes" ? `${t.notes} · ${segment?.ayah?.key ?? ""}` : t[tab]);
  const panelBody = (tab: MenuTab) => (
    <>
                {tab === "surahs" && (<>
                  <input className={styles.search} placeholder={t.search} value={query} onChange={(e) => setQuery(e.target.value)} />
                  <div className={styles.kicker}>{t.surahs}</div>
                  {filteredSurahs.map((s) => (
                    <button key={s.number} className={`${styles.row} ${state.surah?.number === s.number ? styles.rowActive : ""}`} onClick={() => { setStation(null); openSurahNumber(s.number, true); }}>
                      <span className={styles.rowMain}><span translate="no">{num(s.number)}. {s.arabicName}</span><span className={styles.rowSub}>{s.latinName} · {num(s.verseCount)}</span></span>
                    </button>
                  ))}
                </>)}

                {tab === "reciter" && (<>
                  <input className={styles.search} placeholder={t.search} value={query} onChange={(e) => setQuery(e.target.value)} />
                  {reciterStyles.length > 1 && (
                    <span className={styles.segmented}>
                      <button className={styleFilter === "all" ? "on" : ""} onClick={() => setStyleFilter("all")}>{t.allLanguages}</button>
                      {reciterStyles.map((s) => <button key={s} className={styleFilter === s ? "on" : ""} onClick={() => setStyleFilter(s)}>{styleLabel(s)}</button>)}
                    </span>
                  )}
                  <div className={styles.rowSub}>{num(filteredReciters.length)} {t.reciter}</div>
                  {filteredReciters.map((r) => (
                    <button key={r.id} className={`${styles.row} ${state.reciter?.id === r.id ? styles.rowActive : ""}`} onClick={() => dispatch({ type: "reciter", reciter: r })}>
                      <span className={styles.rowMain}>
                        <span>{ar ? r.arabicName : r.latinName}</span>
                        <span className={styles.rowSub}>{t.riwayah} {r.riwayah} · {styleLabel(r.style)} · {capability(r)}</span>
                      </span>
                    </button>
                  ))}
                </>)}

                {tab === "translation" && (<>
                  <select className={styles.search} value={languageFilter} onChange={(e) => setLanguageFilter(e.target.value)}>
                    <option value="all">{t.allLanguages}</option>
                    {languages.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                  <button className={`${styles.row} ${state.translation.id === "none" ? styles.rowActive : ""}`} onClick={() => dispatch({ type: "translation", translation: NO_TRANSLATION })}><span>{t.none}</span></button>
                  {filteredTranslations.map((tr) => (
                    <button key={tr.id} className={`${styles.row} ${state.translation.id === tr.id ? styles.rowActive : ""}`} onClick={() => dispatch({ type: "translation", translation: tr })}>
                      <span className={styles.rowMain}><span>{tr.label}</span><span className={styles.rowSub}>{tr.languageName}</span></span>
                    </button>
                  ))}
                </>)}

                {tab === "tafsir" && tafsirs.length > 0 && (
                  <select className={styles.search} value={tafsirId} onChange={(e) => { setTafsirChoice(e.target.value); dispatch({ type: "tafsir", key: "", text: null }); }} aria-label={t.tafsirPick}>
                    {tafsirs.map((x) => <option key={x.id} value={String(x.id)}>{x.name}{x.author ? ` · ${x.author}` : ""} ({x.language})</option>)}
                  </select>
                )}
                {tab === "tafsir" && (!segment?.ayah ? <p className={styles.rowSub}>{t.basmalaNote}</p>
                  : state.tafsirLoading ? (state.tafsir?.text ? <div className={styles.tafsirStale} aria-busy="true"><p className={styles.arabic} lang="ar" translate="no" style={{ fontSize: "1.3em" }}>{segment.arabic}</p><div className={styles.tafsirText} dir={tafsirDir} lang={tafsirDir === "rtl" && tafsirLang.startsWith("arabic") ? "ar" : undefined}>{state.tafsir.text}</div></div> : <p className={styles.rowSub}>{t.loading}</p>)
                  : state.tafsir?.key === segment.key && state.tafsir.text ? (<>
                    <p className={styles.arabic} lang="ar" translate="no" style={{ fontSize: "1.3em" }}>{segment.arabic}</p>
                    <div className={styles.tafsirText} dir={tafsirDir} lang={tafsirDir === "rtl" && tafsirLang.startsWith("arabic") ? "ar" : undefined}>{state.tafsir.text}</div>
                  </>) : <p className={styles.rowSub}>{t.tafsir} {t.unavailable}</p>)}

                {tab === "settings" && (<>
                  <div className={styles.settingRow}>
                    <span>{t.repeat}</span>
                    <span className={styles.segmented}>
                      {([["off", t.repeatOff], ["ayah", t.repeatAyah], ["range", t.repeatRange], ["surah", t.repeatSurah]] as [RepeatMode, string][]).map(([m, label]) => (
                        <button key={m} className={state.repeat.mode === m ? "on" : ""} onClick={() => setRepeat({ mode: m, count: m === "off" ? 1 : state.repeat.count === 1 ? 3 : state.repeat.count })}>{label}</button>
                      ))}
                    </span>
                  </div>
                  {state.repeat.mode !== "off" && (<>
                    <div className={styles.settingRow}>
                      <span>{t.times}</span>
                      <span className={styles.segmented}>
                        {[1, 2, 3, 5, 10, Infinity].map((n) => <button key={n} className={state.repeat.count === n ? "on" : ""} onClick={() => setRepeat({ count: n })}>{n === Infinity ? t.infinite : num(n)}</button>)}
                      </span>
                    </div>
                    {state.repeat.mode === "range" && (
                      <div className={styles.settingRow}>
                        <span>{t.from}</span>
                        <input type="number" className={styles.numInput} min={1} max={state.segments.length} value={state.repeat.from + 1} onChange={(e) => setRepeat({ from: Number(e.target.value) - 1 })} />
                        <span>{t.to}</span>
                        <input type="number" className={styles.numInput} min={1} max={state.segments.length} value={state.repeat.to + 1} onChange={(e) => setRepeat({ to: Number(e.target.value) - 1 })} />
                      </div>
                    )}
                    <div className={styles.settingRow}>
                      <span>{t.pauseBetween}</span>
                      <span className={styles.segmented}>{[0, 2, 5, 10].map((n) => <button key={n} className={state.repeat.pauseSeconds === n ? "on" : ""} onClick={() => setRepeat({ pauseSeconds: n })}>{num(n)}</button>)}</span>
                    </div>
                  </>)}
                  <div className={styles.settingRow}>
                    <span>{t.speed}</span>
                    <span className={styles.segmented}>{PLAYBACK_RATES.map((r) => <button key={r} className={state.playbackRate === r ? "on" : ""} onClick={() => dispatch({ type: "rate", rate: r })}>{r}×</button>)}</span>
                  </div>
                  <div className={styles.settingRow}>
                    <span>{t.sleep}</span>
                    <span className={styles.segmented}>
                      <button className={!state.sleepUntil ? "on" : ""} onClick={() => dispatch({ type: "sleep", minutes: null })}>{t.off}</button>
                      {[10, 20, 30, 60].map((m) => <button key={m} className={sleepLeft && Math.abs(sleepLeft - m) <= 1 ? "on" : ""} onClick={() => dispatch({ type: "sleep", minutes: m })}>{num(m)} {t.minutes}</button>)}
                    </span>
                  </div>
                  <div className={styles.settingRow}>
                    <span>{t.textSize}</span>
                    <span className={styles.segmented}>{(["small", "medium", "large"] as TextSize[]).map((sz) => <button key={sz} className={state.textSize === sz ? "on" : ""} onClick={() => dispatch({ type: "textSize", size: sz })}>{t[sz]}</button>)}</span>
                  </div>
                  <label className={styles.settingRow}><span>{t.autoAdvance}</span><input type="checkbox" checked={state.autoAdvance} onChange={(e) => dispatch({ type: "autoAdvance", value: e.target.checked })} /></label>
                  <label className={styles.settingRow}><span>{t.motion}</span><input type="checkbox" checked={state.motion} onChange={(e) => dispatch({ type: "motion", value: e.target.checked })} /></label>
                  <div className={styles.settingRow}>
                    <span>{t.language}</span>
                    <select className={styles.search} value={locale} onChange={(e) => setUiLocale(e.target.value)}>
                      {LOCALES.map((l) => <option key={l.code} value={l.code}>{l.nativeName}</option>)}
                    </select>
                  </div>
                  <div className={styles.settingRow}>
                    <span>{t.wbwLanguage}</span>
                    <select className={styles.search} value={wbwLocale ?? locale} onChange={(e) => setWbwLocale(e.target.value)}>
                      {LOCALES.map((l) => <option key={l.code} value={l.code}>{l.nativeName}</option>)}
                    </select>
                  </div>
                  <p className={styles.rowSub}>{t.wordByWord}</p>
                </>)}
                {tab === "wallpaper" && (<>
                  <div className={styles.kicker}>{t.wallpaper}</div>
                  <div className={styles.modeGrid}>
                    {([["auto-nature", `🌿 ${t.autoNature}`], ["auto-art", `✦ ${t.autoArt}`], ["auto-live", `✨ ${t.autoLive}`], ["plain", `▭ ${t.plainBg}`]] as [WallpaperMode, string][]).map(([m, label]) => (
                      <button key={m} className={`${styles.chip} ${wallpaperMode === m ? styles.chipActive : ""}`} onClick={() => setWallpaperMode(m)}>{label}</button>
                    ))}
                  </div>
                  <div className={styles.rowSub}>{t.fixedBg}</div>
                  <div className={styles.wpGrid}>
                    {[...WALLPAPERS.filter((w) => w.kind !== "plain"), ...internetWallpapers].map((w) => (
                      <button key={w.id} className={`${styles.wpThumb} ${wallpaperMode === "fixed" && fixedWallpaper === w.id ? styles.wpThumbOn : ""}`} onClick={() => { setFixedWallpaper(w.id); setWallpaperMode("fixed"); }} title={w.title[ar ? "ar" : "en"]}
                        style={w.kind !== "nature" ? { background: `linear-gradient(135deg, ${w.colors?.[0]}, ${w.colors?.[1]} 60%, ${w.colors?.[2]})` } : undefined}>
                        {/* eslint-disable-next-line @next/next/no-img-element -- remote CDN thumbnails from many hosts */}
                        {w.kind === "nature" && w.url ? <img src={w.url.replace("w=1920", "w=400")} alt="" loading="lazy" /> : null}
                        <span className={styles.wpLabel}>{w.kind === "live" ? "✦ " : w.kind === "art" ? "✺ " : ""}{w.title[ar ? "ar" : "en"]}</span>
                      </button>
                    ))}
                  </div>
                  <p className={styles.rowSub}>{internetEnabled ? t.internetBg : t.internetOff}</p>
                  {wallpaper.credit ? <p className={styles.rowSub}>{t.credit}: {wallpaper.credit}</p> : null}
                </>)}
    </>
  );

  return (
    <div className={`${styles.root} ${state.motion ? "" : styles.motionOff} ${view === "focus" ? `${styles.focusRoot} ${wallpaper.tone === "light" ? styles.toneLight : styles.toneDark}` : ""}`} dir={isRtl ? "rtl" : "ltr"} style={{ ["--scale" as string]: scale }}>
      {view === "focus" && <WallpaperLayer wallpaper={wallpaper} playing={state.isPlaying} motion={state.motion} progress={progress} />}
      <audio ref={audioRef} preload="auto" onEnded={onEnded} onTimeUpdate={onTimeUpdate} onLoadedMetadata={onLoadedMetadata} onError={() => dispatch({ type: "failed", status: "network_error" })} />

      <header className={styles.top}>
        <div className={styles.titleBlock}>
          <span className={styles.kicker}>{t.kicker}</span>
          <h1 className={styles.title} translate="no">{state.surah ? `${ar ? "سورة" : "Surah"} ${state.surah.arabicName}` : t.loading}</h1>
          <span className={styles.subtitle}>{state.surah ? `${state.surah.latinName} · ${num(state.surah.verseCount)} ${ar ? "آية" : "ayahs"}` : ""}</span>
        </div>
        <nav className={styles.topActions} aria-label="player panels">
          {(["surahs", "reciter", "translation", "tafsir", "settings"] as const).map((p) => (
            <button key={p} className={`${styles.chip} ${panel === p ? styles.chipActive : ""}`} onClick={() => togglePanel(p)} aria-pressed={panel === p}>
              {p === "surahs" ? "☰" : p === "reciter" ? "🎙" : p === "translation" ? "🌐" : p === "tafsir" ? "📖" : "⚙"} <span>{t[p]}</span>
            </button>
          ))}
          <button className={`${styles.chip} ${panel === "wallpaper" ? styles.chipActive : ""}`} onClick={() => togglePanel("wallpaper")} aria-pressed={panel === "wallpaper"}>🖼 <span>{t.wallpaper}</span></button>
          <span className={`${styles.segmented} ${styles.viewToggle}`}>
            <button className={view === "focus" ? "on" : ""} onClick={() => setView("focus")} title={t.focusView}>▣</button>
            <button className={view === "list" ? "on" : ""} onClick={() => setView("list")} title={t.listView}>☰</button>
          </span>
          <button className={`${styles.chip} ${panel === "notes" ? styles.chipActive : ""}`} onClick={() => togglePanel("notes")} aria-pressed={panel === "notes"}>📝 <span>{t.notes}</span></button>
          <button className={styles.chip} onClick={share} aria-label={t.share}>↗ <span>{t.share}</span></button>
          <Link className={styles.chip} href="/family" title={t.family}>{family.profile ? `${(family.profile as { avatar?: string }).avatar ?? "🌙"} ` : "👨‍👩‍👧 "}<span>{family.profile?.displayName ?? t.family}</span></Link>
        </nav>
      </header>

      <main className={`${view === "focus" ? styles.focusMain : styles.body} ${panel ? styles.split : ""}`}>
        {view === "focus" ? (
          <section className={styles.focusStage}>
            <div className={styles.focusCenter}>
              {state.status === "network_error" && (
                <div className={styles.error} role="alert"><p>{t.offline}</p><button className={styles.chip} onClick={() => state.surah && dispatch({ type: "open", surah: state.surah, index: state.index })}>{t.retry}</button></div>
              )}
              {segment && (
                <div className={styles.focusPlate}>
                  <p className={`${styles.focusAyah}`} lang="ar" translate="no" key={segment.key}>
                    {segment.words.length ? segment.words.map((w) => (
                      <span key={w.position} className={`${styles.word} ${state.wordPosition === w.position ? styles.wordActive : ""} ${wordTip?.key === segment.key && wordTip.position === w.position ? styles.wordTipped : ""}`} onClick={() => onWordClick(state.index, w.position)}>{w.text} </span>
                    )) : segment.arabic}
                    {segment.ayah && <span className={styles.marker} aria-hidden>﴿{toArabicDigits(segment.ayah.number)}﴾</span>}
                  </p>
                  {wordTip?.key === segment.key && (() => { const w = segment.words.find((x) => x.position === wordTip.position); const m = wordMeanings[segment.key]?.[wordTip.position - 1]; return w ? (
                    <div className={styles.wordTipBox} dir="auto"><strong lang="ar">{w.text}</strong>{m ? (<>{m.transliteration ? <em>{m.transliteration}</em> : null}{m.translation ? <span>· {m.translation}</span> : null}</>) : <span>{t.loading}</span>}</div>
                  ) : null; })()}
                  {segment.translation ? <p className={styles.focusTranslation} dir="auto">{segment.translation}</p> : null}
                  <div className={styles.focusMeta}>
                    <span>{segment.ayah ? `${t.ayah} ${num(segment.ayah.number)} ${t.of} ${num(state.surah?.verseCount ?? 0)}` : t.basmala}</span>
                    {segment.ayah && (<>
                      <button className={styles.tafsirBtn} onClick={() => { if (!family.profile) { setToast(t.noProfile); window.setTimeout(() => setToast(null), 2500); return; } family.dispatch({ type: "bookmark/toggle", verseKey: segment.ayah!.key }); }}>{isBookmarked(family.state, segment.ayah.key) ? `🔖 ${t.bookmarked}` : `🔖 ${t.bookmark}`}</button>
                      <button className={styles.tafsirBtn} onClick={() => setPanel("tafsir")}>📖 {t.tafsir}</button>
                      <button className={styles.tafsirBtn} onClick={() => setPanel("notes")}>📝 {t.notes}</button>
                      <button className={styles.tafsirBtn} onClick={() => setRepeat({ mode: state.repeat.mode === "ayah" ? "off" : "ayah", count: 3 })}>↻ {t.repeatAyah}{state.repeat.mode === "ayah" ? " ✓" : ""}</button>
                    </>)}
                  </div>
                  {state.segments[state.index + 1] && <div className={styles.focusNext} lang="ar" translate="no">{t.nextUp}: {state.segments[state.index + 1].arabic}</div>}
                </div>
              )}
              {!segment && state.status === "loading" && <p className={styles.rowSub}>{t.loading}</p>}
            </div>
          </section>
        ) : (
        <div className={styles.scroll}>
          {state.status === "network_error" && (
            <div className={styles.error} role="alert">
              <p>{t.offline}</p>
              <button className={styles.chip} onClick={() => state.surah && dispatch({ type: "open", surah: state.surah, index: state.index })}>{t.retry}</button>
            </div>
          )}
          <div className={styles.stage}>
            {state.segments.map((seg, i) => {
              const active = i === state.index;
              const isBasmala = !seg.ayah;
              const inRange = state.repeat.mode === "range" && i >= state.repeat.from && i <= state.repeat.to;
              return (
                <article key={seg.key} id={`seg-${seg.key}`} className={`${styles.segment} ${active ? styles.segmentActive : ""} ${inRange ? styles.segmentRange : ""}`} aria-current={active ? "true" : undefined}
                  onClick={() => { seekFromTimeRef.current = false; dispatch({ type: "seek", index: i }); dispatch({ type: "play" }); }}>
                  <p className={`${styles.arabic} ${isBasmala ? styles.basmala : ""}`} lang="ar" translate="no">
                    {seg.words.length ? seg.words.map((w) => (
                      <span key={w.position}
                        className={`${styles.word} ${active && state.wordPosition === w.position ? styles.wordActive : ""} ${wordTip?.key === seg.key && wordTip.position === w.position ? styles.wordTipped : ""}`}
                        onClick={(e) => { e.stopPropagation(); onWordClick(i, w.position); }}>
                        {w.text}{" "}
                      </span>
                    )) : seg.arabic}
                    {seg.ayah && <span className={styles.marker} aria-hidden>﴿{toArabicDigits(seg.ayah.number)}﴾</span>}
                  </p>
                  {wordTip?.key === seg.key && (() => {
                    const w = seg.words.find((x) => x.position === wordTip.position);
                    const m = wordMeanings[seg.key]?.[wordTip.position - 1];
                    return w ? (
                      <div className={styles.wordTipBox} dir="auto">
                        <strong lang="ar">{w.text}</strong>
                        {m ? (<>{m.transliteration ? <em>{m.transliteration}</em> : null}{m.translation ? <span>· {m.translation}</span> : null}</>) : <span>{t.loading}</span>}
                      </div>
                    ) : null;
                  })()}
                  {seg.translation && <p className={styles.translation} dir="auto">{seg.translation}</p>}
                  <div className={styles.segmentMeta}>
                    <span>{isBasmala ? t.basmala : `${t.ayah} ${num(seg.ayah!.number)} ${t.of} ${num(state.surah?.verseCount ?? 0)}`}</span>
                    {!isBasmala && (
                      <span className={styles.segmentActions}>
                        <button className={styles.tafsirBtn} onClick={(e) => { e.stopPropagation(); if (!family.profile) { setToast(t.noProfile); window.setTimeout(() => setToast(null), 2500); return; } family.dispatch({ type: "bookmark/toggle", verseKey: seg.ayah!.key }); }} aria-pressed={isBookmarked(family.state, seg.ayah!.key)}>
                          {isBookmarked(family.state, seg.ayah!.key) ? `🔖 ${t.bookmarked}` : `🔖 ${t.bookmark}`}
                        </button>
                        <button className={styles.tafsirBtn} onClick={(e) => { e.stopPropagation(); dispatch({ type: "seek", index: i }); setPanel("notes"); }}>📝 {t.notes}{notesFor(family.state, family.profile?.id ?? "").filter((n) => n.verseKey === seg.ayah!.key).length ? " •" : ""}</button>
                        <button className={styles.tafsirBtn} onClick={(e) => { e.stopPropagation(); setRepeat({ mode: "ayah", count: state.repeat.mode === "ayah" ? state.repeat.count : 3 }); dispatch({ type: "seek", index: i }); dispatch({ type: "play" }); }}>↻ {t.repeatAyah}</button>
                        <button className={styles.tafsirBtn} onClick={(e) => { e.stopPropagation(); dispatch({ type: "seek", index: i }); setPanel("tafsir"); }}>{t.tafsir}</button>
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        )}
        {panel && (
          <aside className={styles.sidePanel} role="complementary" aria-label={panelTitle(panel)}>
            <div className={styles.panelHead}>
              <span>{panelTitle(panel)}</span>
              <button className={styles.chip} onClick={() => setPanel(null)}>{t.close}</button>
            </div>
            <div className={styles.panelBody}>
              {panel === "notes" ? (<>
                {!family.profile ? (
                  <p className={styles.rowSub}><Link href="/family" className={styles.tafsirBtn}>{t.noProfile}</Link></p>
                ) : !segment?.ayah ? <p className={styles.rowSub}>{t.basmalaNote}</p> : (
                  <>
                    <p className={styles.arabic} lang="ar" translate="no" style={{ fontSize: "1.2em" }}>{segment.arabic}</p>
                    <textarea className={styles.search} rows={4} placeholder={t.noteHint} value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} />
                    <button className={`${styles.chip} ${styles.chipActive}`} disabled={!noteDraft.trim()} onClick={() => { family.dispatch({ type: "note/save", verseKey: segment.ayah!.key, body: noteDraft }); setNoteDraft(""); }}>{t.saveNote}</button>
                    {notesFor(family.state, family.profile.id).filter((n) => n.verseKey === segment.ayah!.key).map((n) => (
                      <div key={n.id} className={styles.row} style={{ cursor: "default" }}>
                        <span className={styles.rowMain}><span style={{ whiteSpace: "pre-wrap" }}>{n.body}</span><span className={styles.rowSub}>{new Date(n.updatedAt).toLocaleString(locale)}</span></span>
                        <button className={styles.tafsirBtn} onClick={() => family.dispatch({ type: "note/remove", id: n.id })}>{t.deleteNote}</button>
                      </div>
                    ))}
                    <div className={styles.kicker} style={{ marginTop: 12 }}>{t.library}</div>
                    {bookmarksFor(family.state, family.profile.id).slice(0, 12).map((b) => (
                      <button key={b.id} className={styles.row} onClick={() => { const [s2, a2] = b.verseKey.split(":"); if (Number(s2) === state.surah?.number) { const idx = state.segments.findIndex((x) => x.key === b.verseKey); if (idx >= 0) { seekFromTimeRef.current = false; dispatch({ type: "seek", index: idx }); } } else openSurahNumber(Number(s2), false); void a2; }}>
                        <span>🔖 {b.verseKey}</span>
                      </button>
                    ))}
                  </>
                )}
              </>) : panelBody(panel)}
            </div>
          </aside>
        )}
      </main>

      <footer className={styles.controls}>
        <div className={styles.controlsInner}>
          <div className={styles.nowPlaying}>
            <span translate="no">{segment ? (segment.ayah ? `${state.surah?.arabicName} · ${t.ayah} ${num(segment.ayah.number)}` : t.basmala) : ""}</span>
            <span>{state.reciter ? (ar ? state.reciter.arabicName : state.reciter.latinName) : ""}{state.repeat.mode === "ayah" && state.repeat.count !== Infinity ? ` · ${num(state.repeatRemaining)} ${t.remaining}` : ""}</span>
          </div>
          <div className={styles.progress} aria-hidden><div className={styles.progressBar} style={{ width: `${Math.round(progress * 100)}%` }} /></div>
          <div className={styles.buttons}>
            <button className={styles.iconBtn} aria-label={t.restart} title={t.restart} onClick={() => { seekFromTimeRef.current = false; dispatch({ type: "seek", index: 0 }); dispatch({ type: "play" }); }}>↺</button>
            <button className={styles.iconBtn} aria-label={t.prevAyah} title={t.prevAyah} onClick={() => { seekFromTimeRef.current = false; dispatch({ type: "prev" }); }}>{isRtl ? "⏭" : "⏮"}</button>
            <button className={`${styles.iconBtn} ${styles.playBtn}`} aria-label={state.isPlaying ? t.pause : t.play} onClick={() => dispatch({ type: "toggle" })} disabled={!desiredSrc}>{state.isPlaying ? "❚❚" : "▶"}</button>
            <button className={styles.iconBtn} aria-label={t.nextAyah} title={t.nextAyah} onClick={() => { seekFromTimeRef.current = false; dispatch({ type: "next" }); }}>{isRtl ? "⏮" : "⏭"}</button>
            <button className={styles.iconBtn} aria-label={t.nextSurah} title={t.nextSurah} onClick={() => state.surah && openSurahNumber(nextSurahNumber(state.surah.number), state.isPlaying)}>»</button>
          </div>
          <div className={styles.status} aria-live="polite">{statusLine}</div>
        </div>
      </footer>
      {toast && <div className={styles.toast} role="status">{toast}</div>}
    </div>
  );
}
