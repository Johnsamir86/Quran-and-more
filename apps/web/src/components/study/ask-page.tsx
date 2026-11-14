"use client";

import Link from "next/link";
import { useState } from "react";

import SourcesBadge from "@/components/sources-badge";
import { useI18n } from "@/lib/i18n";

import StudyShell from "./study-shell";
import styles from "./study.module.css";

interface Source { verseKey: string; text: string; translation: string | null; tafsir: { name: string; text: string } | null }
interface Answer { question: string; mode: "retrieval" | "model"; answer: string | null; sources: Source[]; disclaimer: string; model: string | null }

export default function AskPage() {
  const { locale, m } = useI18n();
  const t = m.ask;
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(false);
  const [reported, setReported] = useState<Set<string>>(new Set());

  const ask = async (question: string) => {
    if (question.trim().length < 3) return;
    setLoading(true); setQ("");
    try {
      const res = await fetch("/api/ask", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ question, language: locale }) });
      const json = (await res.json()) as Answer & { error?: { message: string } };
      setItems((list) => [...list, json.error ? { question, mode: "retrieval", answer: json.error.message, sources: [], disclaimer: "", model: null } : json]);
    } finally { setLoading(false); }
  };

  return (
    <StudyShell title={t.title}>
      <section className={styles.card}>
        <div className={styles.row}><div className={styles.kicker}>Quran AI · {t.pending}</div><SourcesBadge compact /></div>
        <p className={styles.muted}>{t.intro}</p>
        <div className={styles.row}>{t.examples.map((e) => <button key={e} className={styles.chip} onClick={() => ask(e)}>{e}</button>)}</div>
      </section>
      <section className={styles.chat}>
        {items.map((a, i) => (
          <div key={i} style={{ display: "grid", gap: 8 }}>
            <div className={styles.bubbleQ}>{a.question}</div>
            <div className={styles.bubbleA}>
              <span className={styles.pill}>{a.mode === "model" ? `🤖 ${t.model}` : `📚 ${t.retrieval}`}</span>
              {a.answer ? <div dir="auto">{a.answer}</div> : null}
              {a.mode === "retrieval" && a.sources.length ? <p className={styles.muted}>{t.nokey}</p> : null}
              {a.sources.length ? <div className={styles.kicker}>{t.sources}</div> : null}
              {a.sources.map((s) => (
                <div key={s.verseKey} className={styles.source}>
                  <p className={styles.arabic} lang="ar" translate="no" style={{ fontSize: "1.4em" }}>{s.text} <Link href={`/study/${s.verseKey}`} className={styles.resultKey}>({s.verseKey})</Link></p>
                  {s.translation ? <p className={styles.translation}>{s.translation}</p> : null}
                  {s.tafsir ? <details><summary className={styles.muted}>{t.tafsir}: {s.tafsir.name}</summary><p className={styles.translation} dir="auto">{s.tafsir.text}</p></details> : null}
                </div>
              ))}
              {a.disclaimer ? <p className={styles.muted}>{a.disclaimer}</p> : null}
              <div className={styles.row}><button className={styles.chip} disabled={reported.has(a.question)} onClick={() => setReported((r) => new Set(r).add(a.question))}>🚩 {reported.has(a.question) ? t.reported : t.report}</button></div>
            </div>
          </div>
        ))}
      </section>
      <form className={styles.card} onSubmit={(e) => { e.preventDefault(); void ask(q); }}>
        <div className={styles.row}><input className={styles.input} value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.placeholder} /><button className={styles.btn} disabled={loading}>{loading ? "…" : t.ask}</button></div>
      </form>
    </StudyShell>
  );
}
