"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { compareRecitation, type RecitationResult } from "@qam/core";

import { useFamily } from "@/components/family/family-provider";

import { useI18n } from "@/lib/i18n";

import StudyShell, { useToday } from "./study-shell";
import styles from "./study.module.css";

/**
 * Memorisation trainer (Tasmi'-style): hide the ayah, recall it, peek, then
 * grade yourself; a simple spaced-repetition schedule decides when each ayah
 * comes back. Optional microphone check uses the browser's speech recogniser
 * and compares the words with the verbatim text.
 */
interface Surah { id: number; nameArabic: string; nameSimple: string; translatedName: string; versesCount: number }
interface Ayah { verseKey: string; verseNumber: number; text: { uthmani: string }; translations: { text: string }[]; audioUrl: string | null }
interface Card { verseKey: string; due: string; interval: number; ease: number; reps: number }
type Grade = "forgot" | "hard" | "good" | "easy";

const STORE = "qam.hifz.v1";
const INTERVALS: Record<Grade, number> = { forgot: 0, hard: 1, good: 4, easy: 9 };

const load = (): Record<string, Card> => { try { return JSON.parse(localStorage.getItem(STORE) ?? "{}") as Record<string, Card>; } catch { return {}; } };
const save = (cards: Record<string, Card>) => { try { localStorage.setItem(STORE, JSON.stringify(cards)); } catch { /* ignore */ } };
const addDays = (day: string, n: number) => { const d = new Date(`${day}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

export default function HifzPage() {
  const { locale, m, num } = useI18n();
  const t = m.hifz;
  const today = useToday();
  const family = useFamily();
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [surah, setSurah] = useState(112);
  const [from, setFrom] = useState(1);
  const [to, setTo] = useState(4);
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [cards, setCards] = useState<Record<string, Card>>({});
  const [queue, setQueue] = useState<string[]>([]);
  const [i, setI] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [reps, setReps] = useState(0);
  const [result, setResult] = useState<RecitationResult | null>(null);
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState("");
  const recRef = useRef<{ stop: () => void } | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => { setCards(load()); fetch(`/api/public/v1/chapters?language=${locale}`).then((r) => r.json()).then((j: { chapters: Surah[] }) => setSurahs(j.chapters ?? [])).catch(() => undefined); }, [locale]);
  const verseCount = surahs.find((s) => s.id === surah)?.versesCount ?? 7;
  useEffect(() => { setFrom(1); setTo(Math.min(verseCount, 5)); }, [surah, verseCount]);

  const start = async () => {
    const res = await fetch(`/api/public/v1/verses/${surah}?translations=${locale === "ar" ? "" : "85"}&reciter=7&perPage=300`);
    const json = (await res.json()) as { verses: Ayah[] };
    const list = (json.verses ?? []).filter((v) => v.verseNumber >= from && v.verseNumber <= to);
    setAyahs(list);
    const dueFirst = [...list].sort((a, b) => (cards[a.verseKey]?.due ?? "0").localeCompare(cards[b.verseKey]?.due ?? "0"));
    setQueue(dueFirst.map((v) => v.verseKey)); setI(0); setRevealed(false); setResult(null); setHeard(""); setReps(0);
  };
  const current = ayahs.find((a) => a.verseKey === queue[i]);
  const grade = (g: Grade) => {
    if (!current) return;
    const prev = cards[current.verseKey] ?? { verseKey: current.verseKey, due: today, interval: 0, ease: 2.5, reps: 0 };
    const interval = g === "forgot" ? 0 : Math.max(INTERVALS[g], Math.round(prev.interval * (g === "hard" ? 1.2 : g === "good" ? prev.ease : prev.ease * 1.3)));
    const next = { ...prev, interval, due: addDays(today, interval), ease: Math.max(1.3, prev.ease + (g === "easy" ? 0.15 : g === "good" ? 0 : g === "hard" ? -0.15 : -0.3)), reps: prev.reps + 1 };
    const all = { ...cards, [current.verseKey]: next }; setCards(all); save(all);
    if (family.profile) family.dispatch({ type: "progress/record", verseKey: current.verseKey, seconds: 30, day: today });
    setRevealed(false); setResult(null); setHeard(""); setReps(0);
    setQueue((q) => (g === "forgot" ? [...q, current.verseKey] : q)); setI((x) => x + 1);
  };
  const play = () => { if (!current?.audioUrl) return; audioRef.current ??= new Audio(); audioRef.current.src = current.audioUrl; void audioRef.current.play().catch(() => undefined); setReps((r) => r + 1); };
  const words = useMemo(() => current ? current.text.uthmani.trim().split(/\s+/).filter((w) => /[ء-ي]/.test(w)) : [], [current]);

  const mic = () => {
    if (listening) { recRef.current?.stop(); return; }
    const SR = (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike }).SpeechRecognition ?? (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition;
    if (!SR) { setHeard(t.micUnsupported); return; }
    const rec = new SR(); rec.lang = "ar-SA"; rec.continuous = true; rec.interimResults = true; rec.maxAlternatives = 1;
    let final = "";
    rec.onresult = (e) => { let interim = ""; for (let k = e.resultIndex; k < e.results.length; k += 1) { const r = e.results[k]; if (r.isFinal) final += `${r[0].transcript} `; else interim += r[0].transcript; } setHeard(`${final}${interim}`.trim()); };
    rec.onend = () => { setListening(false); if (final.trim()) setResult(compareRecitation(words, final)); };
    rec.onerror = () => setListening(false);
    recRef.current = rec; setListening(true); setHeard(""); setResult(null); rec.start();
  };
  const dueCount = Object.values(cards).filter((c) => c.due <= today).length;
  const dueLabel = (c?: Card) => !c ? "" : c.due <= today ? t.today : c.due === addDays(today, 1) ? t.tomorrow : `${num(Math.round((new Date(c.due).getTime() - new Date(today).getTime()) / 86400000))} ${t.days}`;

  return (
    <StudyShell title={t.title}>
      <section className={styles.card}>
        <div className={styles.row} style={{ justifyContent: "space-between" }}>
          <div><div className={styles.kicker}>Tasmi&apos;-style</div><h1 className={styles.h1}>{t.pick}</h1></div>
          <div className={styles.row}><span className={styles.pill}>📚 {num(Object.keys(cards).length)} {t.cards}</span><span className={styles.pill}>⏰ {num(dueCount)} {t.due}</span></div>
        </div>
        <div className={styles.row}>
          <select className={styles.select} value={surah} onChange={(e) => setSurah(Number(e.target.value))}>{surahs.map((s) => <option key={s.id} value={s.id}>{s.id}. {s.nameArabic} · {s.translatedName || s.nameSimple}</option>)}</select>
          <label className={styles.muted}>{t.from} <input className={styles.select} type="number" min={1} max={verseCount} value={from} onChange={(e) => setFrom(Math.max(1, Math.min(verseCount, Number(e.target.value))))} style={{ width: 80 }} /></label>
          <label className={styles.muted}>{t.to} <input className={styles.select} type="number" min={from} max={verseCount} value={to} onChange={(e) => setTo(Math.max(from, Math.min(verseCount, Number(e.target.value))))} style={{ width: 80 }} /></label>
          <button className={styles.btn} onClick={start}>{t.start}</button>
        </div>
        <p className={styles.muted}>{t.methods}: {t.method6446} · {t.method3x3}. {t.noProfile}</p>
      </section>

      {current ? (
        <section className={styles.card}>
          <div className={styles.row} style={{ justifyContent: "space-between" }}>
            <span className={styles.kicker}>{current.verseKey} · {num(i + 1)} / {num(queue.length)}</span>
            <span className={styles.row}><span className={styles.pill}>🔁 {num(reps)} {t.reps}</span>{cards[current.verseKey] ? <span className={styles.pill}>{t.schedule}: {dueLabel(cards[current.verseKey])}</span> : null}</span>
          </div>
          <p className={`${styles.arabic} ${styles.arabicBig} ${revealed ? "" : styles.hidden}`} lang="ar" translate="no" onClick={() => setRevealed((r) => !r)} style={{ cursor: "pointer" }}>
            {result ? result.words.map((w) => <span key={w.position} className={w.verdict === "correct" ? styles.verdictOk : w.verdict === "close" ? styles.verdictClose : styles.verdictMissed}>{w.expected} </span>) : current.text.uthmani}
          </p>
          {revealed && current.translations[0]?.text ? <p className={styles.translation} style={{ textAlign: "center" }}>{current.translations[0].text.replace(/<[^>]+>/g, "")}</p> : null}
          <div className={styles.row} style={{ justifyContent: "center" }}>
            <button className={styles.btnGhost} onClick={() => setRevealed((r) => !r)}>{revealed ? `🙈 ${t.hide}` : `👁 ${t.reveal}`}</button>
            <button className={styles.btnGhost} onClick={play} disabled={!current.audioUrl}>🔊 {t.listen}</button>
            <button className={`${styles.btnGhost} ${listening ? styles.chipActive : ""}`} onClick={mic}>🎙 {listening ? t.micStop : t.mic}</button>
            <Link className={styles.btnGhost} href={`/study/${current.verseKey}`}>📖</Link>
          </div>
          {heard ? <p className={styles.muted} dir="rtl">{t.heard}: {heard}</p> : null}
          {result ? <p><span className={styles.pill}>{t.accuracy} {num(result.accuracy)}%</span> <span className={styles.muted}>✓ {num(result.correct)} · ≈ {num(result.close)} · ✗ {num(result.missed)}</span></p> : null}
          <div className={styles.kicker}>{t.grade}</div>
          <div className={styles.options}>
            {(["forgot", "hard", "good", "easy"] as Grade[]).map((g) => <button key={g} className={styles.option} onClick={() => grade(g)}>{g === "forgot" ? "😵" : g === "hard" ? "😓" : g === "good" ? "🙂" : "😎"} {t[g]}<div className={styles.muted}>{g === "forgot" ? "10 min" : `${num(INTERVALS[g])} ${t.days}`}</div></button>)}
          </div>
        </section>
      ) : queue.length && i >= queue.length ? (
        <section className={styles.card} style={{ textAlign: "center" }}><div className={styles.big}>🎉</div><h2 className={styles.h2}>{t.done}</h2><button className={styles.btn} onClick={start}>{t.again}</button></section>
      ) : null}
    </StudyShell>
  );
}

interface SpeechRecognitionLike { lang: string; continuous: boolean; interimResults: boolean; maxAlternatives: number; onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null; onend: (() => void) | null; onerror: (() => void) | null; start: () => void; stop: () => void }
