"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  DEFAULT_MUSHAF_LAYOUT,
  MUSHAF_LAYOUTS,
  mushafLayoutById,
  type MushafPage as MushafPageData,
  type MushafWord,
} from "@qam/core";

import LanguageSelect from "@/components/language-select";
import { useI18n } from "@/lib/i18n";

import Link from "next/link";

import { isBookmarked } from "@qam/core";

import { useFamily, useProgressTicker } from "@/components/family/family-provider";

import styles from "./mushaf.module.css";

const STORAGE_LAYOUT = "qam.mushaf.layout";
const STORAGE_PAGE = "qam.mushaf.page";

/** Load one page font (or the static font) with the FontFace API; resolves when usable. */
const fontPromises = new Map<string, Promise<void>>();
const ensureFont = (family: string, url: string): Promise<void> => {
  if (typeof document === "undefined") return Promise.resolve();
  let p = fontPromises.get(family);
  if (!p) {
    p = (async () => {
      // Note: document.fonts.check() is true for unknown families, so it cannot be used as a cache test.
      const existing = Array.from(document.fonts).find((f) => f.family === family || f.family === `"${family}"`);
      if (existing) { await existing.loaded; return; }
      const face = new FontFace(family, `url(${url}) format("woff2")`, { display: "swap" });
      await face.load();
      document.fonts.add(face);
    })();
    fontPromises.set(family, p);
    p.catch(() => fontPromises.delete(family));
  }
  return p;
};

const fetchPage = async (page: number, layoutId: string): Promise<MushafPageData> => {
  const res = await fetch(`/api/public/v1/mushaf/page/${page}?layout=${encodeURIComponent(layoutId)}`);
  if (!res.ok) throw new Error(`page ${page} failed (${res.status})`);
  return (await res.json()) as MushafPageData;
};

interface Props { initialPage?: number; initialLayout?: string; highlightVerse?: string }

export default function MushafPage({ initialPage, initialLayout, highlightVerse }: Props) {
  const router = useRouter();
  const { ar, dir, m, num } = useI18n();
  const t = m.mushaf;
  const [layoutId, setLayoutId] = useState(initialLayout ?? DEFAULT_MUSHAF_LAYOUT);
  const [page, setPage] = useState(initialPage ?? 1);
  const [data, setData] = useState<MushafPageData | null>(null);
  const [fontReady, setFontReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<MushafWord | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const layout = mushafLayoutById(layoutId);
  const cache = useRef(new Map<string, MushafPageData>());
  const family = useFamily();
  useProgressTicker(selected?.verseKey ?? data?.surahs[0]?.firstVerseKey ?? null, page, !!family.profile && !!data);

  /* restore preferences */
  useEffect(() => {
    try {
      if (!initialLayout) { const l = window.localStorage.getItem(STORAGE_LAYOUT); if (l && MUSHAF_LAYOUTS.some((x) => x.id === l)) setLayoutId(l); }
      if (!initialPage) { const p = Number(window.localStorage.getItem(STORAGE_PAGE)); if (p >= 1) setPage(p); }
    } catch { /* ignore */ }
    setHydrated(true);
  }, [initialLayout, initialPage]);
  useEffect(() => { if (hydrated) { try { window.localStorage.setItem(STORAGE_LAYOUT, layoutId); window.localStorage.setItem(STORAGE_PAGE, String(page)); } catch { /* ignore */ } } }, [hydrated, layoutId, page]);

  /* load page + font, prefetch neighbours */
  useEffect(() => {
    let cancelled = false;
    setError(null);
    setFontReady(false);
    const key = `${layoutId}:${page}`;
    const load = async () => {
      try {
        const d = cache.current.get(key) ?? (await fetchPage(page, layoutId));
        cache.current.set(key, d);
        if (cancelled) return;
        setData(d);
        const ok = await ensureFont(d.fontFamily, d.fontUrl).then(() => true, () => false);
        if (!cancelled) setFontReady(ok);
        for (const n of [page + 1, page - 1]) {
          if (n >= 1 && n <= layout.pages && !cache.current.has(`${layoutId}:${n}`)) {
            fetchPage(n, layoutId).then((pd) => { cache.current.set(`${layoutId}:${n}`, pd); ensureFont(pd.fontFamily, pd.fontUrl).catch(() => undefined); }).catch(() => undefined);
          }
        }
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [page, layoutId, layout.pages]);

  const go = useCallback((n: number) => { if (n >= 1 && n <= layout.pages) { setSelected(null); setPage(n); } }, [layout.pages]);

  /* keyboard: in RTL the "next" page is to the left */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT" || (e.target as HTMLElement)?.tagName === "SELECT") return;
      if (e.key === "ArrowLeft") go(page + 1);
      if (e.key === "ArrowRight") go(page - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, page]);

  const playFrom = (w: MushafWord) => {
    const [s, a] = w.verseKey.split(":");
    router.push(`/player?surah=${s}&ayah=${a}`);
  };

  const fontFamily = data ? (fontReady ? `"${data.fontFamily}"` : `var(--font-noto-arabic), serif`) : undefined;
  const showText = !fontReady || layout.fontKind === "static-font";

  return (
    <div className={`${styles.root} ${layout.glyph === "textIndopak" ? styles.indopak : ""}`} dir={dir}>
      <header className={styles.top}>
        <h1 className={styles.title}>
          <span>{t.title}</span>
          <span className={styles.meta}>
            {data?.surahs.map((s) => `${t.surah} ${s.nameArabic}`).join(" · ")}
            {data?.juz ? ` · ${t.juz} ${num(data.juz)}` : ""}
          </span>
        </h1>
        <div className={styles.actions}>
          <select className={styles.select} value={layoutId} onChange={(e) => { setLayoutId(e.target.value); setPage((p) => Math.min(p, mushafLayoutById(e.target.value).pages)); }} aria-label="layout">
            {MUSHAF_LAYOUTS.map((l) => <option key={l.id} value={l.id}>{l.label[ar ? "ar" : "en"]}</option>)}
          </select>
          <input className={`${styles.chip} ${styles.pageInput}`} type="number" min={1} max={layout.pages} value={page} onChange={(e) => go(Number(e.target.value))} aria-label="page" />
          <button className={styles.chip} onClick={() => router.push(`/player?surah=${data?.surahs[0]?.number ?? 1}`)}>▶ {t.player}</button>
          <Link className={styles.chip} href="/family">{family.profile ? `${(family.profile as { avatar?: string }).avatar ?? "🌙"} ${family.profile.displayName}` : `👨‍👩‍👧 ${t.family}`}</Link>
          <LanguageSelect className={styles.select} />
        </div>
      </header>

      <main className={styles.stage}>
        {error ? (
          <div className={styles.error}><p>{error}</p><button className={styles.chip} onClick={() => go(page)}>{t.tryAgain}</button></div>
        ) : (
          <article className={styles.paper} style={{ ["--lines" as string]: layout.lines }} lang="ar" translate="no" aria-label={`page ${page}`}>
            {(data?.lines ?? Array.from({ length: layout.lines }, (_, i) => ({ number: i + 1, words: [], kind: "ayat" as const }))).map((line) => {
              if (line.kind === "surah-header") {
                const s = data?.surahs.find((x) => x.number === line.surahNumber);
                return <div key={line.number} className={`${styles.line} ${styles.header}`}>{t.surah} {s?.nameArabic ?? line.surahNumber}</div>;
              }
              if (line.kind === "basmala") {
                return <div key={line.number} className={`${styles.line} ${styles.basmala}`} style={{ fontFamily }}>{fontReady && layout.fontKind === "page-font" ? "" : "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ"}{fontReady && layout.fontKind === "page-font" ? <span className={styles.lineText} style={{ fontFamily: `var(--font-noto-arabic), serif` }}>بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ</span> : null}</div>;
              }
              const isLast = data ? line.number === Math.max(...data.lines.filter((l) => l.words.length).map((l) => l.number)) : false;
              return (
                <div key={line.number} className={`${styles.line} ${!data || !fontReady ? styles.loading : ""} ${isLast && line.words.length < 4 ? styles.center : ""}`} style={{ fontFamily }}>
                  {line.words.map((w) => (
                    <span
                      key={`${w.verseKey}-${w.position}`}
                      className={`${styles.word} ${styles.lineText} ${selected?.verseKey === w.verseKey ? styles.wordActive : ""} ${highlightVerse === w.verseKey ? styles.wordPlaying : ""}`}
                      onClick={() => setSelected(selected?.verseKey === w.verseKey && selected.position === w.position ? null : w)}
                      title={w.text}
                    >
                      {showText ? w.text : w.glyph}
                    </span>
                  ))}
                </div>
              );
            })}
            <div className={styles.pageNumber}>{num(page)}</div>
          </article>
        )}
      </main>

      <footer className={styles.bottom}>
        {selected && (
          <div className={styles.tip} dir="rtl">
            <span className={styles.tipArabic}>{selected.text}</span>
            <span className={styles.meta}>{selected.verseKey}</span>
            <span className={styles.actions}>
              <button className={styles.chip} onClick={() => playFrom(selected)}>▶ {t.listenFromHere}</button>
              <button className={styles.chip} onClick={() => family.profile ? family.dispatch({ type: "bookmark/toggle", verseKey: selected.verseKey, page }) : router.push("/family")}>
                🔖 {isBookmarked(family.state, selected.verseKey) ? t.bookmarked : t.bookmark}
              </button>
              <button className={styles.chip} onClick={() => router.push(`/player?surah=${selected.verseKey.split(":")[0]}&ayah=${selected.verseKey.split(":")[1]}&panel=tafsir`)}>{t.tafsir}</button>
            </span>
          </div>
        )}
        <div className={styles.bottomInner}>
          <button className={styles.navBtn} onClick={() => go(page - 1)} disabled={page <= 1} aria-label="previous page">{dir === "rtl" ? `${t.prev} ›` : `‹ ${t.prev}`}</button>
          <span className={styles.meta}>{`${t.page} ${num(page)} ${t.of} ${num(layout.pages)}`}</span>
          <button className={styles.navBtn} onClick={() => go(page + 1)} disabled={page >= layout.pages} aria-label="next page">{dir === "rtl" ? `‹ ${t.next}` : `${t.next} ›`}</button>
        </div>
      </footer>
    </div>
  );
}
