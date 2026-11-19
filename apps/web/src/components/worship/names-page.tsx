"use client";

import { useMemo, useState } from "react";

import { DIVINE_NAMES, nameOfDay } from "@qam/core";

import { useI18n } from "@/lib/i18n";

import StudyShell from "../study/study-shell";
import shell from "../study/study.module.css";
import styles from "./worship.module.css";

export default function NamesPage() {
  const { m, locale, num } = useI18n();
  const t = m.worship.names;
  const [q, setQ] = useState("");
  const today = useMemo(() => nameOfDay(new Date()), []);
  const ar = locale === "ar";
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return DIVINE_NAMES;
    return DIVINE_NAMES.filter((n) => n.ar.includes(s) || n.tr.toLowerCase().includes(s) || n.en.toLowerCase().includes(s) || n.arMeaning.includes(s) || String(n.n) === s);
  }, [q]);
  return (
    <StudyShell title={t.title}>
      <div className={shell.card}>
        <span className={shell.kicker}>{t.today}</span>
        <p className={`${styles.arabic}`} lang="ar" dir="rtl" style={{ fontSize: "2.4em", textAlign: "center" }}>{today.ar}</p>
        <p style={{ textAlign: "center" }}><b>{today.tr}</b> · {ar ? today.arMeaning : today.en}</p>
        <input className={shell.input} value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.search} aria-label={t.search} />
      </div>
      <div className={shell.tiles}>
        {list.map((n) => (
          <div key={n.n} className={shell.tile}>
            <span className={shell.kicker}>{num(n.n)}</span>
            <p className={styles.arabic} lang="ar" dir="rtl" style={{ textAlign: "center", lineHeight: 1.6 }}>{n.ar}</p>
            <b style={{ textAlign: "center" }}>{n.tr}</b>
            <span className={shell.muted} style={{ textAlign: "center" }}>{ar ? n.arMeaning : n.en}</span>
          </div>
        ))}
      </div>
      <p className={shell.muted}>{t.about}</p>
    </StudyShell>
  );
}
