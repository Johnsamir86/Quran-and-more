"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { KHATMAH_PRESETS, KHATMAH_STORAGE_KEY, MUSHAF_PAGES, daysToRamadan, isoDay, juzOfPage, khatmahStatus, pagesPerDay, type KhatmahPlan } from "@qam/core";

import { useFamily } from "@/components/family/family-provider";
import { useI18n } from "@/lib/i18n";

import StudyShell from "../study/study-shell";
import shell from "../study/study.module.css";
import styles from "./worship.module.css";
import { fmt, useLocal } from "./use-local";

interface Stored { plan: KhatmahPlan | null; readPage: number }

export default function KhatmahPage() {
  const { m, num } = useI18n();
  const t = m.worship.khatmah;
  const { state, profile, dispatch } = useFamily();
  const [st, setSt] = useLocal<Stored>(KHATMAH_STORAGE_KEY, () => ({ plan: null, readPage: 0 }));
  const [days, setDays] = useState(30);
  const [startPage, setStartPage] = useState(1);
  const today = isoDay(new Date());
  const ramadanIn = daysToRamadan(new Date());
  // The mushaf records the last page read per profile; take the furthest of that and what was marked here.
  const mushafPage = profile ? state.progress[profile.id]?.lastPage ?? 0 : 0;
  const readPage = Math.max(st.readPage, st.plan && mushafPage >= st.plan.startPage ? mushafPage : 0);
  const status = useMemo(() => (st.plan ? khatmahStatus(st.plan, readPage, today) : null), [st.plan, readPage, today]);
  const start = (d: number, sp = startPage) => setSt({ plan: { startDay: today, days: Math.max(1, d), startPage: Math.min(MUSHAF_PAGES, Math.max(1, sp)), createdAt: Date.now() }, readPage: Math.max(0, sp - 1) });
  const mark = (page: number) => {
    const p = Math.max(0, Math.min(MUSHAF_PAGES, page));
    setSt((prev) => ({ ...prev, readPage: p }));
    if (profile && p > 0) dispatch({ type: "progress/record", page: p, seconds: 0, day: today });
  };
  const plan = st.plan;
  return (
    <StudyShell title={t.title}>
      {!plan || !status ? (
        <div className={shell.card}>
          <span className={shell.kicker}>{t.plan}</span>
          <p className={shell.muted}>{t.noPlan}</p>
          <div className={styles.tabs}>
            {KHATMAH_PRESETS.map((d) => <button key={d} type="button" className={`${shell.chip} ${d === days ? shell.chipActive : ""}`} onClick={() => setDays(d)}>{num(d)} {t.days}</button>)}
            {ramadanIn > 1 ? <button type="button" className={`${shell.chip} ${days === ramadanIn ? shell.chipActive : ""}`} onClick={() => setDays(ramadanIn)}>🌙 {t.beforeRamadan} ({num(ramadanIn)} {t.days})</button> : null}
          </div>
          <div className={shell.row}>
            <label className={shell.row}>{t.custom} <input className={shell.select} type="number" min={1} max={3650} value={days} onChange={(e) => setDays(Math.max(1, Number(e.target.value) || 1))} /></label>
            <label className={shell.row}>{t.startPage} <input className={shell.select} type="number" min={1} max={MUSHAF_PAGES} value={startPage} onChange={(e) => setStartPage(Math.max(1, Math.min(MUSHAF_PAGES, Number(e.target.value) || 1)))} /></label>
          </div>
          <p>≈ <b>{num(Math.ceil((MUSHAF_PAGES - startPage + 1) / days))}</b> {t.pagesPerDay}</p>
          <div className={shell.row}><button type="button" className={shell.btn} onClick={() => start(days)}>{t.start}</button></div>
        </div>
      ) : (
        <>
          <div className={shell.card}>
            <div className={shell.row} style={{ justifyContent: "space-between" }}>
              <span className={shell.kicker}>{t.day} {num(status.dayIndex + 1)} {t.of} {num(plan.days)} · {num(status.daysLeft)} {t.daysLeft}</span>
              <span className={shell.pill}>{num(status.percent)}% {t.percent}</span>
            </div>
            <div className={shell.progress}><div className={shell.progressBar} style={{ width: `${status.percent}%` }} /></div>
            {status.finished ? <p><b>{t.finished}</b></p> : (
              <>
                <span className={shell.kicker}>{t.today}</span>
                <div className={styles.bigNum}>{num(status.todayFrom)} – {num(status.todayTo)}</div>
                <p className={shell.muted}>{t.pages} · {t.juz} {num(juzOfPage(status.todayFrom))}{juzOfPage(status.todayTo) !== juzOfPage(status.todayFrom) ? `–${num(juzOfPage(status.todayTo))}` : ""} · ≈ {num(Math.ceil(pagesPerDay(plan)))} {t.pagesPerDay} · {num(MUSHAF_PAGES - status.readPage)} {t.pagesLeft}</p>
                <p>{status.behindPages > 0 ? <span style={{ color: "var(--warn, #b45309)" }}>⚠ {num(status.behindPages)} {t.behind}</span> : <span style={{ color: "var(--accent)" }}>✓ {t.onTrack}</span>}</p>
                <div className={shell.row}>
                  <Link className={shell.btn} href={`/mushaf?page=${status.todayFrom}`}>📖 {t.openMushaf}</Link>
                  <button type="button" className={shell.btnGhost} onClick={() => mark(status.todayTo)}>✓ {t.markRead}</button>
                </div>
              </>
            )}
          </div>
          <div className={shell.card}>
            <span className={shell.kicker}>{t.lastRead}</span>
            <div className={shell.row}>
              <input className={shell.select} type="number" min={0} max={MUSHAF_PAGES} value={status.readPage} onChange={(e) => mark(Number(e.target.value) || 0)} />
              <span className={shell.muted}>{t.page} · {t.juz} {num(juzOfPage(Math.max(1, status.readPage)))} · {mushafPage > st.readPage ? t.fromProgress : ""}</span>
            </div>
            <div className={shell.row}><button type="button" className={shell.btnGhost} onClick={() => setSt({ plan: null, readPage: 0 })}>{t.restart}</button></div>
          </div>
        </>
      )}
      <p className={shell.muted}>{fmt("{a} · {b}", { a: `${num(MUSHAF_PAGES)} ${t.pages}`, b: `30 ${t.juz}` })}</p>
    </StudyShell>
  );
}
