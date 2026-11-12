"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import StudyShell, { useUiLocale } from "./study-shell";
import styles from "./study.module.css";

interface NavItem { type: string; key: string; label: string; href: string }
interface Verse { verseKey: string; chapter: number; verse: number; text: string; translation: string | null; translationName: string | null; highlight: string | null }
interface Result { query: string; mode: string; source: string; navigation: NavItem[]; verses: Verse[]; pagination: { page: number; size: number; total: number; totalPages: number; nextPage: number | null } }

const COPY = {
  ar: { title: "بحث", placeholder: "ابحث في القرآن: كلمة، آية، سورة، أو 2:255", go: "بحث", none: "لا نتائج", nav: "انتقال سريع", verses: "آيات", more: "المزيد", results: "نتيجة", exact: "مطابقة تامة", study: "دراسة", play: "استمع", source: "المصدر", tip: "جرّب: الرحمن · الكهف · 36:1 · صبر" },
  en: { title: "Search", placeholder: "Search the Quran: a word, an ayah, a surah, or 2:255", go: "Search", none: "No results", nav: "Jump to", verses: "Ayat", more: "More", results: "results", exact: "Exact matches", study: "Study", play: "Listen", source: "Source", tip: "Try: mercy · Al-Kahf · 36:1 · patience" },
};

export default function SearchPage() {
  const locale = useUiLocale();
  const ar = locale === "ar";
  const t = ar ? COPY.ar : COPY.en;
  const params = useSearchParams();
  const router = useRouter();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [exact, setExact] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (query: string, page = 1, append = false) => {
    if (!query.trim()) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/public/v1/search?q=${encodeURIComponent(query)}&mode=advanced&size=20&page=${page}&language=${locale}${exact ? "&exact=1" : ""}`);
      const json = (await res.json()) as Result & { error?: { message: string } };
      if (json.error) throw new Error(json.error.message);
      setResult((prev) => (append && prev ? { ...json, verses: [...prev.verses, ...json.verses] } : json));
    } catch (e) { setError((e as Error).message); } finally { setLoading(false); }
  };
  useEffect(() => { const initial = params.get("q"); if (initial) void run(initial); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  const submit = (e: React.FormEvent) => { e.preventDefault(); router.replace(`/search?q=${encodeURIComponent(q)}`); void run(q); };
  const mark = (v: Verse) => v.highlight ? <span dangerouslySetInnerHTML={{ __html: v.highlight.replace(/<em>/g, `<mark class="${styles.hl}">`).replace(/<\/em>/g, "</mark>") }} /> : v.text;

  return (
    <StudyShell title={t.title}>
      <form onSubmit={submit} className={styles.card}>
        <div className={styles.row}>
          <input className={styles.input} value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.placeholder} autoFocus />
          <button className={styles.btn} disabled={loading}>{t.go}</button>
        </div>
        <div className={styles.row}>
          <label className={styles.muted}><input type="checkbox" checked={exact} onChange={(e) => setExact(e.target.checked)} /> {t.exact}</label>
          <span className={styles.muted}>{t.tip}</span>
        </div>
      </form>
      {error ? <p className={styles.card} role="alert">{error}</p> : null}
      {result?.navigation.length ? (
        <section className={styles.card}>
          <div className={styles.kicker}>{t.nav}</div>
          <div className={styles.row}>{result.navigation.map((n) => <Link key={`${n.type}-${n.key}`} href={n.href} className={styles.chip}>{n.type === "surah" ? "🕌" : n.type === "ayah" ? "📍" : "📄"} {n.label}</Link>)}</div>
        </section>
      ) : null}
      {result ? (
        <section className={styles.card}>
          <div className={styles.row} style={{ justifyContent: "space-between" }}>
            <div className={styles.kicker}>{t.verses} · {result.pagination.total.toLocaleString(ar ? "ar-EG" : "en")} {t.results}</div>
            <span className={styles.muted}>{t.source}: {result.source === "qf" ? "Quran Foundation Search API" : "Quran.com v4"}</span>
          </div>
          {!result.verses.length ? <p className={styles.muted}>{t.none}</p> : null}
          {result.verses.map((v) => (
            <div key={v.verseKey} className={styles.result}>
              <div className={styles.row} style={{ justifyContent: "space-between" }}>
                <span className={styles.resultKey}>{v.verseKey}</span>
                <span className={styles.row}><Link className={styles.chip} href={`/study/${v.verseKey}`}>📖 {t.study}</Link><Link className={styles.chip} href={`/player?surah=${v.chapter}&ayah=${v.verse}`}>▶ {t.play}</Link></span>
              </div>
              <p className={styles.arabic} lang="ar" translate="no">{mark(v)}</p>
              {v.translation ? <p className={styles.translation}>{v.translation}{v.translationName ? <span className={styles.muted}> — {v.translationName}</span> : null}</p> : null}
            </div>
          ))}
          {result.pagination.nextPage ? <button className={styles.btnGhost} disabled={loading} onClick={() => run(result.query, result.pagination.nextPage!, true)}>{t.more}</button> : null}
        </section>
      ) : null}
    </StudyShell>
  );
}
