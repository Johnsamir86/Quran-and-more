"use client";

import Link from "next/link";

import LanguageSelect from "@/components/language-select";
import { useI18n } from "@/lib/i18n";

import styles from "./home.module.css";

const TILES: { href: string; icon: string; key: "player" | "mushaf" | "family" | "search" | "study" | "learn" | "hifz" | "play" | "ask" | "azan" | "story" | "kahf" }[] = [
  { href: "/player", icon: "▶", key: "player" },
  { href: "/mushaf", icon: "📖", key: "mushaf" },
  { href: "/azan", icon: "🕌", key: "azan" },
  { href: "/story", icon: "✨", key: "story" },
  { href: "/family", icon: "👨‍👩‍👧", key: "family" },
  { href: "/search", icon: "🔎", key: "search" },
  { href: "/study/2:255", icon: "🧭", key: "study" },
  { href: "/learn", icon: "🎓", key: "learn" },
  { href: "/hifz", icon: "🧠", key: "hifz" },
  { href: "/play", icon: "🎮", key: "play" },
  { href: "/ask", icon: "💬", key: "ask" },
  { href: "/player?surah=18", icon: "🕋", key: "kahf" },
];

export default function HomePage() {
  const { m, dir, locale } = useI18n();
  const h = m.home;
  return (
    <main className={styles.root} dir={dir}>
      <section className={styles.hero}>
        <p className={styles.kicker}>{h.kicker} · {locale === "ar" ? "Quran and More" : "القرآن الكريم"}</p>
        <h1 className={styles.title} lang="ar">{m.common.appNameArabic}</h1>
        <p className={styles.sub}>{h.sub}</p>
        <div className={styles.cta}>
          <Link className={styles.primary} href="/player">▶ {h.startListening}</Link>
          <Link className={styles.secondary} href="/mushaf">📖 {h.openMushaf}</Link>
          <LanguageSelect className={styles.secondary} />
        </div>
      </section>
      <section className={styles.grid}>
        {TILES.map((t) => (
          <Link key={t.href} href={t.href} className={styles.tile}>
            <span className={styles.icon} aria-hidden>{t.icon}</span>
            <span className={styles.tileTitle}>{h.tiles[t.key].title}</span>
            <span className={styles.tileSub}>{h.tiles[t.key].sub}</span>
          </Link>
        ))}
      </section>
      <footer className={styles.footer}>
        <Link href="/privacy">{m.common.privacy}</Link> · <Link href="/terms">{m.common.terms}</Link> · <a href="https://quran.foundation" target="_blank" rel="noreferrer">{m.common.poweredBy}</a>
      </footer>
    </main>
  );
}
