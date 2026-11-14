"use client";

import { NATURE_WALLPAPERS, wallpaperById } from "@qam/core";

/** Story editor: fonts, backgrounds, image rendering, sharing and voice effects for the ayah-of-the-day page. */

export type StoryFont = "naskh" | "amiri" | "scheherazade" | "kufi";
export const STORY_FONTS: Record<StoryFont, { label: string; family: string; css: string }> = {
  naskh: { label: "Naskh", family: '"Noto Naskh Arabic", "KFGQPC Uthmanic Script HAFS", serif', css: "Noto+Naskh+Arabic:wght@400;500;700" },
  amiri: { label: "Amiri", family: '"Amiri", serif', css: "Amiri:wght@400;700" },
  scheherazade: { label: "Scheherazade", family: '"Scheherazade New", serif', css: "Scheherazade+New:wght@400;700" },
  kufi: { label: "Kufi", family: '"Reem Kufi", sans-serif', css: "Reem+Kufi:wght@400;600" },
};

export const ensureStoryFonts = () => {
  if (typeof document === "undefined" || document.getElementById("story-fonts")) return;
  const link = document.createElement("link");
  link.id = "story-fonts"; link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?${Object.values(STORY_FONTS).map((f) => `family=${f.css}`).join("&")}&display=swap`;
  document.head.appendChild(link);
};

export type StoryBg = { kind: "nature"; id: string } | { kind: "solid"; id: string } | { kind: "photo"; dataUrl: string };
export type StoryEffect = "none" | "reverb" | "echo" | "slow";
export interface StoryPrefs { font: StoryFont; size: number; bg: StoryBg | null; dim: number; tone: "auto" | "light" | "dark"; reciter: string | null; effect: StoryEffect }
export const DEFAULT_STORY_PREFS: StoryPrefs = { font: "naskh", size: 1, bg: null, dim: 0.3, tone: "auto", reciter: null, effect: "none" };
const KEY = "qam.story.prefs.v1";

export const loadStoryPrefs = (): StoryPrefs => {
  try { const raw = window.localStorage.getItem(KEY); return raw ? { ...DEFAULT_STORY_PREFS, ...(JSON.parse(raw) as Partial<StoryPrefs>) } : DEFAULT_STORY_PREFS; } catch { return DEFAULT_STORY_PREFS; }
};
export const saveStoryPrefs = (p: StoryPrefs) => { try { window.localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* quota or private mode */ } };

/** Solid / gradient backgrounds drawn from the four themes. `tone` is the text colour that reads on them. */
export const SOLID_BACKGROUNDS: { id: string; colors: [string, string]; tone: "light" | "dark" }[] = [
  { id: "emerald", colors: ["#0f5a4a", "#14805f"], tone: "light" },
  { id: "navy", colors: ["#0b1020", "#192345"], tone: "light" },
  { id: "ink", colors: ["#15201b", "#2a3b33"], tone: "light" },
  { id: "terracotta", colors: ["#7a3a20", "#b4552f"], tone: "light" },
  { id: "parchment", colors: ["#f3eee1", "#e3d9c2"], tone: "dark" },
  { id: "sand", colors: ["#fbf4ec", "#f0dfcf"], tone: "dark" },
];

export interface ResolvedBg { url?: string; colors?: [string, string]; tone: "light" | "dark"; credit?: string }
export const resolveBg = (bg: StoryBg | null, fallbackNatureId: string): ResolvedBg => {
  if (!bg || bg.kind === "nature") {
    const w = wallpaperById(bg?.id ?? fallbackNatureId) ?? NATURE_WALLPAPERS[0];
    return { url: w.url, tone: w.tone === "dark" ? "dark" : "light", credit: w.credit };
  }
  if (bg.kind === "solid") { const s = SOLID_BACKGROUNDS.find((x) => x.id === bg.id) ?? SOLID_BACKGROUNDS[0]; return { colors: s.colors, tone: s.tone }; }
  return { url: bg.dataUrl, tone: "light" };
};

/** Shrink a chosen photo to ≤1600px JPEG so it fits in localStorage and renders fast. */
export const readPhotoFile = (file: File): Promise<string> => new Promise((resolve, reject) => {
  const img = new Image();
  const url = URL.createObjectURL(file);
  img.onload = () => {
    const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
    const c = document.createElement("canvas"); c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    URL.revokeObjectURL(url);
    resolve(c.toDataURL("image/jpeg", 0.82));
  };
  img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("image")); };
  img.src = url;
});

// ---- image rendering (1080 × 1920, the social story format) ----
const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => { const i = new Image(); if (!src.startsWith("data:")) i.crossOrigin = "anonymous"; i.onload = () => resolve(i); i.onerror = reject; i.src = src; });

const wrap = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
  const words = text.split(/\s+/).filter(Boolean); const lines: string[] = []; let line = "";
  for (const w of words) { const t = line ? `${line} ${w}` : w; if (ctx.measureText(t).width > maxWidth && line) { lines.push(line); line = w; } else line = t; }
  if (line) lines.push(line);
  return lines;
};

const MARK_PATHS = ["M512 338 C438 298 318 290 196 322 L196 706 C318 674 438 682 512 722 Z", "M512 338 C586 298 706 290 828 322 L828 706 C706 674 586 682 512 722 Z", "M512 338 L512 722", "M152 760 C300 826 724 826 872 760", "M262 528 L330 528 L360 456 L394 598 L428 486 L458 566 L486 528 L540 528 L570 464 L606 592 L638 500 L668 556 L698 528 L742 528"];

export interface RenderInput { arabic: string; translation: string | null; reference: string; surahName: string; font: StoryFont; size: number; bg: ResolvedBg; dim: number; tone: "light" | "dark"; brand: string; brandArabic: string }

export const renderStoryImage = async (input: RenderInput): Promise<Blob> => {
  const W = 1080, H = 1920;
  const canvas = document.createElement("canvas"); canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  // background
  if (input.bg.url) {
    try {
      const img = await loadImage(input.bg.url);
      const s = Math.max(W / img.width, H / img.height); const w = img.width * s, h = img.height * s;
      ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
    } catch { ctx.fillStyle = "#14805f"; ctx.fillRect(0, 0, W, H); }
  } else {
    const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, input.bg.colors?.[0] ?? "#0f5a4a"); g.addColorStop(1, input.bg.colors?.[1] ?? "#14805f"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  const light = input.tone === "light"; // light text
  const shade = light ? `rgba(0,0,0,${input.dim})` : `rgba(255,255,255,${input.dim})`;
  ctx.fillStyle = shade; ctx.fillRect(0, 0, W, H);
  const grad = ctx.createLinearGradient(0, 0, 0, H); grad.addColorStop(0, light ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.45)"); grad.addColorStop(0.3, "rgba(0,0,0,0)"); grad.addColorStop(0.7, "rgba(0,0,0,0)"); grad.addColorStop(1, light ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.6)"); ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
  const ink = light ? "#ffffff" : "#15201b"; const muted = light ? "rgba(255,255,255,0.85)" : "rgba(21,32,27,0.8)";
  const family = STORY_FONTS[input.font].family;
  let arSize = Math.round(64 * input.size);
  try { await document.fonts.load(`500 ${arSize}px ${family}`); await document.fonts.load(`400 34px "Plus Jakarta Sans"`); } catch { /* fallback faces */ }
  // kicker
  ctx.textAlign = "center"; ctx.textBaseline = "alphabetic"; ctx.direction = "ltr";
  ctx.fillStyle = muted; ctx.font = `600 30px "Plus Jakarta Sans", system-ui, sans-serif`;
  ctx.fillText(`${input.surahName.toUpperCase()}  ·  ${input.reference}`, W / 2, 230);
  // Arabic + translation block, shrunk until it fits between the kicker and the footer (long ayat such as 2:282).
  const TOP = 320, BOTTOM = 1660, trLH = 50;
  let arLines: string[] = [], trLines: string[] = [], arLH = 0, gap = 0, total = Infinity, trSize = 34;
  for (let attempt = 0; attempt < 12 && total > BOTTOM - TOP; attempt++) {
    ctx.direction = "rtl"; ctx.font = `500 ${arSize}px ${family}`;
    arLines = wrap(ctx, input.arabic, 920); arLH = arSize * 1.8;
    ctx.direction = "ltr"; ctx.font = `400 ${trSize}px "Plus Jakarta Sans", system-ui, sans-serif`;
    trLines = input.translation ? wrap(ctx, input.translation, 900) : [];
    const maxTr = Math.max(3, Math.floor((BOTTOM - TOP - arLines.length * arLH - 56) / trLH));
    if (trLines.length > maxTr) trLines = [...trLines.slice(0, Math.max(0, maxTr - 1)), `${trLines[Math.max(0, maxTr - 1)] ?? ""}…`];
    gap = trLines.length ? 56 : 0;
    total = arLines.length * arLH + gap + trLines.length * trLH;
    if (total > BOTTOM - TOP) { arSize = Math.max(30, Math.round(arSize * 0.9)); if (trSize > 28) trSize -= 2; if (arSize <= 30 && trLines.length <= 3) break; }
  }
  let y = Math.max(TOP, TOP + (BOTTOM - TOP - total) / 2);
  ctx.direction = "rtl"; ctx.font = `500 ${arSize}px ${family}`; ctx.fillStyle = ink;
  ctx.shadowColor = light ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.5)"; ctx.shadowBlur = 24;
  for (const l of arLines) { y += arLH; ctx.fillText(l, W / 2, y - arLH * 0.3); }
  ctx.shadowBlur = 0;
  ctx.direction = "ltr"; ctx.font = `400 ${trSize}px "Plus Jakarta Sans", system-ui, sans-serif`; ctx.fillStyle = muted;
  y += gap;
  for (const l of trLines) { y += trLH; ctx.fillText(l, W / 2, y); }
  // footer brand: mark + names
  const mx = W / 2 - 170, my = 1740, ms = 0.08;
  ctx.save(); ctx.translate(mx, my); ctx.scale(ms, ms); ctx.lineWidth = 44; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = ink;
  for (const d of MARK_PATHS) ctx.stroke(new Path2D(d)); ctx.fillStyle = "#d8ad5c"; ctx.beginPath(); ctx.arc(792, 528, 26, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  ctx.textAlign = "left"; ctx.fillStyle = ink; ctx.font = `700 34px "Plus Jakarta Sans", system-ui, sans-serif`; ctx.fillText(input.brand, mx + 100, my + 44);
  ctx.fillStyle = muted; ctx.font = `400 26px "Plus Jakarta Sans", system-ui, sans-serif`; ctx.fillText("quran-and-more.netlify.app", mx + 100, my + 80);
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b!), "image/png"));
};

// ---- sharing ----
export const shareLinks = (text: string, url: string) => {
  const t = encodeURIComponent(text), u = encodeURIComponent(url);
  return [
    { id: "whatsapp", label: "WhatsApp", href: `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}` },
    { id: "x", label: "X", href: `https://twitter.com/intent/tweet?text=${t}&url=${u}` },
    { id: "facebook", label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${u}&quote=${t}` },
    { id: "telegram", label: "Telegram", href: `https://t.me/share/url?url=${u}&text=${t}` },
  ];
};

export const canShareFiles = (): boolean => typeof navigator !== "undefined" && typeof navigator.canShare === "function" && navigator.canShare({ files: [new File(["x"], "x.png", { type: "image/png" })] });

export const shareImageFile = async (blob: Blob, title: string, text: string): Promise<boolean> => {
  const file = new File([blob], "ayah.png", { type: "image/png" });
  if (typeof navigator.share !== "function" || !navigator.canShare?.({ files: [file] })) return false;
  try { await navigator.share({ files: [file], title, text }); return true; } catch { return false; }
};

// ---- voice with effects (Web Audio) ----
export class StoryVoice {
  private el: HTMLAudioElement;
  private ctx: AudioContext | null = null;
  private source: MediaElementAudioSourceNode | null = null;
  private wet: AudioNode[] = [];
  onState: ((playing: boolean) => void) | null = null;
  constructor() { this.el = new Audio(); this.el.crossOrigin = "anonymous"; this.el.preload = "auto"; this.el.onended = () => this.onState?.(false); this.el.onpause = () => this.onState?.(false); this.el.onplay = () => this.onState?.(true); }
  private impulse(ctx: AudioContext, seconds: number, decay: number) {
    const len = Math.floor(ctx.sampleRate * seconds); const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = buf.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay); }
    return buf;
  }
  private graph(effect: StoryEffect) {
    if (effect === "none" || effect === "slow") { if (this.ctx && this.source) { this.source.disconnect(); for (const n of this.wet) n.disconnect(); this.wet = []; this.source.connect(this.ctx.destination); } return; }
    if (!this.ctx) { try { this.ctx = new AudioContext(); this.source = this.ctx.createMediaElementSource(this.el); } catch { this.ctx = null; return; } }
    const ctx = this.ctx!, src = this.source!;
    src.disconnect(); for (const n of this.wet) n.disconnect(); this.wet = [];
    const dry = ctx.createGain(); dry.gain.value = 0.85; src.connect(dry); dry.connect(ctx.destination); this.wet.push(dry);
    if (effect === "reverb") { const conv = ctx.createConvolver(); conv.buffer = this.impulse(ctx, 2.8, 2.2); const g = ctx.createGain(); g.gain.value = 0.55; src.connect(conv); conv.connect(g); g.connect(ctx.destination); this.wet.push(conv, g); }
    if (effect === "echo") { const delay = ctx.createDelay(1); delay.delayTime.value = 0.34; const fb = ctx.createGain(); fb.gain.value = 0.38; const g = ctx.createGain(); g.gain.value = 0.5; src.connect(delay); delay.connect(fb); fb.connect(delay); delay.connect(g); g.connect(ctx.destination); this.wet.push(delay, fb, g); }
  }
  async play(url: string, effect: StoryEffect) {
    if (this.el.src !== url) this.el.src = url;
    this.el.playbackRate = effect === "slow" ? 0.85 : 1;
    this.graph(effect);
    await this.ctx?.resume().catch(() => undefined);
    this.el.currentTime = 0;
    await this.el.play();
  }
  stop() { this.el.pause(); }
  get playing() { return !this.el.paused; }
}
