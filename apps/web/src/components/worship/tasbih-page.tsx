"use client";

import { useEffect, useRef, useState } from "react";

import { AFTER_PRAYER_SEQUENCE, TASBIH_PRESETS, TASBIH_STORAGE_KEY, tasbihTap, type TasbihState } from "@qam/core";

import { useI18n } from "@/lib/i18n";

import StudyShell from "../study/study-shell";
import shell from "../study/study.module.css";
import styles from "./worship.module.css";
import { useLocal } from "./use-local";

export default function TasbihPage() {
  const { m, locale, num } = useI18n();
  const t = m.worship.tasbih;
  const [s, setS] = useLocal<TasbihState>(TASBIH_STORAGE_KEY, () => ({ presetId: "subhanallah", count: 0, rounds: 0, total: 0, updatedAt: 0 }));
  const [vibrate, setVibrate] = useLocal<boolean>("qam.tasbih.vibrate", () => true);
  const [sequence, setSequence] = useLocal<boolean>("qam.tasbih.sequence", () => false);
  const [custom, setCustom] = useLocal<number>("qam.tasbih.custom", () => 100);
  const [flash, setFlash] = useState(false);
  const wake = useRef<{ release: () => Promise<void> } | null>(null);
  const preset = TASBIH_PRESETS.find((p) => p.id === s.presetId) ?? TASBIH_PRESETS[0];
  const target = s.presetId === "custom" ? custom : preset.target;

  useEffect(() => {
    const nav = navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> } };
    nav.wakeLock?.request("screen").then((l) => { wake.current = l; }).catch(() => undefined);
    return () => { void wake.current?.release(); };
  }, []);

  const tap = () => {
    setS((prev) => {
      const next = tasbihTap(prev, target);
      const rolled = next.rounds > prev.rounds;
      if (vibrate && navigator.vibrate) navigator.vibrate(rolled ? [40, 60, 40] : 12);
      if (rolled) {
        setFlash(true); setTimeout(() => setFlash(false), 600);
        if (sequence) { const i = AFTER_PRAYER_SEQUENCE.indexOf(prev.presetId as (typeof AFTER_PRAYER_SEQUENCE)[number]); if (i >= 0 && i < AFTER_PRAYER_SEQUENCE.length - 1) return { ...next, presetId: AFTER_PRAYER_SEQUENCE[i + 1] }; }
      }
      return next;
    });
  };
  const choose = (id: string) => setS((prev) => ({ ...prev, presetId: id, count: 0 }));
  const reset = () => setS((prev) => ({ ...prev, count: 0, rounds: 0, total: 0, updatedAt: Date.now() }));
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.code === "Space" || e.code === "Enter") { e.preventDefault(); tap(); } };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, vibrate, sequence]);

  return (
    <StudyShell title={t.title}>
      <div className={shell.card}>
        <div className={styles.tabs}>
          {TASBIH_PRESETS.map((p) => <button key={p.id} type="button" className={`${shell.chip} ${p.id === s.presetId ? shell.chipActive : ""}`} onClick={() => choose(p.id)} lang="ar">{p.ar}</button>)}
          <button type="button" className={`${shell.chip} ${s.presetId === "custom" ? shell.chipActive : ""}`} onClick={() => choose("custom")}>{t.custom}</button>
        </div>
        {s.presetId === "custom" ? (
          <label className={shell.row}>{t.target} <input className={shell.select} type="number" min={1} max={10000} value={custom} onChange={(e) => setCustom(Math.max(1, Number(e.target.value) || 1))} /></label>
        ) : (
          <div>
            <p className={styles.arabic} lang="ar" dir="rtl" style={{ textAlign: "center" }}>{preset.ar}</p>
            {locale !== "ar" ? <p className={shell.muted} style={{ textAlign: "center" }}>{preset.tr} · {preset.en}</p> : null}
          </div>
        )}
        <button type="button" className={styles.tasbihBtn} onClick={tap} style={{ borderColor: flash ? "var(--ok, #16a34a)" : undefined }} aria-label={t.tap}>
          <span className={styles.tasbihCount}>{num(s.count)}</span>
          <span style={{ opacity: 0.85 }}>/ {num(target)}</span>
          <span style={{ fontSize: "0.8em", opacity: 0.8 }}>{t.tap}</span>
        </button>
        <div className={shell.row} style={{ justifyContent: "center", gap: 24 }}>
          <span><span className={shell.kicker}>{t.rounds}</span><br /><b className={styles.bigNum} style={{ fontSize: "1.6em" }}>{num(s.rounds)}</b></span>
          <span><span className={shell.kicker}>{t.total}</span><br /><b className={styles.bigNum} style={{ fontSize: "1.6em" }}>{num(s.total)}</b></span>
        </div>
        <div className={shell.row} style={{ justifyContent: "center" }}>
          <label className={shell.chip}><input type="checkbox" checked={vibrate} onChange={(e) => setVibrate(e.target.checked)} /> {t.vibrate}</label>
          <label className={shell.chip}><input type="checkbox" checked={sequence} onChange={(e) => { setSequence(e.target.checked); if (e.target.checked) choose("subhanallah"); }} /> {t.afterPrayer}</label>
          <button type="button" className={shell.btnGhost} onClick={reset}>{t.reset}</button>
        </div>
      </div>
    </StudyShell>
  );
}
