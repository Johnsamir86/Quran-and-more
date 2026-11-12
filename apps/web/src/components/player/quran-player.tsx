"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";

import {
  NO_TRANSLATION,
  PLAYER_STORAGE_KEYS,
  STATIONS,
  TEXT_SIZE_SCALE,
  currentSegment,
  initialPlayerState,
  isLastSegment,
  nextSurahNumber,
  playerReducer,
  resolveLocale,
  type PlayerReciter,
  type PlayerState,
  type PlayerSurah,
  type PlayerTranslation,
  type Station,
  type TextSize,
} from "@qam/core";

import {
  fetchPlayerSurah,
  fetchReciters,
  fetchSurahs,
  fetchTafsir,
  fetchTranslations,
} from "@/lib/player-client";

import styles from "./player.module.css";

/* ------------------------------------------------------------------ */
/* Copy (Arabic first, English fallback)                               */
/* ------------------------------------------------------------------ */

const COPY = {
  ar: {
    kicker: "القرآن الكريم", surahs: "السور", reciter: "القارئ", translation: "الترجمة", tafsir: "التفسير",
    settings: "الإعدادات", stations: "الإذاعة", play: "تشغيل", pause: "إيقاف مؤقت", nextAyah: "الآية التالية",
    prevAyah: "الآية السابقة", nextSurah: "السورة التالية", repeat: "إعادة السورة", retry: "إعادة المحاولة",
    close: "إغلاق", none: "النص العربي وحده", textSize: "حجم النص", autoAdvance: "الانتقال التلقائي إلى السورة التالية",
    motion: "حركة وتمرير تلقائي", small: "صغير", medium: "متوسط", large: "كبير", ayah: "الآية", of: "من",
    basmala: "البسملة", basmalaNote: "البسملة ليست آية من هذه السورة، ولا تفسير لها هنا.", loading: "جارٍ التحميل…",
    offline: "تعذّر الاتصال بخدمة المحتوى. تحقق من اتصالك ثم أعد المحاولة. إعداداتك محفوظة.",
    unavailable: "غير متاح لهذه الآية", listenWith: "الاستماع بصوت", riwayah: "رواية", allLanguages: "كل اللغات",
    search: "بحث عن سورة…", ended: "اكتملت سورة", playingStation: "قيد التشغيل", tafsirSource: "التفسير",
  },
  en: {
    kicker: "The Noble Quran", surahs: "Surahs", reciter: "Reciter", translation: "Translation", tafsir: "Tafsir",
    settings: "Settings", stations: "Radio", play: "Play", pause: "Pause", nextAyah: "Next ayah",
    prevAyah: "Previous ayah", nextSurah: "Next surah", repeat: "Repeat surah", retry: "Try again",
    close: "Close", none: "Arabic text only", textSize: "Text size", autoAdvance: "Auto-advance to the next surah",
    motion: "Motion and auto-scroll", small: "Small", medium: "Medium", large: "Large", ayah: "Ayah", of: "of",
    basmala: "Basmala", basmalaNote: "The Basmala is not an ayah of this surah, so there is no tafsir here.", loading: "Loading…",
    offline: "Could not reach the content service. Check your connection and try again. Your settings are saved.",
    unavailable: "not available for this ayah", listenWith: "Listen with", riwayah: "Riwayah", allLanguages: "All languages",
    search: "Search a surah…", ended: "Completed surah", playingStation: "Now playing", tafsirSource: "Tafsir",
  },
} as const;

/** Default tafsir per UI language. Prelive has 926 (Jalalayn, ar) and 169 (Ibn Kathir, en). */
const DEFAULT_TAFSIR: Record<string, string> = { ar: "926", en: "169" };

const readStorage = <T,>(key: string, fallback: T): T => {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};
const writeStorage = (key: string, value: unknown) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode */
  }
};

const toArabicDigits = (n: number) => n.toLocaleString("ar-EG", { useGrouping: false });

interface Props {
  initialSurah?: number;
  profileGender?: "male" | "female" | "unspecified";
}

export default function QuranPlayer({ initialSurah, profileGender = "unspecified" }: Props) {
  const locale = useMemo(() => resolveLocale(typeof navigator !== "undefined" ? navigator.language : "ar"), []);
  const t = COPY[locale === "ar" ? "ar" : "en"];
  const isRtl = locale === "ar" || locale === "ur" || locale === "fa";

  const [state, dispatch] = useReducer(playerReducer, undefined, () =>
    initialPlayerState({
      translation: NO_TRANSLATION,
      textSize: "medium",
    }),
  );
  const [surahs, setSurahs] = useState<PlayerSurah[]>([]);
  const [reciters, setReciters] = useState<PlayerReciter[]>([]);
  const [translations, setTranslations] = useState<PlayerTranslation[]>([]);
  const [languageFilter, setLanguageFilter] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [progress, setProgress] = useState(0);
  const [station, setStation] = useState<Station | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef<PlayerState>(state);
  stateRef.current = state;

  /* ---------- bootstrap: catalogue + persisted preferences ---------- */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [s, r, tr] = await Promise.all([fetchSurahs(locale), fetchReciters(profileGender), fetchTranslations()]);
        if (cancelled) return;
        setSurahs(s);
        setReciters(r);
        setTranslations(tr);

        const savedReciter = readStorage<number | null>(PLAYER_STORAGE_KEYS.reciter, null);
        const reciter = r.find((x) => x.id === savedReciter) ?? r.find((x) => x.id === 7) ?? r[0];
        if (reciter) dispatch({ type: "reciter", reciter });

        const savedTranslation = readStorage<string | null>(PLAYER_STORAGE_KEYS.translation, null);
        const translation = savedTranslation === "none" ? NO_TRANSLATION : tr.find((x) => x.id === savedTranslation) ?? NO_TRANSLATION;
        dispatch({ type: "translation", translation });

        dispatch({ type: "textSize", size: readStorage<TextSize>(PLAYER_STORAGE_KEYS.textSize, "medium") });
        dispatch({ type: "autoAdvance", value: readStorage<boolean>(PLAYER_STORAGE_KEYS.autoAdvance, true) });
        dispatch({ type: "motion", value: readStorage<boolean>(PLAYER_STORAGE_KEYS.motion, true) });

        const resume = readStorage<{ surahNumber: number; segment: number } | null>(PLAYER_STORAGE_KEYS.resume, null);
        const first = s.find((x) => x.number === (initialSurah ?? resume?.surahNumber)) ?? s[0];
        if (first) dispatch({ type: "open", surah: first, index: initialSurah ? 0 : resume?.segment ?? 0, play: false });
        setHydrated(true);
      } catch {
        dispatch({ type: "failed", status: "network_error" });
        setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- persist preferences ---------- */
  useEffect(() => {
    if (!hydrated) return;
    if (state.reciter) writeStorage(PLAYER_STORAGE_KEYS.reciter, state.reciter.id);
    writeStorage(PLAYER_STORAGE_KEYS.translation, state.translation.id);
    writeStorage(PLAYER_STORAGE_KEYS.textSize, state.textSize);
    writeStorage(PLAYER_STORAGE_KEYS.autoAdvance, state.autoAdvance);
    writeStorage(PLAYER_STORAGE_KEYS.motion, state.motion);
    if (state.resume) writeStorage(PLAYER_STORAGE_KEYS.resume, state.resume);
  }, [hydrated, state.reciter, state.translation, state.textSize, state.autoAdvance, state.motion, state.resume]);

  /* ---------- load segments whenever surah / reciter / translation change ---------- */
  const loadKey = `${state.surah?.number ?? 0}|${state.reciter?.id ?? 0}|${state.translation.id}`;
  useEffect(() => {
    if (!state.surah || !state.reciter) return;
    let cancelled = false;
    const surah = state.surah;
    const keepIndex = stateRef.current.index;
    if (stateRef.current.status !== "loading") dispatch({ type: "open", surah, index: keepIndex, play: stateRef.current.isPlaying });
    fetchPlayerSurah(surah.number, state.reciter.id, state.translation.apiId)
      .then((payload) => {
        if (cancelled) return;
        dispatch({ type: "loaded", segments: payload.segments });
      })
      .catch((e: Error & { status?: number }) => {
        if (cancelled) return;
        dispatch({ type: "failed", status: e.status && e.status < 500 ? "unavailable" : "network_error" });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadKey]);

  /* ---------- audio element follows (segment, isPlaying) ---------- */
  const segment = currentSegment(state);
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!segment?.audioUrl) return;
    if (audio.src !== segment.audioUrl) {
      audio.src = segment.audioUrl;
      audio.load();
      setProgress(0);
    }
    if (state.isPlaying) {
      audio.play().catch(() => dispatch({ type: "pause" }));
    } else {
      audio.pause();
    }
  }, [segment?.audioUrl, state.isPlaying, segment]);

  const openSurahNumber = useCallback(
    (number: number, play: boolean) => {
      const next = surahs.find((s) => s.number === number);
      if (next) dispatch({ type: "open", surah: next, index: 0, play });
    },
    [surahs],
  );

  const onEnded = useCallback(() => {
    const s = stateRef.current;
    if (!isLastSegment(s)) {
      dispatch({ type: "next" });
      return;
    }
    if (station && s.surah) {
      const i = station.surahs.indexOf(s.surah.number);
      const nextInStation = station.surahs[i + 1] ?? (station.loop ? station.surahs[0] : undefined);
      if (nextInStation) {
        openSurahNumber(nextInStation, true);
        return;
      }
    }
    if (s.autoAdvance && s.surah) {
      openSurahNumber(nextSurahNumber(s.surah.number), true);
      return;
    }
    dispatch({ type: "ended" });
  }, [openSurahNumber, station]);

  /* ---------- auto-scroll the active segment ---------- */
  useEffect(() => {
    if (!state.motion || !segment) return;
    const el = document.getElementById(`seg-${segment.key}`);
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [segment, state.motion]);

  /* ---------- tafsir for the current segment ---------- */
  const tafsirId = DEFAULT_TAFSIR[locale] ?? DEFAULT_TAFSIR.en;
  useEffect(() => {
    if (state.panel !== "tafsir" || !segment?.ayah) return;
    if (state.tafsir?.key === segment.key) return;
    let cancelled = false;
    dispatch({ type: "tafsirLoading" });
    fetchTafsir(tafsirId, segment.ayah.key)
      .then((res) => !cancelled && dispatch({ type: "tafsir", key: segment.key, text: res?.text ?? null }))
      .catch(() => !cancelled && dispatch({ type: "tafsir", key: segment.key, text: null }));
    return () => {
      cancelled = true;
    };
  }, [state.panel, segment, state.tafsir?.key, tafsirId]);

  /* ---------- keyboard shortcuts (also good for TV remotes) ---------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      if (e.key === " " || e.key === "MediaPlayPause") { e.preventDefault(); dispatch({ type: "toggle" }); }
      if (e.key === "ArrowRight" || e.key === "MediaTrackNext") dispatch({ type: isRtl ? "prev" : "next" });
      if (e.key === "ArrowLeft" || e.key === "MediaTrackPrevious") dispatch({ type: isRtl ? "next" : "prev" });
      if (e.key === "Escape") dispatch({ type: "panel", panel: state.panel });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isRtl, state.panel]);

  /* ---------- derived ---------- */
  const filteredSurahs = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return surahs;
    return surahs.filter((s) => s.arabicName.includes(q) || s.latinName.toLowerCase().includes(q) || String(s.number) === q);
  }, [surahs, query]);

  const languages = useMemo(() => Array.from(new Set(translations.map((x) => x.languageName))).sort(), [translations]);
  const filteredTranslations = languageFilter === "all" ? translations : translations.filter((x) => x.languageName === languageFilter);

  const ayahIndex = segment?.ayah ? segment.ayah.number : 0;
  const scale = TEXT_SIZE_SCALE[state.textSize];

  const statusLine = (() => {
    if (state.status === "loading") return t.loading;
    if (state.status === "network_error") return t.offline;
    if (state.status === "unavailable") return t.unavailable;
    if (state.status === "ended" && state.surah) return `${t.ended} ${state.surah.arabicName}`;
    if (station) return `${t.playingStation}: ${station.title[locale === "ar" ? "ar" : "en"]}`;
    return state.reciter ? `${t.listenWith} ${locale === "ar" ? state.reciter.arabicName : state.reciter.latinName} · ${t.riwayah} ${state.reciter.riwayah}` : "";
  })();

  return (
    <div className={`${styles.root} ${state.motion ? "" : styles.motionOff}`} dir={isRtl ? "rtl" : "ltr"} style={{ ["--scale" as string]: scale }}>
      <audio
        ref={audioRef}
        preload="auto"
        onEnded={onEnded}
        onTimeUpdate={(e) => {
          const a = e.currentTarget;
          setProgress(a.duration ? a.currentTime / a.duration : 0);
        }}
        onError={() => dispatch({ type: "failed", status: "network_error" })}
      />

      <header className={styles.top}>
        <div className={styles.titleBlock}>
          <span className={styles.kicker}>{t.kicker}</span>
          <h1 className={styles.title} translate="no">
            {state.surah ? `${locale === "ar" ? "سورة" : "Surah"} ${state.surah.arabicName}` : t.loading}
          </h1>
          <span className={styles.subtitle}>
            {state.surah ? `${state.surah.latinName} · ${locale === "ar" ? toArabicDigits(state.surah.verseCount) : state.surah.verseCount} ${locale === "ar" ? "آية" : "ayahs"}` : ""}
          </span>
        </div>
        <nav className={styles.topActions} aria-label="player panels">
          {(["surahs", "reciter", "translation", "tafsir", "settings"] as const).map((p) => (
            <button key={p} className={`${styles.chip} ${state.panel === p ? styles.chipActive : ""}`} onClick={() => dispatch({ type: "panel", panel: p })} aria-pressed={state.panel === p}>
              {p === "surahs" ? "☰" : p === "reciter" ? "🎙" : p === "translation" ? "🌐" : p === "tafsir" ? "📖" : "⚙"} <span>{t[p]}</span>
            </button>
          ))}
        </nav>
      </header>

      <main className={styles.body}>
        <div className={styles.scroll} ref={scrollRef}>
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
              return (
                <article
                  key={seg.key}
                  id={`seg-${seg.key}`}
                  className={`${styles.segment} ${active ? styles.segmentActive : ""}`}
                  onClick={() => { dispatch({ type: "seek", index: i }); dispatch({ type: "play" }); }}
                  aria-current={active ? "true" : undefined}
                >
                  <p className={`${styles.arabic} ${isBasmala ? styles.basmala : ""}`} lang="ar" translate="no">
                    {seg.arabic}
                    {seg.ayah && <span className={styles.marker} aria-hidden>﴿{toArabicDigits(seg.ayah.number)}﴾</span>}
                  </p>
                  {seg.translation && <p className={styles.translation} dir="auto">{seg.translation}</p>}
                  <div className={styles.segmentMeta}>
                    <span>{isBasmala ? t.basmala : `${t.ayah} ${locale === "ar" ? toArabicDigits(seg.ayah!.number) : seg.ayah!.number} ${t.of} ${locale === "ar" ? toArabicDigits(state.surah?.verseCount ?? 0) : state.surah?.verseCount}`}</span>
                    {!isBasmala && (
                      <button className={styles.tafsirBtn} onClick={(e) => { e.stopPropagation(); dispatch({ type: "seek", index: i }); if (state.panel !== "tafsir") dispatch({ type: "panel", panel: "tafsir" }); }}>
                        {t.tafsir}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        {state.panel && (
          <div className={styles.panel} onClick={() => dispatch({ type: "panel", panel: state.panel })}>
            <aside className={styles.panelSheet} onClick={(e) => e.stopPropagation()} role="dialog" aria-label={t[state.panel]}>
              <div className={styles.panelHead}>
                <span>{t[state.panel]}</span>
                <button className={styles.chip} onClick={() => dispatch({ type: "panel", panel: state.panel })}>{t.close}</button>
              </div>
              <div className={styles.panelBody}>
                {state.panel === "surahs" && (
                  <>
                    <input className={styles.search} placeholder={t.search} value={query} onChange={(e) => setQuery(e.target.value)} />
                    <div className={styles.kicker}>{t.stations}</div>
                    {STATIONS.map((st) => (
                      <button key={st.id} className={`${styles.row} ${station?.id === st.id ? styles.rowActive : ""}`} onClick={() => { setStation(st); openSurahNumber(st.surahs[0], true); dispatch({ type: "panel", panel: "surahs" }); }}>
                        <span className={styles.rowMain}>
                          <span>{st.title[locale === "ar" ? "ar" : "en"]}</span>
                          <span className={styles.rowSub}>{st.subtitle[locale === "ar" ? "ar" : "en"]}</span>
                        </span>
                        <span>▶</span>
                      </button>
                    ))}
                    <div className={styles.kicker}>{t.surahs}</div>
                    {filteredSurahs.map((s) => (
                      <button key={s.number} className={`${styles.row} ${state.surah?.number === s.number ? styles.rowActive : ""}`} onClick={() => { setStation(null); openSurahNumber(s.number, true); }}>
                        <span className={styles.rowMain}>
                          <span translate="no">{locale === "ar" ? toArabicDigits(s.number) : s.number}. {s.arabicName}</span>
                          <span className={styles.rowSub}>{s.latinName} · {s.verseCount}</span>
                        </span>
                      </button>
                    ))}
                  </>
                )}

                {state.panel === "reciter" && reciters.map((r) => (
                  <button key={r.id} className={`${styles.row} ${state.reciter?.id === r.id ? styles.rowActive : ""}`} onClick={() => dispatch({ type: "reciter", reciter: r })}>
                    <span className={styles.rowMain}>
                      <span>{locale === "ar" ? r.arabicName : r.latinName}</span>
                      <span className={styles.rowSub}>{t.riwayah} {r.riwayah}{r.style ? ` · ${r.style}` : ""}</span>
                    </span>
                  </button>
                ))}

                {state.panel === "translation" && (
                  <>
                    <select className={styles.search} value={languageFilter} onChange={(e) => setLanguageFilter(e.target.value)}>
                      <option value="all">{t.allLanguages}</option>
                      {languages.map((l) => <option key={l} value={l}>{l}</option>)}
                    </select>
                    <button className={`${styles.row} ${state.translation.id === "none" ? styles.rowActive : ""}`} onClick={() => dispatch({ type: "translation", translation: NO_TRANSLATION })}>
                      <span>{t.none}</span>
                    </button>
                    {filteredTranslations.map((tr) => (
                      <button key={tr.id} className={`${styles.row} ${state.translation.id === tr.id ? styles.rowActive : ""}`} onClick={() => dispatch({ type: "translation", translation: tr })}>
                        <span className={styles.rowMain}>
                          <span>{tr.label}</span>
                          <span className={styles.rowSub}>{tr.languageName}</span>
                        </span>
                      </button>
                    ))}
                  </>
                )}

                {state.panel === "tafsir" && (
                  !segment?.ayah ? <p className={styles.rowSub}>{t.basmalaNote}</p>
                  : state.tafsirLoading ? <p className={styles.rowSub}>{t.loading}</p>
                  : state.tafsir?.key === segment.key && state.tafsir.text ? (
                    <>
                      <p className={styles.arabic} lang="ar" translate="no" style={{ fontSize: "1.3em" }}>{segment.arabic}</p>
                      <div className={styles.tafsirText} dir={locale === "ar" ? "rtl" : "ltr"}>{state.tafsir.text}</div>
                    </>
                  ) : <p className={styles.rowSub}>{t.tafsir} {t.unavailable}</p>
                )}

                {state.panel === "settings" && (
                  <>
                    <div className={styles.settingRow}>
                      <span>{t.textSize}</span>
                      <span className={styles.segmented}>
                        {(["small", "medium", "large"] as TextSize[]).map((sz) => (
                          <button key={sz} className={state.textSize === sz ? "on" : ""} onClick={() => dispatch({ type: "textSize", size: sz })}>{t[sz]}</button>
                        ))}
                      </span>
                    </div>
                    <label className={styles.settingRow}>
                      <span>{t.autoAdvance}</span>
                      <input type="checkbox" checked={state.autoAdvance} onChange={(e) => dispatch({ type: "autoAdvance", value: e.target.checked })} />
                    </label>
                    <label className={styles.settingRow}>
                      <span>{t.motion}</span>
                      <input type="checkbox" checked={state.motion} onChange={(e) => dispatch({ type: "motion", value: e.target.checked })} />
                    </label>
                  </>
                )}
              </div>
            </aside>
          </div>
        )}
      </main>

      <footer className={styles.controls}>
        <div className={styles.controlsInner}>
          <div className={styles.nowPlaying}>
            <span translate="no">{segment ? (segment.ayah ? `${state.surah?.arabicName} · ${t.ayah} ${locale === "ar" ? toArabicDigits(ayahIndex) : ayahIndex}` : t.basmala) : ""}</span>
            <span>{state.reciter ? (locale === "ar" ? state.reciter.arabicName : state.reciter.latinName) : ""}</span>
          </div>
          <div className={styles.progress} aria-hidden><div className={styles.progressBar} style={{ width: `${Math.round(progress * 100)}%` }} /></div>
          <div className={styles.buttons}>
            <button className={styles.iconBtn} aria-label={t.repeat} title={t.repeat} onClick={() => { dispatch({ type: "seek", index: 0 }); dispatch({ type: "play" }); }}>↺</button>
            <button className={styles.iconBtn} aria-label={t.prevAyah} title={t.prevAyah} onClick={() => dispatch({ type: "prev" })}>{isRtl ? "⏭" : "⏮"}</button>
            <button className={`${styles.iconBtn} ${styles.playBtn}`} aria-label={state.isPlaying ? t.pause : t.play} onClick={() => dispatch({ type: "toggle" })} disabled={!segment?.audioUrl}>
              {state.isPlaying ? "❚❚" : "▶"}
            </button>
            <button className={styles.iconBtn} aria-label={t.nextAyah} title={t.nextAyah} onClick={() => dispatch({ type: "next" })}>{isRtl ? "⏮" : "⏭"}</button>
            <button className={styles.iconBtn} aria-label={t.nextSurah} title={t.nextSurah} onClick={() => state.surah && openSurahNumber(nextSurahNumber(state.surah.number), state.isPlaying)}>»</button>
          </div>
          <div className={styles.status} aria-live="polite">{statusLine}</div>
        </div>
      </footer>
    </div>
  );
}
