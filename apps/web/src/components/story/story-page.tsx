"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { NATURE_WALLPAPERS, VIDEO_WALLPAPERS, hashString, languageNameForLocale, muezzinById, wallpaperForSurah, type PlayerReciter, type PrayerName } from "@qam/core";

import { useFamily } from "@/components/family/family-provider";
import SourcesBadge from "@/components/sources-badge";
import { loadAzanSettings } from "@/lib/azan-client";
import { useI18n } from "@/lib/i18n";
import { DEFAULT_STORY_PREFS, SOLID_BACKGROUNDS, STORY_FONTS, StoryVoice, canShareFiles, ensureStoryFonts, loadStoryPrefs, localMedia, readPhotoFile, renderStoryImage, resolveBg, saveStoryPrefs, shareImageFile, shareLinks, type StoryEffect, type StoryFont, type StoryPrefs } from "@/lib/story-tools";

import styles from "./story.module.css";

interface Ayah { day: string; verseKey: string; text: string; translation: string | null; juz: number | null }
interface Chapter { id: number; nameSimple: string; nameArabic: string; translatedName: string; versesCount: number }
interface VerseRow { verseKey: string; verseNumber: number; text: { uthmani: string }; translations: { text: string }[]; audioUrl: string | null }
interface TafsirResource { id: number; name: string; language: string }

const SLIDES = 4;

/**
 * Ayah of the day in "story" form: full-screen background, the ayah, its meaning,
 * a tafsir excerpt and a moment to reflect. Opened from the azan notification
 * (`?prayer=fajr&azan=1` also plays the azan). The Customise sheet changes font,
 * size, background, text colour and the reciting voice; Share renders a
 * 1080×1920 image for social networks.
 */
export default function StoryPage() {
  const { locale, m, isRtl, ar } = useI18n();
  const t = m.story;
  const router = useRouter();
  const params = useSearchParams();
  const prayer = params.get("prayer") as PrayerName | null;
  const wantAzan = params.get("azan") === "1";
  const day = params.get("day");
  // Ayah range: /story?surah=2&from=255&to=257 shows each ayah as its own page.
  const rangeSurah = Number(params.get("surah")) || null;
  const rangeFrom = Math.max(1, Number(params.get("from")) || 1);
  const rangeTo = Math.max(rangeFrom, Number(params.get("to")) || rangeFrom);
  const range = rangeSurah ? { surah: Math.min(114, Math.max(1, rangeSurah)), from: rangeFrom, to: rangeTo } : null;
  const { profile, dispatch } = useFamily();

  const [ayah, setAyah] = useState<Ayah | null>(null);
  const [pages, setPages] = useState<Ayah[]>([]);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [pick, setPick] = useState<{ surah: number; from: number; to: number }>({ surah: range?.surah ?? 1, from: range?.from ?? 1, to: range?.to ?? 1 });
  const [tafsir, setTafsir] = useState<{ name: string; text: string } | null>(null);
  const [slide, setSlide] = useState(0);
  const [note, setNote] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [azanState, setAzanState] = useState<"idle" | "playing" | "blocked">("idle");
  const audio = useRef<HTMLAudioElement | null>(null);

  // editor + share
  const [prefs, setPrefs] = useState<StoryPrefs>(DEFAULT_STORY_PREFS);
  const [sheet, setSheet] = useState<"none" | "edit" | "share" | "range">("none");
  const [reciters, setReciters] = useState<PlayerReciter[]>([]);
  const [voiceState, setVoiceState] = useState<"idle" | "loading" | "playing">("idle");
  const voice = useRef<StoryVoice | null>(null);
  const [preview, setPreview] = useState<{ url: string; blob: Blob } | null>(null);
  const [rendering, setRendering] = useState(false);

  useEffect(() => { ensureStoryFonts(); setPrefs(loadStoryPrefs()); }, []);
  const update = useCallback((patch: Partial<StoryPrefs>) => setPrefs((p) => { const next = { ...p, ...patch }; saveStoryPrefs(next); return next; }), []);

  const load = useCallback(async (random = false) => {
    setAyah(null); setPages([]); setTafsir(null); setSlide(0); setPreview(null);
    if (range && !random) {
      const res = await fetch(`/api/public/v1/verses/${range.surah}?${ar ? "" : "translations=85&"}perPage=300`);
      const rows = ((await res.json()) as { verses: VerseRow[] }).verses.filter((v) => v.verseNumber >= range.from && v.verseNumber <= range.to);
      const list: Ayah[] = rows.map((v) => ({ day: "", verseKey: v.verseKey, text: v.text.uthmani, translation: v.translations[0]?.text?.replace(/<[^>]+>/g, "").trim() ?? null, juz: null }));
      setPages(list); setAyah(list[0] ?? null);
      return;
    }
    const res = await fetch(`/api/public/v1/ayah/today?language=${locale}${random ? "&random=1" : ""}${day && !random ? `&day=${encodeURIComponent(day)}` : ""}`);
    setAyah((await res.json()) as Ayah);
  }, [locale, day, ar, range?.surah, range?.from, range?.to]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { void load(); }, [load]);
  const slides = pages.length ? pages.length + 1 : SLIDES;
  // In range mode the current page is the ayah shown (tafsir, image and voice follow it).
  useEffect(() => { if (pages.length) setAyah(pages[Math.min(slide, pages.length - 1)] ?? null); }, [slide, pages]);
  useEffect(() => { if (sheet !== "range" || chapters.length) return; fetch(`/api/public/v1/chapters?language=${locale}`).then((r) => r.json()).then((j: { chapters: Chapter[] }) => setChapters(j.chapters)).catch(() => undefined); }, [sheet, chapters.length, locale]);

  // Surah name + tafsir in the interface language (falls back to English, Arabic for Arabic UI).
  useEffect(() => {
    if (!ayah) return;
    const [s] = ayah.verseKey.split(":");
    fetch(`/api/public/v1/chapters?language=${locale}`).then((r) => r.json()).then((j: { chapters: Chapter[] }) => setChapter(j.chapters.find((c) => c.id === Number(s)) ?? null)).catch(() => undefined);
    (async () => {
      try {
        const list = ((await (await fetch("/api/public/v1/tafsirs")).json()) as { tafsirs: TafsirResource[] }).tafsirs;
        const lang = languageNameForLocale(locale);
        const pick = list.find((x) => x.language.toLowerCase() === lang) ?? list.find((x) => x.id === (ar ? 926 : 169)) ?? list.find((x) => x.language.toLowerCase() === "english") ?? list[0];
        if (!pick) return;
        const j = (await (await fetch(`/api/public/v1/tafsir/${pick.id}/${ayah.verseKey}`)).json()) as { tafsir: { name: string; text: string } | null };
        if (j.tafsir) setTafsir({ name: j.tafsir.name, text: j.tafsir.text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() });
      } catch { /* tafsir optional */ }
    })();
  }, [ayah, locale, ar]);

  // Azan playback when opened from the notification.
  useEffect(() => {
    if (!wantAzan) return;
    const el = new Audio(muezzinById(loadAzanSettings().muezzin).url);
    audio.current = el;
    el.onended = () => setAzanState("idle");
    el.play().then(() => setAzanState("playing")).catch(() => setAzanState("blocked"));
    return () => { el.pause(); };
  }, [wantAzan]);

  // Reciters for the voice section (ayah-by-ayah catalogue only).
  useEffect(() => {
    if (sheet !== "edit" || reciters.length) return;
    fetch(`/api/public/v1/reciters?profileGender=${profile?.gender ?? "unspecified"}`).then((r) => r.json()).then((j: { reciters: PlayerReciter[] }) => setReciters(j.reciters.filter((r) => r.recitationId !== null))).catch(() => undefined);
  }, [sheet, reciters.length, profile?.gender]);

  const surah = ayah ? Number(ayah.verseKey.split(":")[0]) : 1;
  const natureDefault = useMemo(() => {
    const base = wallpaperForSurah(surah, "nature");
    const shift = ayah ? hashString(ayah.day) % NATURE_WALLPAPERS.length : 0;
    return (NATURE_WALLPAPERS[(NATURE_WALLPAPERS.indexOf(base) + shift) % NATURE_WALLPAPERS.length] ?? base).id;
  }, [surah, ayah]);
  const bg = useMemo(() => resolveBg(prefs.bg, natureDefault), [prefs.bg, natureDefault]);
  const tone: "light" | "dark" = prefs.tone === "auto" ? bg.tone : prefs.tone;
  const fontFamily = STORY_FONTS[prefs.font].family;

  const next = () => setSlide((s) => Math.min(slides - 1, s + 1));
  const prev = () => setSlide((s) => Math.max(0, s - 1));
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (sheet !== "none") { if (e.key === "Escape") setSheet("none"); return; } if (e.key === "ArrowRight" || e.key === " ") next(); if (e.key === "ArrowLeft") prev(); if (e.key === "Escape") router.push("/"); };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, [router, sheet]);

  const flash = (text: string) => { setToast(text); window.setTimeout(() => setToast(null), 2200); };
  const studyUrl = ayah ? `${typeof window !== "undefined" ? window.location.origin : ""}/study/${ayah.verseKey}` : "";
  const bgParam = prefs.bg && prefs.bg.kind !== "photo" ? prefs.bg.id : "";
  const videoHref = ayah ? `/story/video?surah=${range?.surah ?? ayah.verseKey.split(":")[0]}&from=${range?.from ?? ayah.verseKey.split(":")[1]}&to=${range?.to ?? ayah.verseKey.split(":")[1]}${bgParam ? `&bg=${bgParam}` : ""}${prefs.reciter ? `&reciter=${prefs.reciter}` : ""}&font=${prefs.font}&size=${prefs.size}&dim=${prefs.dim}&tone=${prefs.tone}&auto=1` : "/story/video";
  const applyRange = () => { const c = chapters.find((x) => x.id === pick.surah); const max = c?.versesCount ?? 286; const from = Math.min(max, Math.max(1, pick.from)); const to = Math.min(max, Math.max(from, pick.to)); setSheet("none"); router.push(`/story?surah=${pick.surah}&from=${from}&to=${to}`); };
  const shareText = ayah ? `${ayah.text}\n${ayah.translation ?? ""}\n(${ayah.verseKey}) · ${t.shareText}` : t.shareText;

  const copyLink = async () => { try { await navigator.clipboard.writeText(`${shareText}\n${studyUrl}`); flash(m.common.copied); } catch { flash(m.common.unavailable); } };
  const saveNote = () => {
    if (!ayah || !note.trim()) return;
    if (!profile) { flash(m.common.noProfile); return; }
    dispatch({ type: "note/save", verseKey: ayah.verseKey, body: note.trim() });
    setNote(""); flash(t.noteSaved);
  };

  // ---- voice ----
  const playVoice = async () => {
    if (!ayah) return;
    const chosen = reciters.find((r) => r.id === prefs.reciter) ?? reciters[0];
    if (!chosen) return;
    if (!voice.current) { voice.current = new StoryVoice(); voice.current.onState = (p) => setVoiceState(p ? "playing" : "idle"); }
    if (voice.current.playing) { voice.current.stop(); return; }
    setVoiceState("loading");
    try {
      const j = (await (await fetch(`/api/public/v1/player/surah/${surah}?reciter=a${chosen.recitationId}`)).json()) as { segments: { key: string; audioUrl: string | null }[] };
      const keys = pages.length ? pages.slice(Math.min(slide, pages.length - 1)).map((p) => p.verseKey) : [ayah.verseKey];
      const urls = keys.map((k) => j.segments.find((s) => s.key === k)?.audioUrl).filter((u): u is string => !!u);
      if (!urls.length) { setVoiceState("idle"); flash(m.common.unavailable); return; }
      await voice.current.playList(urls, prefs.effect);
    } catch { setVoiceState("idle"); flash(m.common.unavailable); }
  };
  useEffect(() => () => voice.current?.stop(), []);
  /* Auto-play the recitation when the story opens; browsers that need a tap first just show the Play button. */
  const autoPlayedFor = useRef<string | null>(null);
  useEffect(() => {
    if (!ayah || wantAzan) return;
    const key = range ? `${range.surah}:${range.from}-${range.to}` : ayah.verseKey;
    if (autoPlayedFor.current === key) return;
    autoPlayedFor.current = key;
    if (!reciters.length) { fetch(`/api/public/v1/reciters?profileGender=${profile?.gender ?? "unspecified"}`).then((r) => r.json()).then((j: { reciters: PlayerReciter[] }) => { setReciters(j.reciters.filter((r) => r.recitationId !== null)); autoPlayedFor.current = null; }).catch(() => undefined); return; }
    const id = window.setTimeout(() => { void playVoice(); }, 300);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ayah?.verseKey, pages.length, reciters.length, wantAzan]);

  // ---- share image ----
  const buildImage = async () => {
    if (!ayah) return null;
    setRendering(true);
    try {
      const blob = await renderStoryImage({ arabic: ayah.text, translation: ayah.translation, reference: ayah.verseKey, surahName: chapter ? (ar ? chapter.nameArabic : chapter.nameSimple) : "", font: prefs.font, size: prefs.size, bg, dim: prefs.dim, tone, brand: m.common.appName, brandArabic: "القرآن وأكثر" });
      const url = URL.createObjectURL(blob);
      setPreview((p) => { if (p) URL.revokeObjectURL(p.url); return { url, blob }; });
      return blob;
    } catch { flash(m.common.unavailable); return null; } finally { setRendering(false); }
  };
  const openShare = async () => { setSheet("share"); if (!preview) await buildImage(); };
  const shareImage = async () => {
    const blob = preview?.blob ?? (await buildImage());
    if (!blob) return;
    const ok = await shareImageFile(blob, t.title, `${shareText}\n${studyUrl}`);
    if (!ok) flash(t.shareUnsupported);
  };
  const onPhoto = async (file: File | undefined) => { if (!file) return; try { update({ bg: { kind: "photo", dataUrl: await readPhotoFile(file) }, tone: "auto" }); } catch { flash(m.common.unavailable); } };

  const hour = new Date().getHours();
  const greeting = prayer ? `${t.forPrayer} ${m.azan.prayers[prayer] ?? ""}` : hour < 12 ? t.goodMorning : t.goodEvening;
  const [sNum, aNum] = (ayah?.verseKey ?? "1:1").split(":");
  const toneClass = tone === "dark" ? styles.light : "";
  const rootStyle: React.CSSProperties = bg.url ? { backgroundImage: `url(${bg.url})` } : { backgroundImage: `linear-gradient(135deg, ${bg.colors?.[0]}, ${bg.colors?.[1]})` };
  const rangeLabel = range ? (range.from === range.to ? `${range.surah}:${range.from}` : `${range.surah}:${range.from}-${range.to}`) : null;
  const arabicStyle: React.CSSProperties = { fontFamily, fontSize: `calc(clamp(1.7rem, 4.4vw, 3rem) * ${prefs.size})` };
  const dimStyle: React.CSSProperties = { position: "absolute", inset: 0, background: tone === "light" ? `rgba(0,0,0,${prefs.dim})` : `rgba(255,255,255,${prefs.dim})`, pointerEvents: "none" };
  const links = shareLinks(shareText, studyUrl);

  return (
    <div className={`${styles.root} ${toneClass}`} style={rootStyle} dir={isRtl ? "rtl" : "ltr"}>
      {bg.video ? <video key={bg.video} className={styles.bgVideo} src={bg.video} poster={bg.url} autoPlay muted loop playsInline aria-hidden /> : null}
      <div style={dimStyle} aria-hidden />
      <div className={styles.top}>
        <div className={styles.bars}>{Array.from({ length: slides }).map((_, i) => <span key={i} className={`${styles.bar} ${i < slide ? styles.barDone : ""} ${i === slide ? styles.barActive : ""}`}><span className={styles.barFill} /></span>)}</div>
        <div className={styles.head}>
          <span>✨ {rangeLabel ? `${chapter ? (ar ? chapter.nameArabic : chapter.nameSimple) : t.ayahRange} ${rangeLabel}` : `${t.title} · ${greeting}`}</span>
          <div className={styles.row}>
            <button className={styles.chip} onClick={() => setSheet("edit")} aria-haspopup="dialog">🎨 {t.customise}</button>
            <Link href="/" className={styles.close} aria-label={m.common.close}>✕</Link>
          </div>
        </div>
      </div>

      {wantAzan && azanState !== "idle" ? (
        <div className={styles.azanBanner}>
          <span>🕌 {m.azan.title}</span>
          {azanState === "blocked" ? <button className={styles.chip} onClick={() => audio.current?.play().then(() => setAzanState("playing")).catch(() => undefined)}>▶ {m.azan.preview}</button> : <button className={styles.chip} onClick={() => { audio.current?.pause(); setAzanState("idle"); }}>⏹ {m.azan.stop}</button>}
        </div>
      ) : null}

      <div className={styles.stage}>
        <div className={styles.nav} aria-hidden>
          <button onClick={isRtl ? next : prev} tabIndex={-1} />
          <button onClick={isRtl ? prev : next} tabIndex={-1} />
        </div>
        {!ayah ? <div className={styles.kicker}>{m.common.loading}</div> : (
          <div className={styles.slide} key={slide} style={{ position: "relative", zIndex: 1, pointerEvents: slide === slides - 1 ? "auto" : "none" }}>
            {pages.length && slide < pages.length ? (<>
              <div className={styles.kicker}>{chapter ? `${ar ? chapter.nameArabic : chapter.nameSimple} · ` : ""}{m.common.ayah} {aNum}</div>
              <div className={styles.arabic} lang="ar" translate="no" style={arabicStyle}>{ayah.text}</div>
              {ayah.translation ? <div className={styles.text} dir="auto" style={{ fontSize: `calc(clamp(1.05rem, 2.2vw, 1.45rem) * ${Math.min(prefs.size, 1.3)})` }}>{ayah.translation}</div> : null}
              {slide === 0 ? <div className={styles.hint}>{t.tapHint}</div> : null}
            </>) : null}
            {pages.length && slide === pages.length ? (<>
              <div className={styles.kicker}>{t.reflect}</div>
              <div className={styles.text}>{t.reflectPrompt}</div>
              <textarea className={styles.textarea} value={note} onChange={(e) => setNote(e.target.value)} placeholder={m.player.noteHint} />
              <div><button className={styles.chip} onClick={saveNote} disabled={!note.trim()}>📝 {t.saveNote}</button></div>
            </>) : null}
            {!pages.length && slide === 0 ? (<>
              <div className={styles.kicker}>{chapter ? `${ar ? chapter.nameArabic : chapter.nameSimple} · ` : ""}{m.common.ayah} {aNum}</div>
              <div className={styles.arabic} lang="ar" translate="no" style={arabicStyle}>{ayah.text}</div>
              <div className={styles.hint}>{t.tapHint}</div>
            </>) : null}
            {!pages.length && slide === 1 ? (<>
              <div className={styles.kicker}>{chapter?.translatedName ?? ""} {sNum}:{aNum}</div>
              <div className={styles.arabic} lang="ar" translate="no" style={{ ...arabicStyle, fontSize: `calc(1.4rem * ${prefs.size})`, opacity: 0.9 }}>{ayah.text}</div>
              <div className={styles.text} dir="auto" style={{ fontSize: `calc(clamp(1.05rem, 2.2vw, 1.45rem) * ${Math.min(prefs.size, 1.3)})` }}>{ayah.translation ?? m.common.unavailable}</div>
            </>) : null}
            {!pages.length && slide === 2 ? (<>
              <div className={styles.kicker}>{t.tafsir}{tafsir ? ` · ${tafsir.name}` : ""}</div>
              <div className={styles.tafsir} dir="auto">{tafsir ? (tafsir.text.length > 900 ? `${tafsir.text.slice(0, 900)}…` : tafsir.text) : m.common.loading}</div>
            </>) : null}
            {!pages.length && slide === 3 ? (<>
              <div className={styles.kicker}>{t.reflect}</div>
              <div className={styles.text}>{t.reflectPrompt}</div>
              <textarea className={styles.textarea} value={note} onChange={(e) => setNote(e.target.value)} placeholder={m.player.noteHint} />
              <div><button className={styles.chip} onClick={saveNote} disabled={!note.trim()}>📝 {t.saveNote}</button></div>
            </>) : null}
          </div>
        )}
      </div>

      <div className={styles.actions}>
        {ayah && reciters.length === 0 ? null : null}
        <button className={styles.chip} onClick={() => { if (!reciters.length) { fetch(`/api/public/v1/reciters?profileGender=${profile?.gender ?? "unspecified"}`).then((r) => r.json()).then((j: { reciters: PlayerReciter[] }) => { const list = j.reciters.filter((r) => r.recitationId !== null); setReciters(list); setTimeout(() => void playVoice(), 0); }).catch(() => undefined); } else void playVoice(); }} disabled={!ayah || voiceState === "loading"}>{voiceState === "playing" ? `⏹ ${m.azan.stop}` : voiceState === "loading" ? m.common.loading : `▶ ${t.playAyah}`}</button>
        {ayah ? <Link href={`/study/${ayah.verseKey}`} className={styles.chip}>📖 {t.openStudy}</Link> : null}
        <Link href={videoHref} className={`${styles.chip} ${styles.primaryBtn}`}>🎬 {t.shareVideo}</Link>
        <button className={styles.chip} onClick={openShare}>↗ {t.share}</button>
        <button className={styles.chip} onClick={() => { setPick({ surah: range?.surah ?? surah, from: range?.from ?? Number(aNum), to: range?.to ?? Number(aNum) }); setSheet("range"); }}>📑 {t.chooseAyahs}</button>
        <button className={styles.chip} onClick={() => { const ids = NATURE_WALLPAPERS.map((w) => w.id); const cur = prefs.bg?.kind === "nature" ? prefs.bg.id : natureDefault; update({ bg: { kind: "nature", id: ids[(ids.indexOf(cur) + 1) % ids.length] } }); }}>🖼 {t.wallpaper}</button>
        <button className={styles.chip} onClick={() => load(true)}>🔀 {t.nextAyah}</button>
        <Link href="/azan" className={styles.chip}>🕌 {m.nav.azan}</Link>
        <SourcesBadge compact />
        {bg.credit ? <span className={styles.credit}>{m.player.credit}: {bg.credit}</span> : null}
        {toast ? <div className={styles.hint}>{toast}</div> : null}
      </div>

      {sheet === "edit" ? (
        <div className={styles.sheetScrim} onClick={() => setSheet("none")} role="presentation">
          <div className={styles.sheet} role="dialog" aria-modal="true" aria-label={t.customise} onClick={(e) => e.stopPropagation()}>
            <div className={styles.sheetHead}><span>🎨 {t.customise}</span><button className={styles.sheetClose} onClick={() => setSheet("none")} aria-label={m.common.close}>✕</button></div>
            <div className={styles.group}>
              <div className={styles.label}>{t.font}</div>
              <div className={styles.row}>{(Object.keys(STORY_FONTS) as StoryFont[]).map((f) => <button key={f} className={`${styles.opt} ${prefs.font === f ? styles.optOn : ""}`} style={{ fontFamily: STORY_FONTS[f].family }} onClick={() => update({ font: f })}>{STORY_FONTS[f].label} · بسم الله</button>)}</div>
            </div>
            <div className={styles.group}>
              <div className={styles.label}>{t.size} · {Math.round(prefs.size * 100)}%</div>
              <input className={styles.range} type="range" min={0.7} max={1.6} step={0.05} value={prefs.size} onChange={(e) => update({ size: Number(e.target.value) })} aria-label={t.size} />
            </div>
            <div className={styles.group}>
              <div className={styles.label}>{t.background}</div>
              <div className={styles.row}>
                <span className={styles.label}>{t.nature}</span>
                {SOLID_BACKGROUNDS.map((s) => <button key={s.id} className={`${styles.opt} ${prefs.bg?.kind === "solid" && prefs.bg.id === s.id ? styles.optOn : ""}`} style={{ background: `linear-gradient(135deg, ${s.colors[0]}, ${s.colors[1]})`, color: s.tone === "light" ? "#fff" : "#15201b", border: "1px solid var(--line)" }} onClick={() => update({ bg: { kind: "solid", id: s.id }, tone: "auto" })}>{t.solid}</button>)}
                <label className={`${styles.opt} ${styles.upload} ${prefs.bg?.kind === "photo" ? styles.optOn : ""}`}>📷 {t.upload}<input type="file" accept="image/*" onChange={(e) => onPhoto(e.target.files?.[0])} /></label>
              </div>
              <div className={styles.label}>▶ {t.moving}</div>
              <div className={styles.thumbs}>
                {VIDEO_WALLPAPERS.map((w) => <button key={w.id} className={`${styles.thumb} ${prefs.bg?.kind === "video" && prefs.bg.id === w.id ? styles.thumbOn : ""}`} style={{ backgroundImage: `url(${localMedia(w.url)})` }} onClick={() => update({ bg: { kind: "video", id: w.id }, tone: "auto" })} aria-label={ar ? w.title.ar : w.title.en}><span>▶ {ar ? w.title.ar : w.title.en}</span></button>)}
              </div>
              <div className={styles.label}>{t.nature}</div>
              <div className={styles.thumbs}>
                {NATURE_WALLPAPERS.map((w) => <button key={w.id} className={`${styles.thumb} ${(prefs.bg?.kind === "nature" ? prefs.bg.id : natureDefault) === w.id && prefs.bg?.kind !== "solid" && prefs.bg?.kind !== "photo" ? styles.thumbOn : ""}`} style={{ backgroundImage: `url(${w.url?.replace("w=1920", "w=320")})` }} onClick={() => update({ bg: { kind: "nature", id: w.id }, tone: "auto" })} aria-label={ar ? w.title.ar : w.title.en} title={ar ? w.title.ar : w.title.en} />)}
              </div>
              <div className={styles.label}>{t.dim} · {Math.round(prefs.dim * 100)}%</div>
              <input className={styles.range} type="range" min={0} max={0.75} step={0.05} value={prefs.dim} onChange={(e) => update({ dim: Number(e.target.value) })} aria-label={t.dim} />
            </div>
            <div className={styles.group}>
              <div className={styles.label}>{t.textColor}</div>
              <div className={styles.row}>{(["auto", "light", "dark"] as const).map((x) => <button key={x} className={`${styles.opt} ${prefs.tone === x ? styles.optOn : ""}`} onClick={() => update({ tone: x })}>{x === "auto" ? t.auto : x === "light" ? t.light : t.dark}</button>)}</div>
            </div>
            <div className={styles.group}>
              <div className={styles.label}>{t.voice}</div>
              <div className={styles.row}>
                <select className={styles.opt} value={prefs.reciter ?? reciters[0]?.id ?? ""} onChange={(e) => update({ reciter: e.target.value })} aria-label={t.reciter}>
                  {reciters.map((r) => <option key={r.id} value={r.id}>{ar ? r.arabicName : r.latinName}</option>)}
                </select>
                <button className={`${styles.opt} ${styles.primaryBtn}`} onClick={playVoice} disabled={!reciters.length || voiceState === "loading"}>{voiceState === "playing" ? `⏹ ${m.azan.stop}` : `▶ ${t.playAyah}`}</button>
              </div>
              <div className={styles.row}>{(["none", "reverb", "echo", "slow"] as StoryEffect[]).map((x) => <button key={x} className={`${styles.opt} ${prefs.effect === x ? styles.optOn : ""}`} onClick={() => { update({ effect: x }); if (voice.current?.playing) void playVoice().then(() => playVoice()); }}>{x === "none" ? t.effectNone : x === "reverb" ? t.effectReverb : x === "echo" ? t.effectEcho : t.effectSlow}</button>)}</div>
            </div>
            <div className={styles.row}><button className={styles.opt} onClick={() => { update({ ...DEFAULT_STORY_PREFS }); }}>↺ {t.reset}</button></div>
          </div>
        </div>
      ) : null}

      {sheet === "range" ? (
        <div className={styles.sheetScrim} onClick={() => setSheet("none")} role="presentation">
          <div className={styles.sheet} role="dialog" aria-modal="true" aria-label={t.chooseAyahs} onClick={(e) => e.stopPropagation()}>
            <div className={styles.sheetHead}><span>📑 {t.chooseAyahs}</span><button className={styles.sheetClose} onClick={() => setSheet("none")} aria-label={m.common.close}>✕</button></div>
            <div className={styles.rangeRow}>
              <select value={pick.surah} onChange={(e) => setPick((p) => ({ ...p, surah: Number(e.target.value), from: 1, to: 1 }))} aria-label={m.player.surahs}>
                {(chapters.length ? chapters : [{ id: pick.surah, nameSimple: "…", nameArabic: "…", translatedName: "", versesCount: 286 }]).map((c) => <option key={c.id} value={c.id}>{c.id}. {ar ? c.nameArabic : c.nameSimple}</option>)}
              </select>
              <label>{t.fromAyah} <input type="number" min={1} max={chapters.find((c) => c.id === pick.surah)?.versesCount ?? 286} value={pick.from} onChange={(e) => setPick((p) => ({ ...p, from: Number(e.target.value) || 1 }))} /></label>
              <label>{t.toAyah} <input type="number" min={pick.from} max={chapters.find((c) => c.id === pick.surah)?.versesCount ?? 286} value={pick.to} onChange={(e) => setPick((p) => ({ ...p, to: Number(e.target.value) || p.from }))} /></label>
              <button className={`${styles.opt} ${styles.optOn}`} onClick={applyRange}>{t.apply}</button>
            </div>
            <div className={styles.hint}>{t.videoHint}</div>
          </div>
        </div>
      ) : null}

      {sheet === "share" ? (
        <div className={styles.sheetScrim} onClick={() => setSheet("none")} role="presentation">
          <div className={styles.sheet} role="dialog" aria-modal="true" aria-label={t.shareTitle} onClick={(e) => e.stopPropagation()}>
            <div className={styles.sheetHead}><span>↗ {t.shareTitle}</span><button className={styles.sheetClose} onClick={() => setSheet("none")} aria-label={m.common.close}>✕</button></div>
            {preview ? <img className={styles.preview} src={preview.url} alt={`${t.title} ${ayah?.verseKey ?? ""}`} /> : <div className={styles.hint}>{rendering ? t.preparing : m.common.loading}</div>}
            <div className={styles.shareGrid}>
              <Link className={`${styles.shareBtn} ${styles.primaryBtn}`} href={videoHref}><strong>🎬 {t.shareVideo}</strong><span>{t.videoHint}</span></Link>
              {canShareFiles() ? <button className={styles.shareBtn} onClick={shareImage} disabled={!preview}><strong>📤 {t.shareImage}</strong><span>Instagram · WhatsApp · …</span></button> : null}
              {preview ? <a className={styles.shareBtn} href={preview.url} download={`ayah-${ayah?.verseKey.replace(":", "-")}.png`}><strong>⬇ {t.downloadImage}</strong><span>1080 × 1920</span></a> : null}
              {links.map((l) => <a key={l.id} className={styles.shareBtn} href={l.href} target="_blank" rel="noopener noreferrer"><strong>{l.label}</strong><span>{m.common.share}</span></a>)}
              <button className={styles.shareBtn} onClick={copyLink}><strong>🔗 {t.copyLink}</strong><span>{m.common.copy}</span></button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
