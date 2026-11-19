"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { compassPoint, distanceToKaabaKm, qiblaBearing, qiblaOffset } from "@qam/core";

import { loadAzanSettings, detectLocation, saveAzanSettings } from "@/lib/azan-client";
import { useI18n } from "@/lib/i18n";

import StudyShell from "../study/study-shell";
import shell from "../study/study.module.css";
import styles from "./worship.module.css";

type Orientation = DeviceOrientationEvent & { webkitCompassHeading?: number; webkitCompassAccuracy?: number };

export default function QiblaPage() {
  const { m, num } = useI18n();
  const t = m.worship.qibla;
  const [pos, setPos] = useState<{ latitude: number; longitude: number; city?: string } | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [compass, setCompass] = useState<"idle" | "on" | "denied" | "none">("idle");
  const [status, setStatus] = useState<string | null>(null);
  const smooth = useRef<number | null>(null);

  useEffect(() => {
    const s = loadAzanSettings();
    if (s.latitude && s.longitude) setPos({ latitude: s.latitude, longitude: s.longitude, city: s.city });
  }, []);

  const locate = useCallback(async () => {
    setStatus(t.locating);
    const loc = await detectLocation().catch(() => null);
    if (!loc) { setStatus(t.needLocation); return; }
    setPos({ latitude: loc.latitude, longitude: loc.longitude, city: loc.city });
    saveAzanSettings({ ...loadAzanSettings(), ...loc });
    setStatus(null);
  }, [t.locating, t.needLocation]);

  const onOrient = useCallback((e: Event) => {
    const ev = e as Orientation;
    let h: number | null = null;
    if (typeof ev.webkitCompassHeading === "number") { h = ev.webkitCompassHeading; if (typeof ev.webkitCompassAccuracy === "number") setAccuracy(ev.webkitCompassAccuracy); }
    else if (ev.absolute && typeof ev.alpha === "number") h = (360 - ev.alpha) % 360;
    else if (typeof ev.alpha === "number") h = (360 - ev.alpha) % 360;
    if (h == null) return;
    // Low-pass filter across the 0/360 seam so the dial does not jitter.
    const prev = smooth.current;
    if (prev == null) smooth.current = h;
    else { const d = ((h - prev + 540) % 360) - 180; smooth.current = (prev + d * 0.25 + 360) % 360; }
    setHeading(smooth.current);
  }, []);

  const startCompass = useCallback(async () => {
    const DOE = window.DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<"granted" | "denied"> } | undefined;
    if (!DOE) { setCompass("none"); return; }
    try {
      if (typeof DOE.requestPermission === "function") { const r = await DOE.requestPermission(); if (r !== "granted") { setCompass("denied"); return; } }
      const evName = "ondeviceorientationabsolute" in window ? "deviceorientationabsolute" : "deviceorientation";
      window.addEventListener(evName, onOrient, true);
      setCompass("on");
      setTimeout(() => { if (smooth.current == null) setCompass((c) => (c === "on" ? "none" : c)); }, 2500);
    } catch { setCompass("denied"); }
  }, [onOrient]);
  useEffect(() => () => { window.removeEventListener("deviceorientation", onOrient, true); window.removeEventListener("deviceorientationabsolute", onOrient, true); }, [onOrient]);

  const bearing = useMemo(() => (pos ? qiblaBearing(pos.latitude, pos.longitude) : null), [pos]);
  const km = useMemo(() => (pos ? distanceToKaabaKm(pos.latitude, pos.longitude) : null), [pos]);
  const offset = bearing != null && heading != null ? qiblaOffset(heading, bearing) : null;
  const aligned = offset != null && Math.abs(offset) <= 3;
  const dialRotation = heading != null ? -heading : 0; // rotate the dial so north stays north
  const needleRotation = bearing != null ? bearing : 0; // needle is drawn inside the dial, pointing at the bearing

  return (
    <StudyShell title={t.title}>
      <div className={shell.card}>
        {!pos ? (
          <>
            <p className={shell.muted}>{t.needLocation}</p>
            <div className={shell.row}><button type="button" className={shell.btn} onClick={locate}>📍 {t.useLocation}</button></div>
          </>
        ) : (
          <>
            <div className={styles.compassWrap}>
              <div className={`${styles.compass} ${aligned ? styles.aligned : ""}`} style={{ transform: `rotate(${dialRotation}deg)` }} aria-label={`${t.bearing} ${Math.round(bearing!)}°`}>
                {Array.from({ length: 36 }, (_, i) => <span key={i} className={styles.tick} style={{ transform: `translateX(-50%) rotate(${i * 10}deg)`, height: i % 9 === 0 ? 18 : 10, opacity: i % 3 === 0 ? 1 : 0.5 }} />)}
                {["N", "E", "S", "W"].map((c, i) => <span key={c} className={styles.cardinal} style={{ transform: `translateX(-50%) rotate(${i * 90}deg)`, color: c === "N" ? "var(--bad, #b91c1c)" : undefined }}>{c}</span>)}
                <div className={styles.needle} style={{ transform: `rotate(${needleRotation}deg)` }}>
                  <span className={styles.needleArm} /><span className={styles.kaaba} aria-hidden>🕋</span>
                </div>
                <span className={styles.center} />
              </div>
              <div className={styles.bigNum}>{num(Math.round(bearing!))}°</div>
              <p className={shell.muted}>{t.bearing} · {compassPoint(bearing!)} · {t.fromNorth}{pos.city ? ` · ${pos.city}` : ""}</p>
              {heading != null ? (
                <p className={shell.pill}>{aligned ? `✓ ${t.aligned}` : `${offset! > 0 ? t.turnRight : t.turnLeft} ${num(Math.abs(Math.round(offset!)))}°`}</p>
              ) : null}
            </div>
            <div className={shell.row} style={{ justifyContent: "space-between" }}>
              <span>{t.distance}: <b>{num(Math.round(km!))} {t.km}</b></span>
              <span className={shell.muted}>{t.heading}: {heading != null ? `${num(Math.round(heading))}°` : "—"}{accuracy != null ? ` · ${t.accuracy}: ${accuracy > 15 ? t.low : t.good}` : ""}</span>
            </div>
            <div className={shell.row}>
              {compass !== "on" ? <button type="button" className={shell.btn} onClick={startCompass}>🧭 {t.enableCompass}</button> : null}
              <button type="button" className={shell.btnGhost} onClick={locate}>📍 {t.useLocation}</button>
            </div>
            {compass === "denied" ? <p className={shell.muted}>{t.needCompass}</p> : null}
            {compass === "none" ? <p className={shell.muted}>{t.noCompass}</p> : null}
            {compass === "on" ? <p className={shell.muted}>{t.calibrate}</p> : null}
          </>
        )}
        {status ? <p className={shell.muted}>{status}</p> : null}
        <p className={shell.muted}>{t.note}</p>
      </div>
    </StudyShell>
  );
}
