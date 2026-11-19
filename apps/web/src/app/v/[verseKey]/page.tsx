import type { Metadata } from "next";
import Link from "next/link";

import { loadStudy } from "@/lib/study-api";

import styles from "./share.module.css";

/** Shareable verse link (quran.link-style): /v/2:255 with a preview card for chats and social. */
const parse = (raw: string) => { const k = decodeURIComponent(raw).replace("-", ":"); return /^\d{1,3}:\d{1,3}$/.test(k) ? k : null; };

export async function generateMetadata({ params }: { params: Promise<{ verseKey: string }> }): Promise<Metadata> {
  const { verseKey } = await params;
  const key = parse(verseKey);
  if (!key) return { title: "Quran and More" };
  const b = await loadStudy(key, "en").catch(() => null);
  const title = b ? `${b.chapter.arabicName} · ${b.chapter.latinName} ${key}` : key;
  const description = b ? `${b.text} — ${b.translations[0]?.text ?? ""}`.slice(0, 300) : "";
  return { title, description, openGraph: { title, description, images: [{ url: `/api/og/${key}`, width: 1200, height: 630 }] }, twitter: { card: "summary_large_image", title, description, images: [`/api/og/${key}`] } };
}

export default async function Page({ params }: { params: Promise<{ verseKey: string }> }) {
  const { verseKey } = await params;
  const key = parse(verseKey);
  const b = key ? await loadStudy(key, "en").catch(() => null) : null;
  if (!key || !b) return <main className={styles.root}><p>Ayah not found.</p><Link href="/">Quran and More</Link></main>;
  return (
    <main className={styles.root}>
      <div className={styles.card}>
        <p className={styles.kicker}>{b.chapter.arabicName} · {b.chapter.latinName} · {key}</p>
        <p className={styles.arabic} lang="ar" translate="no">{b.text} <span className={styles.marker}>﴿{b.verse.toLocaleString("ar-EG", { useGrouping: false })}﴾</span></p>
        {b.translations.map((t) => <p key={t.id} className={styles.translation} dir="auto">{t.text}<span className={styles.muted}> — {t.name}</span></p>)}
        <div className={styles.actions}>
          <Link className={styles.primary} href={`/player?surah=${b.chapter.number}&ayah=${b.verse}`}>▶ Listen · استمع</Link>
          <Link className={styles.secondary} href={`/study/${key}`}>📖 Study · دراسة</Link>
          <Link className={styles.secondary} href={b.page ? `/mushaf?page=${b.page}` : "/mushaf"}>🕋 Mushaf · المصحف</Link>
        </div>
        <p className={styles.muted}>Quran and More · quran-and-more.netlify.app</p>
      </div>
    </main>
  );
}
