"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { NATURE_WALLPAPERS, hashString, languageNameForLocale, muezzinById, wallpaperForSurah, type PrayerName } from "@qam/core";

import { useFamily } from "@/components/family/family-provider";
import { loadAzanSettings } from "@/lib/azan-client";
import { useI18n } from "@/lib/i18n";

import styles from "./story.module.css";

interface Ayah { day: string; verseKey: string; text: string; translation: string | null; juz: number | null }
interface Chapter { id: number; nameSimple: string; nameArabic: string; translatedName: string }
interface TafsirResource { id: number; name: string; language: string }

const SLIDES = 4;

/**
 * Ayah of the day in "story" form: full-screen wallpaper, the ayah, its meaning,
 * a tafsir excerpt and a moment to reflect. Opened from the azan notification
 * (`?prayer=fajr&azan=1` also plays the azan).
 */
export default function StoryPage() {
  const { locale, m, isRtl, ar } = useI18n();
  const t = m.story;
  const router = useRouter();
  const params = useSearchParams();
  const prayer = params.get("prayer") as PrayerName | null;
  const wantAzan = params.get("azan") === "1";
  const day = params.get("day");
  const { profile, dispatch } = useFamily();

  const [ayah, setAyah] = useState<Ayah | null>(null);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [tafsir, setTafsir] = useState<{ name: string; text: string } | null>(null);
  const [slide, setSlide] = useState(0);
  const [wpIndex, setWpIndex] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [azanState, setAzanState] = useState<"idle" | "playing" | "blocked">("idle");
  const audio = useRef<HTMLAudioElement | null>(null);

  const load = useCallback(async (random = false) => {
    setAyah(null); setTafsir(null); setSlide(0);
    const res = await fetch(`/api/public/v1/ayah/today?language=${locale}${random ? "&random=1" : ""}${day && !random ? `&day=${encodeURIComponent(day)}` : ""}`);
    const a = (await res.json()) as Ayah;
    setAyah(a);
  }, [locale, day]);

  useEffect(() => { void load(); }, [load]);

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

  const surah = ayah ? Number(ayah.verseKey.split(":")[0]) : 1;
  const wallpaper = useMemo(() => {
    if (wpIndex !== null) return NATURE_WALLPAPERS[wpIndex % NATURE_WALLPAPERS.length];
    const base = wallpaperForSurah(surah, "nature");
    const shift = ayah ? hashString(ayah.day) % NATURE_WALLPAPERS.length : 0;
    return NATURE_WALLPAPERS[(NATURE_WALLPAPERS.indexOf(base) + shift) % NATURE_WALLPAPERS.length] ?? base;
  }, [surah, wpIndex, ayah]);

  const next = () => setSlide((s) => Math.min(SLIDES - 1, s + 1));
  const prev = () => setSlide((s) => Math.max(0, s - 1));
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "ArrowRight" || e.key === " ") next(); if (e.key === "ArrowLeft") prev(); if (e.key === "Escape") router.push("/"); };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  const flash = (text: string) => { setToast(text); window.setTimeout(() => setToast(null), 1800); };
  const share = async () => {
    if (!ayah) return;
    const url = `${window.location.origin}/study/${ayah.verseKey}`;
    const text = `${ayah.text}\n${ayah.translation ?? ""}\n(${ayah.verseKey})`;
    try {
      if (navigator.share) await navigator.share({ title: t.title, text, url });
      else { await navigator.clipboard.writeText(`${text}\n${url}`); flash(m.common.copied); }
    } catch { /* cancelled */ }
  };
  const saveNote = () => {
    if (!ayah || !note.trim()) return;
    if (!profile) { flash(m.common.noProfile); return; }
    dispatch({ type: "note/save", verseKey: ayah.verseKey, body: note.trim() });
    setNote(""); flash(t.noteSaved);
  };

  const hour = new Date().getHours();
  const greeting = prayer ? `${t.forPrayer} ${m.azan.prayers[prayer] ?? ""}` : hour < 12 ? t.goodMorning : t.goodEvening;
  const [sNum, aNum] = (ayah?.verseKey ?? "1:1").split(":");
  const tone = wallpaper.tone === "dark" ? styles.light : "";

  return (
    <div className={`${styles.root} ${tone}`} style={{ backgroundImage: wallpaper.url ? `url(${wallpaper.url})` : undefined }} dir={isRtl ? "rtl" : "ltr"}>
      <div className={styles.top}>
        <div className={styles.bars}>{Array.from({ length: SLIDES }).map((_, i) => <span key={i} className={`${styles.bar} ${i < slide ? styles.barDone : ""} ${i === slide ? styles.barActive : ""}`}><span className={styles.barFill} /></span>)}</div>
        <div className={styles.head}>
          <span>✨ {t.title} · {greeting}</span>
          <Link href="/" className={styles.close} aria-label={m.common.close}>✕</Link>
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
          <div className={styles.slide} key={slide} style={{ position: "relative", zIndex: 1, pointerEvents: slide === 3 ? "auto" : "none" }}>
            {slide === 0 ? (
              <>
                <div className={styles.kicker}>{chapter ? `${ar ? chapter.nameArabic : chapter.nameSimple} · ` : ""}{m.common.ayah} {aNum}</div>
                <div className={styles.arabic} lang="ar" translate="no">{ayah.text}</div>
                <div className={styles.hint}>{t.tapHint}</div>
              </>
            ) : null}
            {slide === 1 ? (
              <>
                <div className={styles.kicker}>{chapter?.translatedName ?? ""} {sNum}:{aNum}</div>
                <div className={styles.arabic} lang="ar" translate="no" style={{ fontSize: "1.4rem", opacity: 0.9 }}>{ayah.text}</div>
                <div className={styles.text} dir="auto">{ayah.translation ?? m.common.unavailable}</div>
              </>
            ) : null}
            {slide === 2 ? (
              <>
                <div className={styles.kicker}>{t.tafsir}{tafsir ? ` · ${tafsir.name}` : ""}</div>
                <div className={styles.tafsir} dir="auto">{tafsir ? (tafsir.text.length > 900 ? `${tafsir.text.slice(0, 900)}…` : tafsir.text) : m.common.loading}</div>
              </>
            ) : null}
            {slide === 3 ? (
              <>
                <div className={styles.kicker}>{t.reflect}</div>
                <div className={styles.text}>{t.reflectPrompt}</div>
                <textarea className={styles.textarea} value={note} onChange={(e) => setNote(e.target.value)} placeholder={m.player.noteHint} />
                <div><button className={styles.chip} onClick={saveNote} disabled={!note.trim()}>📝 {t.saveNote}</button></div>
              </>
            ) : null}
          </div>
        )}
      </div>

      <div className={styles.actions}>
        {ayah ? <Link href={`/player?surah=${sNum}&ayah=${aNum}`} className={styles.chip}>▶ {t.listen}</Link> : null}
        {ayah ? <Link href={`/study/${ayah.verseKey}`} className={styles.chip}>📖 {t.openStudy}</Link> : null}
        <button className={styles.chip} onClick={share}>↗ {t.share}</button>
        <button className={styles.chip} onClick={() => setWpIndex((i) => ((i ?? NATURE_WALLPAPERS.indexOf(wallpaper)) + 1) % NATURE_WALLPAPERS.length)}>🖼 {t.wallpaper}</button>
        <button className={styles.chip} onClick={() => load(true)}>🔀 {t.nextAyah}</button>
        <Link href="/azan" className={styles.chip}>🕌 {m.nav.azan}</Link>
        {toast ? <div className={styles.hint}>{toast}</div> : null}
      </div>
    </div>
  );
}
