"use client";

import { STORY_TEXT_COLORS, normalizeHex } from "@qam/core";

import styles from "./story.module.css";

/** Auto / preset swatches / any colour: `value` null means auto. */
export default function TextColorPicker({ value, autoLabel, onChange }: { value: string | null; autoLabel: string; onChange: (hex: string | null) => void }) {
  const custom = value && !STORY_TEXT_COLORS.some((c) => c.hex === value);
  return (
    <div className={styles.row} role="radiogroup">
      <button type="button" className={`${styles.opt} ${value === null ? styles.optOn : ""}`} onClick={() => onChange(null)} role="radio" aria-checked={value === null}>{autoLabel}</button>
      {STORY_TEXT_COLORS.map((c) => (
        <button key={c.id} type="button" className={`${styles.swatch} ${value === c.hex ? styles.swatchOn : ""}`} style={{ background: c.hex }} onClick={() => onChange(c.hex)} role="radio" aria-checked={value === c.hex} aria-label={c.id} />
      ))}
      <label className={`${styles.swatch} ${custom ? styles.swatchOn : ""}`} style={{ background: custom ? value! : "conic-gradient(#f44, #fa0, #ff4, #4f4, #4ff, #44f, #f4f, #f44)" }} aria-label="custom">
        <input type="color" value={value ?? "#ffffff"} onChange={(e) => onChange(normalizeHex(e.target.value))} style={{ opacity: 0, width: 0, height: 0, position: "absolute" }} />
      </label>
    </div>
  );
}
