"use client";

import { THEMES, THEME_IDS } from "@qam/core";

import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";

import styles from "./theme-picker.module.css";

/** Four brand looks as swatch cards plus light / dark / system. */
export default function ThemePicker({ compact }: { compact?: boolean }) {
  const { themeId, pref, scheme, setTheme, setSchemePreference } = useTheme();
  const { m, ar } = useI18n();
  const t = m.settings;
  if (compact) {
    return (
      <select className={styles.select} value={themeId} onChange={(e) => setTheme(e.target.value as typeof themeId)} aria-label={t.theme}>
        {THEME_IDS.map((id) => <option key={id} value={id}>{ar ? THEMES[id].name.ar : THEMES[id].name.en}</option>)}
      </select>
    );
  }
  return (
    <div className={styles.root}>
      <div className={styles.grid} role="radiogroup" aria-label={t.theme}>
        {THEME_IDS.map((id) => {
          const k = THEMES[id][scheme];
          const active = id === themeId;
          return (
            <button key={id} type="button" role="radio" aria-checked={active} className={`${styles.card} ${active ? styles.active : ""}`} style={{ background: k.bg, color: k.ink, borderColor: active ? k.accent : k.line }} onClick={() => setTheme(id)}>
              <span className={styles.bar} style={{ background: k.card, borderColor: k.line }}>
                <span className={styles.dot} style={{ background: k.accent }} />
                <span className={styles.dotSm} style={{ background: k.accent2 }} />
                <span className={styles.rule} style={{ background: k.line }} />
              </span>
              <span className={styles.name}>{ar ? THEMES[id].name.ar : THEMES[id].name.en}{active ? " ✓" : ""}</span>
              <span className={styles.tag} style={{ color: k.muted }}>{ar ? THEMES[id].tagline.ar : THEMES[id].tagline.en}</span>
            </button>
          );
        })}
      </div>
      <div className={styles.row}>
        {(["system", "light", "dark"] as const).map((p) => <button key={p} type="button" className={`${styles.chip} ${pref === p ? styles.chipActive : ""}`} onClick={() => setSchemePreference(p)}>{p === "system" ? t.schemeSystem : p === "light" ? t.schemeLight : t.schemeDark}</button>)}
      </div>
    </div>
  );
}
