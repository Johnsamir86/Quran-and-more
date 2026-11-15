"use client";

import { useMemo, useState } from "react";

import { ADHKAR_CATEGORIES, adhkarFor, adhkarProgress, emptyAdhkarDay, suggestedAdhkar, type AdhkarCategory, type AdhkarDayState } from "@qam/core";

import { useI18n } from "@/lib/i18n";

import StudyShell from "../study/study-shell";
import shell from "../study/study.module.css";
import styles from "./worship.module.css";
import { useLocal } from "./use-local";

const todayIso = () => new Date().toISOString().slice(0, 10);

export default function AdhkarPage() {
  const { m, locale, num } = useI18n();
  const t = m.worship.adhkar;
  const [cat, setCat] = useState<AdhkarCategory>(() => suggestedAdhkar(new Date().getHours()));
  const [day, setDay] = useLocal<AdhkarDayState>("qam.adhkar.v1", () => emptyAdhkarDay(todayIso()));
  const state = day.day === todayIso() ? day : emptyAdhkarDay(todayIso());
  const list = useMemo(() => adhkarFor(cat), [cat]);
  const progress = adhkarProgress(cat, state);
  const [showTr, setShowTr] = useState(false);
  const tap = (id: string, max: number) => setDay((prev) => {
    const cur = prev.day === todayIso() ? prev : emptyAdhkarDay(todayIso());
    const n = Math.min(max, (cur.counts[id] ?? 0) + 1);
    if (navigator.vibrate && n === max) navigator.vibrate(30);
    return { ...cur, counts: { ...cur.counts, [id]: n } };
  });
  const reset = () => setDay((prev) => { const cur = { ...emptyAdhkarDay(todayIso()), counts: { ...prev.counts } }; for (const d of list) delete cur.counts[d.id]; return cur; });
  const showEnglish = locale !== "ar";
  const refOf = (d: { ref: string; refAr: string }) => (locale === "ar" ? d.refAr || d.ref : d.ref);
  const virtueOf = (d: { virtue: string; virtueAr: string }) => (locale === "ar" ? d.virtueAr || d.virtue : d.virtue);
  return (
    <StudyShell title={t.title}>
      <div className={shell.card}>
        <div className={styles.tabs}>
          {ADHKAR_CATEGORIES.map((c) => <button key={c} type="button" className={`${shell.chip} ${c === cat ? shell.chipActive : ""}`} onClick={() => setCat(c)}>{t[c]}</button>)}
        </div>
        <div className={shell.row} style={{ justifyContent: "space-between" }}>
          <span className={shell.pill}>{num(progress.done)} / {num(progress.total)} {t.completed}</span>
          <span className={shell.row}>
            {showEnglish ? <button type="button" className={shell.btnGhost} onClick={() => setShowTr((v) => !v)}>{showTr ? t.translation : t.transliteration}</button> : null}
            <button type="button" className={shell.btnGhost} onClick={reset}>{t.reset}</button>
          </span>
        </div>
        <div className={shell.progress}><div className={shell.progressBar} style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }} /></div>
        {progress.done === progress.total && progress.total > 0 ? <p className={shell.muted}>{t.allDone}</p> : <p className={shell.muted}>{t.tapToCount}</p>}
      </div>
      {list.map((d) => {
        const n = state.counts[d.id] ?? 0; const done = n >= d.count;
        return (
          <button key={d.id} type="button" className={`${styles.dhikr} ${done ? styles.dhikrDone : ""}`} onClick={() => tap(d.id, d.count)} aria-pressed={done}>
            <div className={styles.dhikrTop}>
              <span className={shell.kicker}>{d.count > 1 ? `${num(d.count)} ${t.times}` : t.once}{refOf(d) ? ` · ${refOf(d)}` : ""}</span>
              <span className={`${styles.counter} ${done ? styles.counterDone : ""}`}>{done ? "✓" : `${num(n)}/${num(d.count)}`}</span>
            </div>
            <p className={styles.arabic} lang="ar" dir="rtl">{d.ar}</p>
            {showEnglish ? <p className={styles.small}>{showTr && d.tr ? d.tr : d.en}</p> : null}
            {virtueOf(d) ? <p className={shell.muted}><b>{t.virtue}:</b> {virtueOf(d)}</p> : null}
          </button>
        );
      })}
      <p className={shell.muted}>{t.about}</p>
    </StudyShell>
  );
}
