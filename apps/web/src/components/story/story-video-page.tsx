"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { NATURE_WALLPAPERS, VIDEO_WALLPAPERS, languageNameForLocale, type PlayerAyah, type PlayerReciter, type PlayerSegment, type PlayerSurah, type PlayerTranslation } from "@qam/core";

import { useI18n } from "@/lib/i18n";
import { SOLID_BACKGROUNDS, STORY_FONTS, ensureStoryFonts, loadStoryPrefs, localMedia, resolveBg, saveStoryPrefs, type StoryBg, type StoryFont, type StoryPrefs } from "@/lib/story-tools";
import { canRenderVideo, canShareVideo, probePlayback, renderCaps, renderStoryVideo, shareVideoFile, videoHasAudio, type RenderCaps, type VideoPage, type VideoResult } from "@/lib/story-video";

import styles from "./story.module.css";

interface Payload { surah: PlayerSurah; segments: PlayerSegment[] }

/**
 * Video studio for the ayah story: /story/video?surah=18&from=1&to=10&reciter=a7&bg=v-sea-shore
 * Renders recitation + words lit as recited + background to an MP4 and hands it to the
 * system share sheet (Instagram, TikTok, WhatsApp, Reels) or downloads it. The mobile apps
 * open this page in their in-app browser, so one renderer serves every platform.
 */
export default function StoryVideoPage() {
  const { locale, m, isRtl, ar } = useI18n();
  const t = m.story;
  const params = useSearchParams();
  const surah = Math.min(114, Math.max(1, Number(params.get("surah") ?? 1) || 1));
  const from = Math.max(1, Number(params.get("from") ?? 1) || 1);
  const to = Math.max(from, Number(params.get("to") ?? from) || from);
  const embedded = params.get("embed") === "1"; // opened from the mobile app
  const auto = params.get("auto") === "1"; // start rendering as soon as the ayat are in
  const debug = params.get("debug") === "1"; // show encoder capabilities and the playback probe
  const [caps, setCaps] = useState<RenderCaps | null>(null);
  const [probe, setProbe] = useState<string | null>(null);
  useEffect(() => { if (debug) renderCaps().then(setCaps).catch(() => undefined); }, [debug]);

  const [prefs, setPrefs] = useState<StoryPrefs>(() => ({ ...loadStoryPrefsSafe(), ...fromParams(params) }));
  const [reciters, setReciters] = useState<PlayerReciter[]>([]);
  const [reciterId, setReciterId] = useState<string | null>(params.get("reciter"));
  const [payload, setPayload] = useState<Payload | null>(null);
  const [highlight, setHighlight] = useState(params.get("words") !== "0");
  const [quality, setQuality] = useState<"high" | "medium">(params.get("q") === "medium" ? "medium" : "high");
  const [progress, setProgress] = useState<{ fraction: number; stage: "audio" | "render" | "encode" } | null>(null);
  const [result, setResult] = useState<(VideoResult & { url: string }) | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioOk, setAudioOk] = useState<boolean | null>(null);
  const abort = useRef<AbortController | null>(null);
  const supported = typeof window !== "undefined" && canRenderVideo();

  useEffect(() => { ensureStoryFonts(); }, []);
  const update = (patch: Partial<StoryPrefs>) => setPrefs((p) => { const next = { ...p, ...patch }; saveStoryPrefs(next); return next; });

  useEffect(() => {
    fetch("/api/public/v1/reciters?profileGender=unspecified").then((r) => r.json()).then((j: { reciters: PlayerReciter[] }) => {
      const list = j.reciters.filter((r) => r.recitationId !== null);
      setReciters(list);
      // Default to Mishari Alafasy (recitation 7): the catalogue carries word timings for every ayah of his.
      setReciterId((cur) => (cur && list.some((r) => r.id === cur || `a${r.recitationId}` === cur) ? cur : (prefs.reciter && list.some((r) => r.id === prefs.reciter) ? prefs.reciter : (list.find((r) => r.recitationId === 7) ?? list[0])?.id ?? null)));
    }).catch(() => setError(m.common.unavailable));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reciter = useMemo(() => reciters.find((r) => r.id === reciterId || `a${r.recitationId}` === reciterId) ?? null, [reciters, reciterId]);

  useEffect(() => {
    if (!reciter) return;
    let cancelled = false;
    setPayload(null); setResult(null);
    (async () => {
      try {
        const tr = ((await (await fetch("/api/public/v1/translations")).json()) as { translations: PlayerTranslation[] }).translations;
        const want = languageNameForLocale(locale);
        const translation = ar ? null : tr.find((x) => x.languageName?.toLowerCase() === want) ?? tr.find((x) => x.id === "85") ?? tr[0] ?? null;
        // Ask for both engines ("c7:a7"): the per-ayah files carry no word timings upstream, so they are
        // derived from the full-surah timeline of the same recording (see pages below).
        const param = [reciter.chapterReciterId !== null ? `c${reciter.chapterReciterId}` : null, reciter.recitationId !== null ? `a${reciter.recitationId}` : null].filter(Boolean).join(":");
        const j = (await (await fetch(`/api/public/v1/player/surah/${surah}?reciter=${encodeURIComponent(param)}&translation=${translation?.id ?? "none"}`)).json()) as Payload;
        if (!cancelled) setPayload(j);
      } catch { if (!cancelled) setError(m.common.unavailable); }
    })();
    return () => { cancelled = true; };
  }, [reciter, surah, locale, ar, m.common.unavailable]);

  const pages: VideoPage[] = useMemo(() => {
    if (!payload) return [];
    return payload.segments
      .filter((s): s is PlayerSegment & { ayah: PlayerAyah } => !!s.ayah && s.ayah.number >= from && s.ayah.number <= to && !!s.ayah.audioUrl)
      .map((s) => {
        const own = s.ayah.ayahWordTimings;
        const derived: [number, number, number][] = s.fromMs !== null && s.wordTimings.length ? s.wordTimings.map(([p, f, t]) => [p, f - (s.fromMs as number), t - (s.fromMs as number)] as [number, number, number]) : [];
        return { verseKey: s.ayah.key, arabic: s.ayah.arabic, words: s.ayah.words.map((w) => ({ position: w.position, text: w.text })), translation: s.ayah.translation, audioUrl: s.ayah.audioUrl!, wordTimings: own.length ? own : derived };
      });
  }, [payload, from, to]);
  const hasTimings = pages.some((p) => p.wordTimings.length > 0);
  const estimateMs = pages.reduce((a, p) => a + ((payload?.segments.find((s) => s.ayah?.key === p.verseKey)?.ayah?.durationMs) ?? 6000), 0) + pages.length * 700 + 2400;

  const bgResolved = useMemo(() => resolveBg(prefs.bg, NATURE_WALLPAPERS[surah % NATURE_WALLPAPERS.length].id), [prefs.bg, surah]);
  const tone: "light" | "dark" = prefs.tone === "auto" ? bgResolved.tone : prefs.tone;
  const surahName = payload ? (ar ? payload.surah.arabicName : payload.surah.latinName) : "";
  const reference = from === to ? `${surah}:${from}` : `${surah}:${from}-${to}`;
  const shareText = `${surahName} ${reference} · ${t.shareText}`;
  const studyUrl = typeof window !== "undefined" ? `${window.location.origin}/study/${surah}:${from}` : "";

  const render = async () => {
    if (!pages.length || !reciter) return;
    setError(null); setResult(null);
    abort.current?.abort(); abort.current = new AbortController();
    try {
      const opts = { pages, bg: bgResolved, font: prefs.font, size: prefs.size, tone, dim: prefs.dim, surahName, reciterName: ar ? reciter.arabicName : reciter.latinName, brand: m.common.appName, highlightWords: highlight, quality, signal: abort.current.signal, onProgress: (fraction: number, stage: "audio" | "render" | "encode") => setProgress({ fraction, stage }) };
      let r = await renderStoryVideo(opts);
      // Some Safari builds hand back a WebCodecs file without a usable audio track: check, and re-render by recording.
      let audible = await videoHasAudio(r.blob);
      if (audible === false && r.audioCodec === "aac") { r = await renderStoryVideo({ ...opts, forceMp3: true }); audible = await videoHasAudio(r.blob); }
      if (audible === false && r.engine === "webcodecs") { r = await renderStoryVideo({ ...opts, forceRecorder: true }); audible = await videoHasAudio(r.blob); }
      setAudioOk(audible);
      if (debug) probePlayback(r.blob).then((pr) => setProbe(`playback: audioTracks=${pr.audioTracks ?? "n/a"} decodedAudioBytes=${pr.decodedAudioBytes ?? "n/a"}${pr.error ? ` error=${pr.error}` : ""}`)).catch(() => undefined);
      setResult({ ...r, url: URL.createObjectURL(r.blob) });
    } catch (e) {
      if (!(e instanceof DOMException && e.name === "AbortError")) setError(t.videoUnsupported);
    } finally { setProgress(null); }
  };
  useEffect(() => () => { abort.current?.abort(); if (result) URL.revokeObjectURL(result.url); }, [result]);
  const autoStarted = useRef(false);
  useEffect(() => { if (auto && pages.length && reciter && supported && !autoStarted.current) { autoStarted.current = true; void render(); } }, [auto, pages.length, reciter, supported]); // eslint-disable-line react-hooks/exhaustive-deps

  const share = async () => { if (!result) return; const ok = await shareVideoFile(result, `ayah-${reference.replace(":", "-")}`, t.title, `${shareText}\n${studyUrl}`); if (!ok) setError(t.shareUnsupported); };

  const stageLabel = progress ? (progress.stage === "audio" ? m.common.loading : t.preparingVideo) : "";
  const rootStyle: React.CSSProperties = bgResolved.url ? { backgroundImage: `url(${bgResolved.url})` } : { backgroundImage: `linear-gradient(135deg, ${bgResolved.colors?.[0]}, ${bgResolved.colors?.[1]})` };

  return (
    <div className={`${styles.root} ${tone === "dark" ? styles.light : ""}`} style={rootStyle} dir={isRtl ? "rtl" : "ltr"}>
      {bgResolved.video ? <video className={styles.bgVideo} src={bgResolved.video} poster={bgResolved.url} autoPlay muted loop playsInline aria-hidden /> : null}
      <div className={styles.top}>
        <div className={styles.head}>
          <span>🎬 {t.shareVideo} · {surahName} {reference}</span>
          {embedded ? null : <Link href={`/story?surah=${surah}&from=${from}&to=${to}`} className={styles.close} aria-label={m.common.close}>✕</Link>}
        </div>
      </div>

      <div className={styles.stage}>
        <div className={styles.studio}>
          {!supported ? <div className={styles.hint}>{t.videoUnsupported}</div> : null}
          {debug ? <div className={styles.hint} style={{ textAlign: "start", fontFamily: "monospace", fontSize: "0.72rem", userSelect: "text" }}>{caps ? `caps: VideoEncoder=${caps.videoEncoder} AudioEncoder=${caps.audioEncoder} avc=${caps.avc} aac=${caps.aac} recorder=${caps.recorder}` : "caps: …"}{result ? ` | result: ${result.engine}/${result.audioCodec} ${(result.blob.size / 1e6).toFixed(1)}MB audible=${String(audioOk)}` : ""}{probe ? ` | ${probe}` : ""}</div> : null}
          {result ? (
            <video className={styles.videoPreview} src={result.url} controls playsInline />
          ) : (
            <div className={styles.studioCard}>
              <div className={styles.kicker}>{pages.length} {t.ayahRange} · ≈ {Math.round(estimateMs / 1000)} s</div>
              <div className={styles.arabic} lang="ar" translate="no" style={{ fontFamily: STORY_FONTS[prefs.font].family, fontSize: `calc(1.4rem * ${prefs.size})` }}>{pages[0]?.arabic ?? (payload ? m.common.unavailable : m.common.loading)}</div>
              {pages.length > 1 ? <div className={styles.hint}>…</div> : null}
              <div className={styles.hint}>{t.videoHint}</div>
              {payload && highlight && !hasTimings ? <div className={styles.hint}>⚠ {t.noWordTimings}</div> : null}
            </div>
          )}

          {progress ? (
            <div className={styles.progressWrap} role="progressbar" aria-valuenow={Math.round(progress.fraction * 100)} aria-valuemin={0} aria-valuemax={100}>
              <div className={styles.progressBar} style={{ width: `${Math.round(progress.fraction * 100)}%` }} />
              <span>{stageLabel} {Math.round(progress.fraction * 100)}%</span>
            </div>
          ) : null}
          {error ? <div className={styles.hint}>{error}</div> : null}

          <div className={styles.row} style={{ justifyContent: "center" }}>
            {!result ? <button className={`${styles.chip} ${styles.primaryBtn}`} onClick={render} disabled={!pages.length || !!progress || !supported}>🎬 {progress ? stageLabel : t.shareVideo}</button> : null}
            {progress ? <button className={styles.chip} onClick={() => abort.current?.abort()}>✕ {m.common.close}</button> : null}
            {result && canShareVideo(result.ext) ? <button className={`${styles.chip} ${styles.primaryBtn}`} onClick={share}>📤 {m.common.share}</button> : null}
            {result ? <a className={styles.chip} href={result.url} download={`ayah-${reference.replace(":", "-")}.${result.ext}`}>⬇ {result.ext.toUpperCase()} · {(result.blob.size / 1_000_000).toFixed(1)} MB · {result.engine === "webcodecs" ? "H.264" : "rec"} · {result.audioCodec.toUpperCase()}{audioOk === false ? " · 🔇" : audioOk ? " · 🔊" : " · 🔈?"}</a> : null}
            {result ? <button className={styles.chip} onClick={() => setResult(null)}>↺ {t.reset}</button> : null}
          </div>

          <div className={styles.group}>
            <div className={styles.label}>{t.reciter}</div>
            <select className={styles.opt} value={reciter?.id ?? ""} onChange={(e) => { setReciterId(e.target.value); update({ reciter: e.target.value }); }} aria-label={t.reciter}>
              {reciters.map((r) => <option key={r.id} value={r.id}>{ar ? r.arabicName : r.latinName}</option>)}
            </select>
          </div>
          <div className={styles.group}>
            <div className={styles.label}>{t.background} · {t.moving}</div>
            <div className={styles.thumbs}>
              {VIDEO_WALLPAPERS.map((w) => <button key={w.id} className={`${styles.thumb} ${prefs.bg?.kind === "video" && prefs.bg.id === w.id ? styles.thumbOn : ""}`} style={{ backgroundImage: `url(${localMedia(w.url)})` }} onClick={() => update({ bg: { kind: "video", id: w.id }, tone: "auto" })} aria-label={ar ? w.title.ar : w.title.en}><span>▶ {ar ? w.title.ar : w.title.en}</span></button>)}
            </div>
            <div className={styles.label}>{t.nature}</div>
            <div className={styles.thumbs}>
              {NATURE_WALLPAPERS.map((w) => <button key={w.id} className={`${styles.thumb} ${prefs.bg?.kind === "nature" && prefs.bg.id === w.id ? styles.thumbOn : ""}`} style={{ backgroundImage: `url(${w.url?.replace("w=1920", "w=400")})` }} onClick={() => update({ bg: { kind: "nature", id: w.id }, tone: "auto" })} aria-label={ar ? w.title.ar : w.title.en}><span>{ar ? w.title.ar : w.title.en}</span></button>)}
            </div>
            <div className={styles.row}>
              {SOLID_BACKGROUNDS.map((s) => <button key={s.id} className={`${styles.opt} ${prefs.bg?.kind === "solid" && prefs.bg.id === s.id ? styles.optOn : ""}`} style={{ background: `linear-gradient(135deg, ${s.colors[0]}, ${s.colors[1]})`, color: s.tone === "light" ? "#fff" : "#15201b" }} onClick={() => update({ bg: { kind: "solid", id: s.id }, tone: "auto" })}>{t.solid}</button>)}
            </div>
          </div>
          <div className={styles.group}>
            <div className={styles.label}>{t.font} · {t.size} {Math.round(prefs.size * 100)}%</div>
            <div className={styles.row}>{(Object.keys(STORY_FONTS) as StoryFont[]).map((f) => <button key={f} className={`${styles.opt} ${prefs.font === f ? styles.optOn : ""}`} style={{ fontFamily: STORY_FONTS[f].family }} onClick={() => update({ font: f })}>{STORY_FONTS[f].label} · بسم الله</button>)}</div>
            <input className={styles.range} type="range" min={0.7} max={1.6} step={0.05} value={prefs.size} onChange={(e) => update({ size: Number(e.target.value) })} aria-label={t.size} />
            <div className={styles.label}>{t.dim} · {Math.round(prefs.dim * 100)}%</div>
            <input className={styles.range} type="range" min={0} max={0.75} step={0.05} value={prefs.dim} onChange={(e) => update({ dim: Number(e.target.value) })} aria-label={t.dim} />
          </div>
          <div className={styles.group}>
            <div className={styles.row}>
              <button className={`${styles.opt} ${highlight ? styles.optOn : ""}`} onClick={() => setHighlight((h) => !h)}>✨ {t.words}</button>
              {(["high", "medium"] as const).map((q) => <button key={q} className={`${styles.opt} ${quality === q ? styles.optOn : ""}`} onClick={() => setQuality(q)}>{q === "high" ? "1080p" : "720p"}</button>)}
              {(["auto", "light", "dark"] as const).map((x) => <button key={x} className={`${styles.opt} ${prefs.tone === x ? styles.optOn : ""}`} onClick={() => update({ tone: x })}>{x === "auto" ? t.auto : x === "light" ? t.light : t.dark}</button>)}
            </div>
          </div>
        </div>
      </div>
      <div className={styles.actions}>{bgResolved.credit ? <span className={styles.credit}>{m.player.credit}: {bgResolved.credit}</span> : null}</div>
    </div>
  );
}

const loadStoryPrefsSafe = (): StoryPrefs => (typeof window === "undefined" ? { font: "naskh", size: 1, bg: null, dim: 0.3, tone: "auto", reciter: null, effect: "none" } : loadStoryPrefs());

/** Query-string overrides from the story page or the mobile app. */
const fromParams = (p: URLSearchParams): Partial<StoryPrefs> => {
  const out: Partial<StoryPrefs> = {};
  const bg = p.get("bg");
  if (bg) {
    if (bg.startsWith("v-")) out.bg = { kind: "video", id: bg } as StoryBg;
    else if (bg.startsWith("n-")) out.bg = { kind: "nature", id: bg } as StoryBg;
    else if (SOLID_BACKGROUNDS.some((s) => s.id === bg)) out.bg = { kind: "solid", id: bg } as StoryBg;
  }
  const font = p.get("font") as StoryFont | null; if (font && font in STORY_FONTS) out.font = font;
  const size = Number(p.get("size")); if (size >= 0.7 && size <= 1.6) out.size = size;
  const dim = Number(p.get("dim")); if (p.get("dim") !== null && dim >= 0 && dim <= 0.75) out.dim = dim;
  const tone = p.get("tone"); if (tone === "light" || tone === "dark" || tone === "auto") out.tone = tone;
  const reciter = p.get("reciter"); if (reciter) out.reciter = reciter;
  return out;
};
