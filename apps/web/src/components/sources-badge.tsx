"use client";

import { useState } from "react";

import { useI18n } from "@/lib/i18n";

import styles from "./sources-badge.module.css";

/** "Review pending" badge that opens the content and sources sheet. Honest by design: no scholar review has happened yet. */
export default function SourcesBadge({ compact }: { compact?: boolean }) {
  const { m, dir } = useI18n();
  const s = m.sources;
  const [open, setOpen] = useState(false);
  const rows = [["quranText", "quranTextSrc"], ["audio", "audioSrc"], ["translations", "translationsSrc"], ["prayer", "prayerSrc"], ["azan", "azanSrc"]] as const;
  return (
    <>
      <button type="button" className={`${styles.badge} ${compact ? styles.compact : ""}`} onClick={() => setOpen(true)} aria-haspopup="dialog">
        <span className={styles.dot} aria-hidden />{compact ? s.reviewPending : `${s.title} · ${s.reviewPending}`}
      </button>
      {open ? (
        <div className={styles.scrim} onClick={() => setOpen(false)} role="presentation">
          <div className={styles.sheet} role="dialog" aria-modal="true" aria-label={s.title} dir={dir} onClick={(e) => e.stopPropagation()}>
            <div className={styles.head}><strong>{s.title}</strong><span className={styles.pill}>{s.reviewPending}</span></div>
            <p className={styles.muted}>{s.reviewPendingHelp}</p>
            <dl className={styles.list}>{rows.map(([k, v]) => <div key={k}><dt>{s[k]}</dt><dd>{s[v]}</dd></div>)}</dl>
            <div className={styles.row}>
              <a className={styles.chip} href="mailto:hello@quranandmore.app?subject=Content%20report">{s.report}</a>
              <button type="button" className={styles.chip} onClick={() => setOpen(false)}>{m.common.close}</button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
