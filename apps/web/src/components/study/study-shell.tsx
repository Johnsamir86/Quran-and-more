"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import { resolveLocale } from "@qam/core";

import { useFamily } from "@/components/family/family-provider";

import styles from "./study.module.css";

/** Locale shared by the study/learn/play/ask pages (UI language picked in the player, else device). */
export const useUiLocale = () => {
  const [loc, setLoc] = useState("ar");
  useEffect(() => {
    try { const o = localStorage.getItem("qam.player.locale"); setLoc(o ? (JSON.parse(o) as string) ?? resolveLocale(navigator.language) : resolveLocale(navigator.language)); } catch { setLoc(resolveLocale(navigator.language)); }
  }, []);
  return loc;
};

export const useToday = () => useMemo(() => new Date().toISOString().slice(0, 10), []);

const NAV = [
  { href: "/search", ar: "بحث", en: "Search", icon: "🔎" },
  { href: "/learn", ar: "تعلّم", en: "Learn", icon: "🎓" },
  { href: "/hifz", ar: "حفظ", en: "Memorise", icon: "🧠" },
  { href: "/play", ar: "العب", en: "Play", icon: "🎮" },
  { href: "/ask", ar: "اسأل", en: "Ask", icon: "💬" },
  { href: "/player", ar: "المشغّل", en: "Player", icon: "▶" },
  { href: "/mushaf", ar: "المصحف", en: "Mushaf", icon: "📖" },
];

export default function StudyShell({ title, children, actions }: { title?: string; children: ReactNode; actions?: ReactNode }) {
  const pathname = usePathname() ?? "/";
  const locale = useUiLocale();
  const ar = locale === "ar";
  const family = useFamily();
  return (
    <div className={styles.root} dir={ar || locale === "ur" || locale === "fa" ? "rtl" : "ltr"}>
      <header className={styles.top}>
        <Link href="/" className={styles.brand}>{ar ? "قرآن وأكثر" : "Quran and More"}{title ? <span className={styles.muted}> · {title}</span> : null}</Link>
        <nav className={styles.nav}>
          {NAV.map((n) => <Link key={n.href} href={n.href} className={`${styles.chip} ${pathname.startsWith(n.href) ? styles.chipActive : ""}`}>{n.icon} <span>{ar ? n.ar : n.en}</span></Link>)}
          <Link href="/family" className={styles.chip}>{family.profile ? `${(family.profile as { avatar?: string }).avatar ?? "🌙"} ${family.profile.displayName}` : ar ? "👨‍👩‍👧 العائلة" : "👨‍👩‍👧 Family"}</Link>
          {actions}
        </nav>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
