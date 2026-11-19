"use client";

import { useMemo, useState } from "react";

import { daysToRamadan, hijriDate, hijriMonthGrid, toHijri, upcomingEvents, type UpcomingEvent } from "@qam/core";

import { useI18n } from "@/lib/i18n";

import StudyShell from "../study/study-shell";
import shell from "../study/study.module.css";
import styles from "./worship.module.css";
import { fmt, useLocal } from "./use-local";

const monthTitle = (date: Date, locale: string) => { try { return new Intl.DateTimeFormat(`${locale}-u-ca-islamic-umalqura`, { month: "long", year: "numeric" }).format(date); } catch { return ""; } };
const gDay = (d: Date, locale: string) => { try { return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(d); } catch { return d.toDateString(); } };
const gFull = (d: Date, locale: string) => { try { return new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric", month: "long", year: "numeric" }).format(d); } catch { return d.toDateString(); } };

export default function CalendarPage() {
  const { m, locale, num } = useI18n();
  const t = m.worship.calendar;
  const [adjust, setAdjust] = useLocal<number>("qam.hijri.adjust", () => 0);
  const today = useMemo(() => new Date(), []);
  const h = toHijri(today, adjust);
  const [view, setView] = useState({ year: h.year, month: h.month });
  const grid = useMemo(() => hijriMonthGrid(view.year, view.month, adjust), [view, adjust]);
  const events = useMemo(() => upcomingEvents(today, adjust), [today, adjust]);
  const ramadan = daysToRamadan(today, adjust);
  const eventOn = (y: number, mo: number, d: number) => events.find((e) => e.hijri.year === y && e.hijri.month === mo && d >= e.hijri.day && d < e.hijri.day + (e.id === "whiteDays" ? 3 : e.id === "lastTenNights" ? 10 : e.id === "tashriq" ? 3 : 1));
  const when = (e: UpcomingEvent) => (e.inDays === 0 ? t.todayIs : e.inDays === 1 ? t.tomorrow : fmt(t.inDays, { n: num(e.inDays) }));
  const move = (d: number) => setView((v) => { let mo = v.month + d, y = v.year; if (mo < 1) { mo = 12; y -= 1; } if (mo > 12) { mo = 1; y += 1; } return { year: y, month: mo }; });
  return (
    <StudyShell title={t.title}>
      <div className={shell.card}>
        <span className={shell.kicker}>{t.today}</span>
        <h1 className={shell.h1}>{hijriDate(new Date(today.getTime() + adjust * 86_400_000), locale)}</h1>
        <p className={shell.muted}>{gFull(today, locale)}</p>
        <div className={shell.row} style={{ justifyContent: "space-between" }}>
          <span className={shell.pill}>{ramadan === 0 ? `🌙 ${t.inRamadan}` : `🌙 ${t.ramadanIn} ${num(ramadan)} ${t.daysToRamadan}`}</span>
          <span className={styles.stepper}>
            <span className={shell.muted}>{t.adjust}</span>
            <button type="button" className={styles.stepBtn} onClick={() => setAdjust((a) => Math.max(-2, a - 1))} aria-label="-1">−</button>
            <b>{adjust > 0 ? `+${num(adjust)}` : num(adjust)}</b>
            <button type="button" className={styles.stepBtn} onClick={() => setAdjust((a) => Math.min(2, a + 1))} aria-label="+1">+</button>
          </span>
        </div>
        <p className={shell.muted}>{t.adjustHelp}</p>
      </div>
      <div className={shell.card}>
        <div className={shell.row} style={{ justifyContent: "space-between" }}>
          <button type="button" className={shell.btnGhost} onClick={() => move(-1)}>‹ {t.prevMonth}</button>
          <h2 className={shell.h2}>{monthTitle(grid[0]?.date ?? today, locale)}</h2>
          <button type="button" className={shell.btnGhost} onClick={() => move(1)}>{t.nextMonth} ›</button>
        </div>
        <div className={styles.calGrid}>
          {grid.map((cell) => {
            const isToday = view.year === h.year && view.month === h.month && cell.day === h.day;
            const ev = eventOn(view.year, view.month, cell.day);
            return (
              <div key={cell.day} className={`${styles.calCell} ${isToday ? styles.calToday : ""} ${ev ? styles.calEvent : ""}`} title={ev ? t.eventNames[ev.id] : undefined}>
                <span>{num(cell.day)}</span>
                <span className={styles.calG}>{gDay(cell.date, locale)}</span>
                {ev ? <span aria-hidden>{ev.id === "eidFitr" || ev.id === "eidAdha" ? "🎉" : ev.fasting ? "🌙" : "•"}</span> : null}
              </div>
            );
          })}
        </div>
      </div>
      <div className={shell.card}>
        <span className={shell.kicker}>{t.events}</span>
        {events.map((e) => (
          <div key={`${e.id}-${e.hijri.year}-${e.hijri.month}`} className={styles.eventRow}>
            <div>
              <div><b>{t.eventNames[e.id]}</b> {e.fasting ? <span className={shell.pill}>{t.fasting}</span> : null}</div>
              <div className={shell.muted}>{gFull(e.date, locale)}{t.eventNotes[e.id as keyof typeof t.eventNotes] ? ` · ${t.eventNotes[e.id as keyof typeof t.eventNotes]}` : ""}</div>
            </div>
            <b style={{ whiteSpace: "nowrap" }}>{when(e)}</b>
          </div>
        ))}
      </div>
    </StudyShell>
  );
}
