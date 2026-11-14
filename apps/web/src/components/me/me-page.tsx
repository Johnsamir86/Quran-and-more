"use client";

import Link from "next/link";

import { useFamily } from "@/components/family/family-provider";
import LanguageSelect from "@/components/language-select";
import SourcesBadge from "@/components/sources-badge";
import ThemePicker from "@/components/theme-picker";
import { useI18n } from "@/lib/i18n";

import StudyShell from "../study/study-shell";
import shell from "../study/study.module.css";

/** Web counterpart of the mobile Me tab: profile, appearance, language, notifications, account, sources. */
export default function MePage() {
  const { m } = useI18n();
  const t = m.settings;
  const { profile, state } = useFamily();
  return (
    <StudyShell title={t.me}>
      <section className={shell.card}>
        <div className={shell.kicker}>{t.profile}</div>
        <h2 className={shell.h2}>{profile ? `${profile.avatar ?? ""} ${profile.displayName}`.trim() : m.common.noProfile}</h2>
        <div className={shell.row}><Link href="/family" className={shell.chip}>👨‍👩‍👧 {m.nav.family} · {state.profiles.length}</Link><Link href="/family" className={shell.chip}>{t.switchProfile}</Link></div>
      </section>
      <section className={shell.card}>
        <div className={shell.kicker}>{t.appearance}</div>
        <p className={shell.muted}>{t.themeHelp}</p>
        <ThemePicker />
      </section>
      <section className={shell.card}>
        <div className={shell.kicker}>{t.language}</div>
        <LanguageSelect />
      </section>
      <section className={shell.card}>
        <div className={shell.kicker}>{t.notifications}</div>
        <p className={shell.muted}>{m.azan.notificationsHelp}</p>
        <div className={shell.row}><Link href="/azan" className={shell.btn}>🕌 {t.notifAzan}</Link></div>
      </section>
      <section className={shell.card}>
        <div className={shell.kicker}>{t.account}</div>
        <p className={shell.muted}>{t.signInHelp}</p>
        <div className={shell.row}>
          <Link href="/settings" className={shell.chip}>{t.signInQuran}</Link>
          <span className={shell.pill}>{t.guest}</span>
        </div>
      </section>
      <section className={shell.card}>
        <div className={shell.kicker}>{t.about}</div>
        <div className={shell.row}>
          <SourcesBadge />
          <Link href="/privacy" className={shell.chip}>{t.privacy}</Link>
          <Link href="/terms" className={shell.chip}>{t.terms}</Link>
          <a href="/android.apk" className={shell.chip}>Android APK</a>
        </div>
      </section>
    </StudyShell>
  );
}
