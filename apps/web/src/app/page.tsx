import Link from "next/link";

import { STATIONS } from "@qam/core";

import styles from "./home.module.css";

const TILES = [
  { href: "/player", icon: "▶", ar: "المشغّل", en: "Player", arSub: "استمع واقرأ وترجم وتدبّر في شاشة واحدة، بأي قارئ", enSub: "Listen, read, translate and study tafsir in one screen, any reciter" },
  { href: "/mushaf", icon: "📖", ar: "المصحف", en: "Mushaf", arSub: "صفحة بصفحة بالخط العثماني ومصحف التجويد", enSub: "Page by page with the official fonts and the Tajweed mushaf" },
  { href: "/family", icon: "👨‍👩‍👧", ar: "العائلة", en: "Family", arSub: "ملف لكل فرد، من الطفل إلى الجد", enSub: "A profile for every member, from child to grandparent" },
  { href: "/player?surah=18", icon: "🕌", ar: "سورة الكهف", en: "Surah Al-Kahf", arSub: "تُقرأ يوم الجمعة", enSub: "Read on Friday" },
];

export default function HomePage() {
  return (
    <main className={styles.root}>
      <section className={styles.hero}>
        <p className={styles.kicker}>القرآن الكريم · Quran and More</p>
        <h1 className={styles.title} lang="ar">قرآن وأكثر</h1>
        <p className={styles.sub}>تجربة قرآنية كاملة للعائلة كلها: تلاوة متصلة مع تزامن الكلمات، مصحف بالخط العثماني، تفسير وترجمات بكل اللغات، وملف لكل فرد.</p>
        <p className={styles.subEn}>One Quran experience for the whole family, on web, phone and TV.</p>
        <div className={styles.cta}>
          <Link className={styles.primary} href="/player">▶ ابدأ الاستماع</Link>
          <Link className={styles.secondary} href="/mushaf">📖 افتح المصحف</Link>
        </div>
      </section>
      <section className={styles.grid}>
        {TILES.map((t) => (
          <Link key={t.href} href={t.href} className={styles.tile}>
            <span className={styles.icon} aria-hidden>{t.icon}</span>
            <span className={styles.tileTitle}>{t.ar} <span className={styles.en}>{t.en}</span></span>
            <span className={styles.tileSub}>{t.arSub}</span>
            <span className={styles.tileSubEn}>{t.enSub}</span>
          </Link>
        ))}
      </section>
      <section>
        <h2 className={styles.h2}>الإذاعة · Radio</h2>
        <div className={styles.stations}>
          {STATIONS.map((s) => (
            <Link key={s.id} href={`/player?surah=${s.surahs[0]}&station=${s.id}`} className={styles.station}>
              <span className={styles.stationTitle}>{s.title.ar}</span>
              <span className={styles.tileSub}>{s.subtitle.ar}</span>
            </Link>
          ))}
        </div>
      </section>
      <footer className={styles.footer}>
        <Link href="/privacy">الخصوصية</Link> · <Link href="/terms">الشروط</Link> · <a href="https://quran.foundation" target="_blank" rel="noreferrer">Powered by Quran Foundation APIs</a>
      </footer>
    </main>
  );
}
