"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { isBookmarked } from "@qam/core";

import { useFamily } from "@/components/family/family-provider";

import { useI18n } from "@/lib/i18n";

import StudyShell from "./study-shell";
import styles from "./study.module.css";

interface Word { position: number; text: string; translation: string | null; transliteration: string | null; audioUrl: string | null }
interface Bundle {
  verseKey: string; chapter: { number: number; arabicName: string; latinName: string; verseCount: number }; verse: number; text: string; words: Word[];
  translations: { id: number; name: string; language: string; text: string }[]; tafsirs: { id: number; name: string; author: string | null; language: string }[]; defaultTafsirs: number[];
  juz: number | null; page: number | null; hizb: number | null; sajdah: boolean; chapterInfo: { shortText: string; source: string | null } | null;
  hadith: { collection: string; number: string | null; text: string; grade: string | null; url: string | null }[] | null;
  answers: { id: string; question: string; answers: { body: string; by: string | null }[] }[] | null;
  reflections: { id: string; author: string; body: string; likes: number; url: string | null; verified: boolean }[] | null;
  availability: { hadith: string; answers: string; reflections: string }; prev: string | null; next: string | null;
}

export default function StudyPage({ verseKey }: { verseKey: string }) {
  const { locale, m, num, isRtl } = useI18n();
  const t = m.study;
  const family = useFamily();
  const [b, setB] = useState<Bundle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [picked, setPicked] = useState<number[]>([]);
  const [tafsirText, setTafsirText] = useState<Record<number, string | null>>({});
  const [toast, setToast] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    setB(null); setError(null);
    fetch(`/api/public/v1/study/${encodeURIComponent(verseKey)}?language=${locale}`).then((r) => r.json()).then((json: Bundle & { error?: { message: string } }) => {
      if (cancelled) return;
      if (json.error) { setError(json.error.message); return; }
      setB(json);
      try { const saved = JSON.parse(localStorage.getItem("qam.study.tafsirs") ?? "null") as number[] | null; setPicked(saved?.filter((id) => json.tafsirs.some((x) => x.id === id)).slice(0, 3) ?? json.defaultTafsirs.slice(0, 2)); } catch { setPicked(json.defaultTafsirs.slice(0, 2)); }
    }).catch((e) => !cancelled && setError((e as Error).message));
    return () => { cancelled = true; };
  }, [verseKey, locale]);

  useEffect(() => {
    if (!b) return;
    try { localStorage.setItem("qam.study.tafsirs", JSON.stringify(picked)); } catch { /* ignore */ }
    for (const id of picked) {
      if (tafsirText[id] !== undefined) continue;
      setTafsirText((s) => ({ ...s, [id]: null }));
      fetch(`/api/public/v1/tafsir/${id}/${encodeURIComponent(verseKey)}`).then((r) => r.json()).then((j: { tafsir?: { text: string } | null }) => setTafsirText((s) => ({ ...s, [id]: j.tafsir?.text ?? "" }))).catch(() => setTafsirText((s) => ({ ...s, [id]: "" })));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [picked, b, verseKey]);

  const tafsirsByLang = useMemo(() => { const m = new Map<string, Bundle["tafsirs"]>(); for (const x of b?.tafsirs ?? []) m.set(x.language, [...(m.get(x.language) ?? []), x]); return m; }, [b]);
  const say = (m: string) => { setToast(m); window.setTimeout(() => setToast(null), 2000); };
  const share = async () => {
    if (!b) return;
    const url = `${location.origin}/v/${b.verseKey}`;
    const text = `${b.text} ﴿${num(b.verse)}﴾\n${b.translations[0]?.text ?? ""}\n— ${b.chapter.arabicName} ${b.verseKey}\n${url}`;
    try { if (navigator.share) await navigator.share({ title: `${b.chapter.arabicName} ${b.verseKey}`, text, url }); else { await navigator.clipboard.writeText(text); say(t.copied); } } catch { /* cancelled */ }
  };
  const playWord = (w: Word) => { if (!w.audioUrl) return; audioRef.current ??= new Audio(); audioRef.current.src = w.audioUrl; void audioRef.current.play().catch(() => undefined); };

  return (
    <StudyShell title={t.title}>
      {error ? <p className={styles.card} role="alert">{error}</p> : null}
      {!b && !error ? <p className={styles.muted}>{t.loading}</p> : null}
      {b ? (
        <>
          <section className={styles.card}>
            <div className={styles.row} style={{ justifyContent: "space-between" }}>
              <div>
                <div className={styles.kicker}>{t.surah} {b.chapter.arabicName} · {b.chapter.latinName}</div>
                <h1 className={styles.h1}>{t.ayah} {num(b.verse)} {t.of} {num(b.chapter.verseCount)}</h1>
                <div className={styles.muted}>{b.juz ? `${t.juz} ${num(b.juz)} · ` : ""}{b.hizb ? `${t.hizb} ${num(b.hizb)} · ` : ""}{b.page ? `${t.page} ${num(b.page)}` : ""}{b.sajdah ? ` · ${t.sajdah} ۩` : ""}</div>
              </div>
              <div className={styles.row}>
                {b.prev ? <Link className={styles.chip} href={`/study/${b.prev}`}>{isRtl ? "→" : "←"} {t.prev}</Link> : null}
                {b.next ? <Link className={styles.chip} href={`/study/${b.next}`}>{t.next} {isRtl ? "←" : "→"}</Link> : null}
              </div>
            </div>
            <p className={`${styles.arabic} ${styles.arabicBig}`} lang="ar" translate="no">{b.text} <span style={{ color: "var(--accent)", fontSize: "0.6em" }}>﴿{num(b.verse)}﴾</span></p>
            <div className={styles.row}>
              <Link className={styles.chip} href={`/player?surah=${b.chapter.number}&ayah=${b.verse}`}>▶ {t.play}</Link>
              <Link className={styles.chip} href={b.page ? `/mushaf?page=${b.page}` : "/mushaf"}>📖 {t.page} {b.page ? num(b.page) : ""}</Link>
              <button className={`${styles.chip} ${isBookmarked(family.state, b.verseKey) ? styles.chipActive : ""}`} onClick={() => { if (!family.profile) { say(t.noProfile); return; } family.dispatch({ type: "bookmark/toggle", verseKey: b.verseKey, page: b.page ?? undefined }); }}>🔖 {isBookmarked(family.state, b.verseKey) ? t.bookmarked : t.bookmark}</button>
              <button className={styles.chip} onClick={share}>↗ {t.share}</button>
              <button className={styles.chip} onClick={async () => { await navigator.clipboard.writeText(`${b.text} ﴿${num(b.verse)}﴾ (${b.verseKey})`); say(t.copied); }}>⧉ {t.copy}</button>
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.kicker}>{t.words}</div>
            <div className={styles.words}>
              {b.words.map((w) => (
                <button key={w.position} className={styles.word} onClick={() => playWord(w)} title={w.audioUrl ? t.listenWord : undefined}>
                  <span className={styles.wordAr} lang="ar" translate="no">{w.text}</span>
                  {w.transliteration ? <span className={styles.wordMeaning}><em>{w.transliteration}</em></span> : null}
                  {w.translation ? <span className={styles.wordMeaning}>{w.translation}</span> : null}
                  <Link className={styles.wordMeaning} href={`/search?q=${encodeURIComponent(w.text.replace(/[ً-ْٰۖ-ۭ]/g, ""))}`} onClick={(e) => e.stopPropagation()} title={t.occurrences}>🔎</Link>
                </button>
              ))}
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.kicker}>{t.translations}</div>
            {b.translations.length ? b.translations.map((tr) => <div key={tr.id}><p className={styles.translation} dir="auto">{tr.text}</p><div className={styles.muted}>— {tr.name} · {tr.language}</div></div>) : <p className={styles.muted}>{t.none}</p>}
          </section>

          <section className={styles.card}>
            <div className={styles.row} style={{ justifyContent: "space-between" }}>
              <div className={styles.kicker}>{t.compare}</div>
              <div className={styles.row}>
                {[0, 1, 2].map((slot) => (
                  <select key={slot} className={styles.select} value={picked[slot] ?? ""} onChange={(e) => { const id = Number(e.target.value); setPicked((p) => { const n = p.slice(); if (!id) n.splice(slot, 1); else n[slot] = id; return [...new Set(n)].slice(0, 3); }); }}>
                    <option value="">{slot === 0 ? t.tafsir : "—"}</option>
                    {[...tafsirsByLang.entries()].map(([lang, list]) => <optgroup key={lang} label={lang}>{list.map((x) => <option key={x.id} value={x.id}>{x.name}{x.author ? ` · ${x.author}` : ""}</option>)}</optgroup>)}
                  </select>
                ))}
              </div>
            </div>
            <div className={styles.grid2}>
              {picked.map((id) => { const meta = b.tafsirs.find((x) => x.id === id); const text = tafsirText[id]; return (
                <div key={id} className={styles.card} style={{ padding: 14 }}>
                  <h2 className={styles.h2}>{meta?.name}{meta?.author ? <span className={styles.muted}> · {meta.author}</span> : null}</h2>
                  {text === null || text === undefined ? <p className={styles.muted}>{t.loading}</p> : text ? <div className={styles.tafsirText} dir={meta?.language === "arabic" || meta?.language === "urdu" ? "rtl" : "ltr"}>{text}</div> : <p className={styles.muted}>{t.none}</p>}
                </div>
              ); })}
            </div>
          </section>

          {b.chapterInfo ? <section className={styles.card}><div className={styles.kicker}>{t.info}</div><p className={styles.translation} dir="auto">{b.chapterInfo.shortText}</p>{b.chapterInfo.source ? <div className={styles.muted}>— {b.chapterInfo.source}</div> : null}</section> : null}

          <div className={styles.grid2}>
            <section className={styles.card}>
              <div className={styles.kicker}>{t.hadith}</div>
              {b.availability.hadith === "unavailable" ? <p className={styles.muted}>{t.prodOnly}</p> : !b.hadith?.length ? <p className={styles.muted}>{t.none}</p> : b.hadith.map((h, i) => <div key={i} className={styles.source}><p className={styles.translation} dir="auto">{h.text}</p><div className={styles.muted}>{h.collection} {h.number}{h.grade ? ` · ${h.grade}` : ""} {h.url ? <a href={h.url} target="_blank" rel="noreferrer">sunnah.com ↗</a> : null}</div></div>)}
            </section>
            <section className={styles.card}>
              <div className={styles.kicker}>{t.answers}</div>
              {b.availability.answers === "unavailable" ? <p className={styles.muted}>{t.prodOnly}</p> : !b.answers?.length ? <p className={styles.muted}>{t.none}</p> : b.answers.map((q) => <div key={q.id} className={styles.source}><strong>{q.question}</strong>{q.answers.map((a, i) => <p key={i} className={styles.translation} dir="auto">{a.body}{a.by ? <span className={styles.muted}> — {a.by}</span> : null}</p>)}</div>)}
            </section>
            <section className={styles.card}>
              <div className={styles.kicker}>{t.reflections} · QuranReflect</div>
              {b.availability.reflections === "unavailable" ? <p className={styles.muted}>{t.prodOnly}</p> : !b.reflections?.length ? <p className={styles.muted}>{t.none}</p> : b.reflections.map((r) => <div key={r.id} className={styles.source}><p className={styles.translation} dir="auto">{r.body}</p><div className={styles.muted}>{r.author}{r.verified ? " ✓" : ""} · ♥ {r.likes} {r.url ? <a href={r.url} target="_blank" rel="noreferrer">↗</a> : null}</div></div>)}
            </section>
          </div>
        </>
      ) : null}
      {toast ? <div className={styles.toast} role="status">{toast}</div> : null}
    </StudyShell>
  );
}
