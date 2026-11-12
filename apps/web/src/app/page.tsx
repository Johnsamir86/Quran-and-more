import Link from "next/link";


import styles from "./home.module.css";

const TILES = [
  { href: "/player", icon: "▶", ar: "المشغّل", en: "Player", arSub: "استمع واقرأ وترجم وتدبّر في شاشة واحدة، بأي قارئ", enSub: "Listen, read, translate and study tafsir in one screen, any reciter" },
  { href: "/mushaf", icon: "📖", ar: "المصحف", en: "Mushaf", arSub: "صفحة بصفحة بالخط العثماني ومصحف التجويد", enSub: "Page by page with the official fonts and the Tajweed mushaf" },
  { href: "/family", icon: "👨‍👩‍👧", ar: "العائلة", en: "Family", arSub: "ملف لكل فرد، من الطفل إلى الجد", enSub: "A profile for every member, from child to grandparent" },
  { href: "/search", icon: "🔎", ar: "بحث", en: "Search", arSub: "ابحث عن كلمة أو آية أو سورة في القرآن كله", enSub: "Find any word, ayah or surah across the whole Quran" },
  { href: "/study/2:255", icon: "🧭", ar: "دراسة الآية", en: "Study", arSub: "كلمة بكلمة، ترجمات، وقارن حتى ثلاثة تفاسير جنبًا إلى جنب", enSub: "Word by word, translations and up to three tafsirs side by side" },
  { href: "/learn", icon: "🎓", ar: "تعلّم", en: "Learn", arSub: "دروس مفردات على طريقة Quranlingo بنقاط وسلاسل أيام", enSub: "Quranlingo-style vocabulary lessons with XP and streaks" },
  { href: "/hifz", icon: "🧠", ar: "حفظ", en: "Memorise", arSub: "أخفِ الآية وتذكّرها ثم قيّم نفسك، مع مراجعة متباعدة واختبار بالميكروفون", enSub: "Hide, recall and grade yourself with spaced review and a microphone check" },
  { href: "/play", icon: "🎮", ar: "العب", en: "Play", arSub: "من أي سورة؟ الآية التالية؟ الكلمة الناقصة؟ في أي جزء؟", enSub: "Which surah? Next ayah? Missing word? Which juz?" },
  { href: "/ask", icon: "💬", ar: "اسأل", en: "Ask", arSub: "إجابات من الآيات والتفاسير فقط، بنقل حرفي وبانتظار مراجعة علمية", enSub: "Answers only from ayat and tafsir, quoted verbatim, pending scholarly review" },
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
      <footer className={styles.footer}>
        <Link href="/privacy">الخصوصية</Link> · <Link href="/terms">الشروط</Link> · <a href="https://quran.foundation" target="_blank" rel="noreferrer">Powered by Quran Foundation APIs</a>
      </footer>
    </main>
  );
}
