"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, type ReactNode } from "react";

import { useFamily } from "@/components/family/family-provider";
import LanguageSelect from "@/components/language-select";
import { useI18n, useUiLocale } from "@/lib/i18n";

import styles from "./study.module.css";

export { useUiLocale };

export const useToday = () => useMemo(() => new Date().toISOString().slice(0, 10), []);

const NAV: { href: string; key: "search" | "learn" | "hifz" | "play" | "ask" | "azan" | "player" | "mushaf"; icon: string }[] = [
  { href: "/search", key: "search", icon: "🔎" },
  { href: "/learn", key: "learn", icon: "🎓" },
  { href: "/hifz", key: "hifz", icon: "🧠" },
  { href: "/play", key: "play", icon: "🎮" },
  { href: "/ask", key: "ask", icon: "💬" },
  { href: "/azan", key: "azan", icon: "🕌" },
  { href: "/player", key: "player", icon: "▶" },
  { href: "/mushaf", key: "mushaf", icon: "📖" },
];

export default function StudyShell({ title, children, actions }: { title?: string; children: ReactNode; actions?: ReactNode }) {
  const pathname = usePathname() ?? "/";
  const { m, dir } = useI18n();
  const family = useFamily();
  return (
    <div className={styles.root} dir={dir}>
      <header className={styles.top}>
        <Link href="/" className={styles.brand}>{m.common.appName}{title ? <span className={styles.muted}> · {title}</span> : null}</Link>
        <nav className={styles.nav}>
          {NAV.map((n) => <Link key={n.href} href={n.href} className={`${styles.chip} ${pathname.startsWith(n.href) ? styles.chipActive : ""}`}>{n.icon} <span>{m.nav[n.key]}</span></Link>)}
          <Link href="/family" className={styles.chip}>{family.profile ? `${(family.profile as { avatar?: string }).avatar ?? "🌙"} ${family.profile.displayName}` : `👨‍👩‍👧 ${m.nav.family}`}</Link>
          <LanguageSelect className={styles.select} />
          {actions}
        </nav>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
