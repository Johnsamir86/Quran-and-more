"use client";

import { useEffect, useRef } from "react";

import type { Wallpaper } from "@qam/core";

import styles from "./player.module.css";

interface Props { wallpaper: Wallpaper; playing: boolean; motion: boolean; progress: number }

/** Eight-point star tiling (classic Islamic geometric pattern) as an SVG pattern. */
const ArtPattern = ({ colors, variant, motion }: { colors: [string, string, string]; variant: string; motion: boolean }) => {
  const [bg, fg, accent] = colors;
  const size = 120;
  const star = (cx: number, cy: number, r: number) => {
    const pts: string[] = [];
    for (let i = 0; i < 16; i += 1) {
      const a = (Math.PI / 8) * i - Math.PI / 2;
      const rr = i % 2 === 0 ? r : r * 0.62;
      pts.push(`${(cx + rr * Math.cos(a)).toFixed(2)},${(cy + rr * Math.sin(a)).toFixed(2)}`);
    }
    return pts.join(" ");
  };
  const hex = (cx: number, cy: number, r: number) => Array.from({ length: 6 }, (_, i) => { const a = (Math.PI / 3) * i; return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`; }).join(" ");
  const isHex = variant.includes("hex");
  const isLattice = variant.includes("lattice");
  return (
    <svg className={`${styles.wpArt} ${motion ? styles.wpArtMotion : ""}`} xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <pattern id={`pat-${variant}`} width={size} height={size} patternUnits="userSpaceOnUse">
          <rect width={size} height={size} fill={bg} />
          {isHex ? (
            <>
              <polygon points={hex(size / 2, size / 2, size * 0.46)} fill="none" stroke={fg} strokeWidth={2} />
              <polygon points={hex(size / 2, size / 2, size * 0.26)} fill="none" stroke={accent} strokeWidth={1.5} />
              <polygon points={hex(0, 0, size * 0.46)} fill="none" stroke={fg} strokeWidth={2} />
              <polygon points={hex(size, size, size * 0.46)} fill="none" stroke={fg} strokeWidth={2} />
              <polygon points={hex(0, size, size * 0.46)} fill="none" stroke={fg} strokeWidth={2} />
              <polygon points={hex(size, 0, size * 0.46)} fill="none" stroke={fg} strokeWidth={2} />
            </>
          ) : isLattice ? (
            <>
              <path d={`M0 ${size / 2} L${size / 2} 0 L${size} ${size / 2} L${size / 2} ${size} Z`} fill="none" stroke={fg} strokeWidth={2} />
              <circle cx={size / 2} cy={size / 2} r={size * 0.12} fill="none" stroke={accent} strokeWidth={2} />
              <path d={`M0 0 L${size} ${size} M${size} 0 L0 ${size}`} stroke={fg} strokeWidth={0.8} opacity={0.5} />
            </>
          ) : (
            <>
              <polygon points={star(size / 2, size / 2, size * 0.44)} fill="none" stroke={fg} strokeWidth={2.2} />
              <polygon points={star(size / 2, size / 2, size * 0.22)} fill={accent} opacity={0.35} />
              <polygon points={star(0, 0, size * 0.44)} fill="none" stroke={fg} strokeWidth={2.2} />
              <polygon points={star(size, 0, size * 0.44)} fill="none" stroke={fg} strokeWidth={2.2} />
              <polygon points={star(0, size, size * 0.44)} fill="none" stroke={fg} strokeWidth={2.2} />
              <polygon points={star(size, size, size * 0.44)} fill="none" stroke={fg} strokeWidth={2.2} />
              <circle cx={size / 2} cy={size / 2} r={3} fill={accent} />
            </>
          )}
        </pattern>
        <radialGradient id={`vig-${variant}`} cx="50%" cy="50%" r="75%">
          <stop offset="60%" stopColor="rgba(0,0,0,0)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.55)" />
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill={`url(#pat-${variant})`} />
      <rect width="100%" height="100%" fill={`url(#vig-${variant})`} />
    </svg>
  );
};

/** Canvas animations that respond to playback (speed and glow) and respect the motion setting. */
const LiveCanvas = ({ wallpaper, playing, motion, progress }: Props) => {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef({ playing, motion, progress });
  stateRef.current = { playing, motion, progress };
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const [c0, c1, c2] = wallpaper.colors ?? ["#000", "#1d9e75", "#fff"];
    let raf = 0; let t = 0;
    const stars = Array.from({ length: 160 }, () => ({ x: Math.random(), y: Math.random(), r: Math.random() * 1.6 + 0.3, p: Math.random() * Math.PI * 2 }));
    const resize = () => { const dpr = Math.min(2, window.devicePixelRatio || 1); canvas.width = canvas.clientWidth * dpr; canvas.height = canvas.clientHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    resize();
    const ro = new ResizeObserver(resize); ro.observe(canvas);
    const draw = () => {
      const { playing: isPlaying, motion: isMotion } = stateRef.current;
      const w = canvas.clientWidth, h = canvas.clientHeight;
      const speed = isMotion ? (isPlaying ? 1 : 0.35) : 0;
      t += 0.004 * speed;
      ctx.fillStyle = c0; ctx.fillRect(0, 0, w, h);
      if (wallpaper.id === "l-stars") {
        for (const s of stars) {
          const tw = 0.55 + 0.45 * Math.sin(t * 6 + s.p);
          ctx.globalAlpha = tw; ctx.fillStyle = c1; ctx.beginPath(); ctx.arc(s.x * w, s.y * h, s.r * (isPlaying ? 1.3 : 1), 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
        const g = ctx.createRadialGradient(w / 2, h * 0.75, 0, w / 2, h * 0.75, h * 0.9); g.addColorStop(0, `${c2}22`); g.addColorStop(1, "transparent"); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      } else if (wallpaper.id === "l-waves" || wallpaper.id === "l-aurora") {
        const bands = wallpaper.id === "l-aurora" ? 5 : 4;
        for (let b = 0; b < bands; b += 1) {
          ctx.beginPath();
          const base = h * (0.35 + b * 0.13);
          ctx.moveTo(0, h);
          for (let x = 0; x <= w; x += 8) {
            const y = base + Math.sin(x * 0.006 + t * (3 + b) + b) * (18 + b * 9) + Math.sin(x * 0.013 - t * 2) * 8;
            ctx.lineTo(x, y);
          }
          ctx.lineTo(w, h); ctx.closePath();
          const g = ctx.createLinearGradient(0, base - 60, 0, h); g.addColorStop(0, `${b % 2 ? c2 : c1}${wallpaper.id === "l-aurora" ? "55" : "66"}`); g.addColorStop(1, "transparent");
          ctx.fillStyle = g; ctx.fill();
        }
      } else {
        // dawn: gradient that slowly shifts, brightening while playing
        const k = 0.5 + 0.5 * Math.sin(t * 2);
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, c0); g.addColorStop(0.55 + 0.1 * k, c1); g.addColorStop(1, c2);
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
        ctx.globalAlpha = 0.25 + 0.2 * k; ctx.fillStyle = c2; ctx.beginPath(); ctx.arc(w * 0.7, h * (0.62 - 0.06 * k), h * 0.09, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [wallpaper]);
  return <canvas ref={ref} className={styles.wpCanvas} aria-hidden />;
};

export default function WallpaperLayer(props: Props) {
  const { wallpaper, motion } = props;
  if (wallpaper.kind === "nature" && wallpaper.url) {
    return (
      <div className={styles.wpLayer} aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img key={wallpaper.id} src={wallpaper.url} alt="" className={`${styles.wpImage} ${motion ? styles.wpKenBurns : ""}`} />
        <div className={styles.wpShade} />
      </div>
    );
  }
  if (wallpaper.kind === "art" && wallpaper.colors) {
    return <div className={styles.wpLayer} aria-hidden><ArtPattern colors={wallpaper.colors} variant={wallpaper.id} motion={motion} /></div>;
  }
  if (wallpaper.kind === "live") {
    return <div className={styles.wpLayer} aria-hidden><LiveCanvas {...props} /></div>;
  }
  const [a, b] = wallpaper.colors ?? ["#f6f3ea", "#fffdf7"];
  return <div className={styles.wpLayer} aria-hidden style={{ background: `linear-gradient(160deg, ${a}, ${b})` }} />;
}
