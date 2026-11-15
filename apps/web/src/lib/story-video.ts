"use client";

import { ArrayBufferTarget, Muxer } from "mp4-muxer";

import { STORY_FONTS, type ResolvedBg, type StoryFont } from "./story-tools";

/**
 * Renders an ayah story as a vertical video (1080 × 1920): the chosen background
 * (moving clip, photo or colour), the recitation, each word lit as it is recited,
 * the translation and the brand. Encoding uses WebCodecs + mp4-muxer (H.264 + AAC,
 * plays everywhere) and falls back to MediaRecorder (WebM, or MP4 on Safari).
 * Frames are produced in real time so moving backgrounds stay in sync; a 20 s
 * story takes about 20 s to render.
 */

export interface VideoPage {
  verseKey: string;
  arabic: string;
  words: { position: number; text: string }[];
  translation: string | null;
  audioUrl: string;
  /** [position, fromMs, toMs] relative to the ayah's own audio file. */
  wordTimings: [number, number, number][];
}

export interface VideoInput {
  pages: VideoPage[];
  bg: ResolvedBg;
  font: StoryFont;
  size: number;
  tone: "light" | "dark";
  dim: number;
  surahName: string;
  reciterName: string;
  brand: string;
  highlightWords: boolean;
  /** 1080p or 720p output. */
  quality: "high" | "medium";
  onProgress?: (fraction: number, stage: "audio" | "render" | "encode") => void;
  signal?: AbortSignal;
}

export interface VideoResult { blob: Blob; mime: string; ext: "mp4" | "webm"; durationMs: number; engine: "webcodecs" | "recorder" }

const GAP_MS = 700, INTRO_MS = 900, OUTRO_MS = 1500, FPS = 30, LEAD_MS = 90;

export const canRenderVideo = (): boolean => typeof document !== "undefined" && (typeof (window as unknown as { VideoEncoder?: unknown }).VideoEncoder === "function" || typeof (window as unknown as { MediaRecorder?: unknown }).MediaRecorder === "function");

const hasWebCodecs = () => typeof (window as unknown as { VideoEncoder?: unknown }).VideoEncoder === "function" && typeof (window as unknown as { AudioEncoder?: unknown }).AudioEncoder === "function";

const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => { const i = new Image(); if (!src.startsWith("data:")) i.crossOrigin = "anonymous"; i.onload = () => resolve(i); i.onerror = reject; i.src = src; });

/** Safari (iOS in particular) does not fire canplaythrough for a muted inline clip until it plays, so start it and settle on the first decoded frame; give up after 8 s and fall back to the poster. */
const loadVideo = (src: string) => new Promise<HTMLVideoElement>((resolve, reject) => {
  const v = document.createElement("video");
  v.crossOrigin = "anonymous"; v.muted = true; v.loop = true; v.playsInline = true; v.preload = "auto"; v.setAttribute("playsinline", ""); v.setAttribute("muted", ""); v.src = src;
  let done = false; const ok = () => { if (!done && v.readyState >= 2) { done = true; resolve(v); } };
  const fail = () => { if (!done) { done = true; reject(new Error("video")); } };
  v.onloadeddata = ok; v.oncanplay = ok; v.oncanplaythrough = ok; v.onplaying = ok; v.onerror = fail;
  const timer = window.setTimeout(fail, 8000);
  v.load(); v.play().then(ok).catch(() => undefined);
  const clear = () => window.clearTimeout(timer); v.addEventListener("loadeddata", clear, { once: true }); v.addEventListener("error", clear, { once: true });
});

const fetchAudio = async (ctx: BaseAudioContext, url: string, signal?: AbortSignal): Promise<AudioBuffer> => {
  const res = await fetch(url, { signal }); if (!res.ok) throw new Error(`audio ${res.status}`);
  return ctx.decodeAudioData(await res.arrayBuffer());
};

/** Lay out words right-to-left into lines that fit `maxWidth`; returns per-word x (right edge) and line index. */
interface Laid { position: number; text: string; line: number; x: number; width: number }
const layoutWords = (ctx: CanvasRenderingContext2D, words: { position: number; text: string }[], maxWidth: number, centerX: number): { laid: Laid[]; lines: number } => {
  const space = ctx.measureText(" ").width;
  const rows: { items: { position: number; text: string; width: number }[]; width: number }[] = [];
  let cur = { items: [] as { position: number; text: string; width: number }[], width: 0 };
  for (const w of words) {
    const width = ctx.measureText(w.text).width;
    const add = cur.items.length ? width + space : width;
    if (cur.width + add > maxWidth && cur.items.length) { rows.push(cur); cur = { items: [], width: 0 }; }
    cur.items.push({ ...w, width }); cur.width += cur.items.length === 1 ? width : width + space;
  }
  if (cur.items.length) rows.push(cur);
  const laid: Laid[] = [];
  rows.forEach((row, line) => {
    let x = centerX + row.width / 2; // right edge of the line
    for (const it of row.items) { laid.push({ position: it.position, text: it.text, line, x, width: it.width }); x -= it.width + space; }
  });
  return { laid, lines: rows.length };
};

const wrapLtr = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
  const words = text.split(/\s+/).filter(Boolean); const lines: string[] = []; let line = "";
  for (const w of words) { const t = line ? `${line} ${w}` : w; if (ctx.measureText(t).width > maxWidth && line) { lines.push(line); line = w; } else line = t; }
  if (line) lines.push(line);
  return lines;
};

const MARK_PATHS = ["M512 338 C438 298 318 290 196 322 L196 706 C318 674 438 682 512 722 Z", "M512 338 C586 298 706 290 828 322 L828 706 C706 674 586 682 512 722 Z", "M512 338 L512 722", "M152 760 C300 826 724 826 872 760"];

export const renderStoryVideo = async (input: VideoInput): Promise<VideoResult> => {
  const W = input.quality === "high" ? 1080 : 720, H = input.quality === "high" ? 1920 : 1280, S = W / 1080;
  const { onProgress, signal } = input;
  const throwIfAborted = () => { if (signal?.aborted) throw new DOMException("aborted", "AbortError"); };

  // 1. audio: decode every ayah, lay them on one timeline. The context is created before the first await so
  // Safari keeps the user activation (otherwise the recorder path records silence).
  const probe = new AudioContext();
  await probe.resume().catch(() => undefined);
  const buffers: AudioBuffer[] = [];
  for (let i = 0; i < input.pages.length; i++) { buffers.push(await fetchAudio(probe, input.pages[i].audioUrl, signal)); onProgress?.((i + 1) / input.pages.length, "audio"); }
  // Word timings derived from the full-surah recording can sit a little off the per-ayah cut; align the
  // first word to the audible onset of each file (bounded to ±600 ms).
  const timings: [number, number, number][][] = input.pages.map((p, i) => {
    if (!p.wordTimings.length) return [];
    const b = buffers[i]; const ch = b.getChannelData(0); const step = Math.max(1, Math.floor(b.sampleRate / 1000));
    let onset = 0; for (let k = 0; k < ch.length; k += step) { if (Math.abs(ch[k]) > 0.02) { onset = (k / b.sampleRate) * 1000; break; } }
    const first = Math.min(...p.wordTimings.map(([, f]) => f));
    const shift = Math.max(-600, Math.min(600, onset - first));
    return p.wordTimings.map(([pos, f, t]) => [pos, f + shift, t + shift] as [number, number, number]);
  });
  const sampleRate = 48000;
  const starts: number[] = []; let cursor = INTRO_MS;
  for (const b of buffers) { starts.push(cursor); cursor += b.duration * 1000 + GAP_MS; }
  const totalMs = cursor - GAP_MS + OUTRO_MS;
  const offline = new OfflineAudioContext(2, Math.ceil((totalMs / 1000) * sampleRate), sampleRate);
  buffers.forEach((b, i) => { const src = offline.createBufferSource(); src.buffer = b; src.connect(offline.destination); src.start(starts[i] / 1000); });
  const mixed = await offline.startRendering();
  throwIfAborted();

  // 2. visuals
  const canvas = document.createElement("canvas"); canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d", { alpha: false })!;
  const family = STORY_FONTS[input.font].family;
  const arSize = Math.round(58 * input.size * S);
  try { await document.fonts.load(`500 ${arSize}px ${family}`); await document.fonts.load(`400 ${Math.round(32 * S)}px "Plus Jakarta Sans"`); } catch { /* fallback faces */ }
  let bgImage: HTMLImageElement | null = null, bgVideo: HTMLVideoElement | null = null;
  if (input.bg.video) { try { bgVideo = await loadVideo(input.bg.video); } catch { bgVideo = null; } }
  if (!bgVideo && input.bg.url) { try { bgImage = await loadImage(input.bg.url); } catch { bgImage = null; } }
  const light = input.tone === "light";
  const ink = light ? "#ffffff" : "#15201b", muted = light ? "rgba(255,255,255,0.85)" : "rgba(21,32,27,0.8)", accent = "#d8ad5c";

  // Pre-layout each page (Arabic words + translation lines), shrinking when an ayah is long.
  const maxW = W - 160 * S;
  const layouts = input.pages.map((p) => {
    let size = arSize, laid: Laid[] = [], lines = 0, tr: string[] = [], trSize = Math.round(32 * S);
    for (let attempt = 0; attempt < 10; attempt++) {
      ctx.font = `500 ${size}px ${family}`; ctx.direction = "rtl";
      ({ laid, lines } = layoutWords(ctx, p.words.length ? p.words : p.arabic.split(/\s+/).map((t, i) => ({ position: i + 1, text: t })), maxW, W / 2));
      ctx.font = `400 ${trSize}px "Plus Jakarta Sans", system-ui, sans-serif`; ctx.direction = "ltr";
      tr = p.translation ? wrapLtr(ctx, p.translation, W - 180 * S) : [];
      const h = lines * size * 1.85 + (tr.length ? 50 * S : 0) + Math.min(tr.length, 6) * trSize * 1.5;
      if (h < H * 0.62) break;
      size = Math.max(Math.round(26 * S), Math.round(size * 0.88)); if (trSize > 24 * S) trSize -= 2;
    }
    if (tr.length > 6) tr = [...tr.slice(0, 5), `${tr[5]}…`];
    return { size, laid, lines, tr, trSize };
  });

  const drawFrame = (tMs: number) => {
    // background
    if (bgVideo) { const s = Math.max(W / bgVideo.videoWidth, H / bgVideo.videoHeight); const w = bgVideo.videoWidth * s, h = bgVideo.videoHeight * s; ctx.drawImage(bgVideo, (W - w) / 2, (H - h) / 2, w, h); }
    else if (bgImage) { const s = Math.max(W / bgImage.width, H / bgImage.height); const w = bgImage.width * s, h = bgImage.height * s; ctx.drawImage(bgImage, (W - w) / 2, (H - h) / 2, w, h); }
    else { const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, input.bg.colors?.[0] ?? "#0f5a4a"); g.addColorStop(1, input.bg.colors?.[1] ?? "#14805f"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
    ctx.fillStyle = light ? `rgba(0,0,0,${input.dim})` : `rgba(255,255,255,${input.dim})`; ctx.fillRect(0, 0, W, H);
    const grad = ctx.createLinearGradient(0, 0, 0, H); grad.addColorStop(0, light ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.5)"); grad.addColorStop(0.28, "rgba(0,0,0,0)"); grad.addColorStop(0.7, "rgba(0,0,0,0)"); grad.addColorStop(1, light ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.6)");
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
    // which page
    let idx = input.pages.length - 1;
    for (let i = 0; i < starts.length; i++) if (tMs < starts[i] + buffers[i].duration * 1000 + GAP_MS / 2) { idx = i; break; }
    if (tMs < starts[0]) idx = 0;
    const page = input.pages[idx], lay = layouts[idx];
    const local = tMs - starts[idx];
    const fadeIn = Math.min(1, Math.max(0, (tMs - (starts[idx] - GAP_MS / 2)) / 350));
    // progress bars
    const barW = (W - 48 * S - (input.pages.length - 1) * 6 * S) / input.pages.length;
    input.pages.forEach((_, i) => {
      const x = 24 * S + i * (barW + 6 * S);
      ctx.fillStyle = light ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.25)"; ctx.fillRect(x, 60 * S, barW, 4 * S);
      const f = i < idx ? 1 : i > idx ? 0 : Math.min(1, Math.max(0, local / (buffers[idx].duration * 1000)));
      ctx.fillStyle = ink; ctx.fillRect(x, 60 * S, barW * f, 4 * S);
    });
    // kicker
    ctx.textAlign = "center"; ctx.textBaseline = "alphabetic"; ctx.direction = "ltr";
    ctx.fillStyle = muted; ctx.font = `600 ${Math.round(28 * S)}px "Plus Jakarta Sans", system-ui, sans-serif`;
    ctx.fillText(`${input.surahName.toUpperCase()}  ·  ${page.verseKey}`, W / 2, 160 * S);
    // Arabic words
    ctx.globalAlpha = fadeIn;
    const lineH = lay.size * 1.85;
    const blockH = lay.lines * lineH + (lay.tr.length ? 50 * S + lay.tr.length * lay.trSize * 1.5 : 0);
    const top = Math.max(260 * S, (H - blockH) / 2 - 40 * S);
    ctx.font = `500 ${lay.size}px ${family}`; ctx.direction = "rtl"; ctx.textAlign = "right";
    ctx.shadowColor = light ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.5)"; ctx.shadowBlur = 22 * S;
    const wt = timings[idx];
    const activePos = input.highlightWords ? wt.find(([, from, to]) => local + LEAD_MS >= from && local + LEAD_MS < to)?.[0] ?? null : null;
    const donePos = input.highlightWords && activePos === null && local > 0 ? Math.max(0, ...wt.filter(([, , to]) => local + LEAD_MS >= to).map(([p]) => p)) : 0;
    for (const w of lay.laid) {
      const y = top + (w.line + 1) * lineH - lineH * 0.35;
      const isActive = activePos === w.position;
      if (isActive) { ctx.save(); ctx.shadowBlur = 0; ctx.fillStyle = light ? "rgba(216,173,92,0.28)" : "rgba(29,158,117,0.22)"; const pad = 10 * S; ctx.beginPath(); ctx.roundRect(w.x - w.width - pad, y - lay.size * 0.95, w.width + pad * 2, lay.size * 1.35, 14 * S); ctx.fill(); ctx.restore(); }
      ctx.fillStyle = isActive ? accent : input.highlightWords && (w.position < (activePos ?? Infinity) || (activePos === null && w.position <= donePos)) ? ink : input.highlightWords && local > 0 ? (light ? "rgba(255,255,255,0.72)" : "rgba(21,32,27,0.6)") : ink;
      ctx.fillText(w.text, w.x, y);
    }
    ctx.shadowBlur = 0;
    // translation
    ctx.direction = "ltr"; ctx.textAlign = "center"; ctx.fillStyle = muted; ctx.font = `400 ${lay.trSize}px "Plus Jakarta Sans", system-ui, sans-serif`;
    let y = top + lay.lines * lineH + 50 * S;
    for (const l of lay.tr) { y += lay.trSize * 1.5; ctx.fillText(l, W / 2, y); }
    ctx.globalAlpha = 1;
    // footer: reciter + brand
    ctx.fillStyle = muted; ctx.font = `500 ${Math.round(26 * S)}px "Plus Jakarta Sans", system-ui, sans-serif`; ctx.textAlign = "center";
    ctx.fillText(input.reciterName, W / 2, H - 230 * S);
    const mx = W / 2 - 150 * S, my = H - 190 * S, ms = 0.075 * S;
    ctx.save(); ctx.translate(mx, my); ctx.scale(ms, ms); ctx.lineWidth = 44; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = ink;
    for (const d of MARK_PATHS) ctx.stroke(new Path2D(d)); ctx.fillStyle = accent; ctx.beginPath(); ctx.arc(792, 528, 26, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    ctx.textAlign = "left"; ctx.fillStyle = ink; ctx.font = `700 ${Math.round(32 * S)}px "Plus Jakarta Sans", system-ui, sans-serif`; ctx.fillText(input.brand, mx + 92 * S, my + 40 * S);
    ctx.fillStyle = muted; ctx.font = `400 ${Math.round(24 * S)}px "Plus Jakarta Sans", system-ui, sans-serif`; ctx.fillText("quran-and-more.netlify.app", mx + 92 * S, my + 74 * S);
  };

  if (bgVideo) {
    bgVideo.currentTime = 0;
    const started = await bgVideo.play().then(() => true).catch(() => false);
    if (!started && input.bg.url) { try { bgImage = await loadImage(input.bg.url); } catch { bgImage = null; } bgVideo = null; }
  }
  const frames = Math.ceil((totalMs / 1000) * FPS);

  // H.264 + AAC through WebCodecs when the browser can encode them (Chrome, Edge, Android Chrome, recent Safari);
  // otherwise MediaRecorder below (WebM on Chromium builds without H.264, MP4 on Safari).
  let vConfig: VideoEncoderConfig | null = null;
  if (hasWebCodecs()) {
    for (const codec of W >= 1080 ? ["avc1.640028", "avc1.4d0028", "avc1.42002a"] : ["avc1.4d001f", "avc1.42001f"]) {
      const cfg: VideoEncoderConfig = { codec, width: W, height: H, bitrate: W >= 1080 ? 9_000_000 : 5_000_000, framerate: FPS, latencyMode: "quality", avc: { format: "avc" } } as VideoEncoderConfig;
      try { if ((await VideoEncoder.isConfigSupported(cfg)).supported) { vConfig = cfg; break; } } catch { /* try next */ }
    }
  }
  // AAC where the platform has an encoder (Android, macOS, Windows, iOS); Opus otherwise (Linux Chromium).
  let audioCodec: "aac" | "opus" | null = null;
  if (vConfig) {
    for (const [name, codec] of [["aac", "mp4a.40.2"], ["opus", "opus"]] as const) {
      try { if ((await AudioEncoder.isConfigSupported({ codec, numberOfChannels: 2, sampleRate, bitrate: 160_000 })).supported) { audioCodec = name; break; } } catch { /* try next */ }
    }
    if (!audioCodec) vConfig = null;
  }
  if (vConfig && audioCodec) try {
    const muxer = new Muxer({ target: new ArrayBufferTarget(), video: { codec: "avc", width: W, height: H }, audio: { codec: audioCodec, numberOfChannels: 2, sampleRate }, fastStart: "in-memory" });
    const videoEncoder = new VideoEncoder({ output: (chunk, meta) => muxer.addVideoChunk(chunk, meta), error: (e) => { throw e; } });
    videoEncoder.configure(vConfig);
    const audioEncoder = new AudioEncoder({ output: (chunk, meta) => muxer.addAudioChunk(chunk, meta), error: (e) => { throw e; } });
    audioEncoder.configure({ codec: audioCodec === "aac" ? "mp4a.40.2" : "opus", numberOfChannels: 2, sampleRate, bitrate: 160_000 });
    // audio: feed in 1 s slices
    const chunk = sampleRate;
    for (let off = 0; off < mixed.length; off += chunk) {
      const n = Math.min(chunk, mixed.length - off);
      const data = new Float32Array(n * 2);
      for (let c = 0; c < 2; c++) data.set(mixed.getChannelData(c).subarray(off, off + n), c * n);
      audioEncoder.encode(new AudioData({ format: "f32-planar", sampleRate, numberOfFrames: n, numberOfChannels: 2, timestamp: Math.round((off / sampleRate) * 1_000_000), data }));
    }
    // video frames in real time, clocked so moving backgrounds progress naturally
    const t0 = performance.now();
    for (let i = 0; i < frames; i++) {
      throwIfAborted();
      const tMs = (i / FPS) * 1000;
      const wait = t0 + tMs - performance.now(); if (wait > 0) await new Promise((r) => setTimeout(r, wait));
      drawFrame(tMs);
      const frame = new VideoFrame(canvas, { timestamp: Math.round(tMs * 1000), duration: Math.round(1_000_000 / FPS) });
      videoEncoder.encode(frame, { keyFrame: i % (FPS * 2) === 0 });
      frame.close();
      if (videoEncoder.encodeQueueSize > 8) await new Promise((r) => setTimeout(r, 8));
      onProgress?.(i / frames, "render");
    }
    onProgress?.(1, "encode");
    await videoEncoder.flush(); await audioEncoder.flush(); videoEncoder.close(); audioEncoder.close();
    muxer.finalize();
    bgVideo?.pause();
    const buf = (muxer.target as ArrayBufferTarget).buffer;
    await probe.close().catch(() => undefined);
    return { blob: new Blob([buf], { type: "video/mp4" }), mime: "video/mp4", ext: "mp4", durationMs: totalMs, engine: "webcodecs" };
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") throw e;
    // Encoder failed mid-way (seen on some Safari builds): record instead.
  }

  // Fallback: MediaRecorder with live audio playback through the same (activated) context
  const live = probe;
  const dest = live.createMediaStreamDestination();
  const src = live.createBufferSource(); src.buffer = mixed; src.connect(dest);
  const stream = canvas.captureStream(FPS);
  for (const tr of dest.stream.getAudioTracks()) stream.addTrack(tr);
  const mime = ["video/mp4;codecs=avc1,mp4a.40.2", "video/mp4", "video/webm;codecs=vp9,opus", "video/webm"].find((m) => MediaRecorder.isTypeSupported(m)) ?? "";
  const rec = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: 8_000_000 } : undefined);
  const parts: Blob[] = []; rec.ondataavailable = (e) => { if (e.data.size) parts.push(e.data); };
  const done = new Promise<void>((resolve) => { rec.onstop = () => resolve(); });
  drawFrame(0); rec.start(250); await live.resume(); src.start();
  const t0 = performance.now();
  for (let i = 0; i < frames; i++) {
    throwIfAborted();
    const tMs = (i / FPS) * 1000;
    const wait = t0 + tMs - performance.now(); if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    drawFrame(tMs); onProgress?.(i / frames, "render");
  }
  rec.stop(); await done; src.disconnect(); await live.close().catch(() => undefined); bgVideo?.pause();
  const isMp4 = (rec.mimeType || mime).includes("mp4");
  return { blob: new Blob(parts, { type: isMp4 ? "video/mp4" : "video/webm" }), mime: isMp4 ? "video/mp4" : "video/webm", ext: isMp4 ? "mp4" : "webm", durationMs: totalMs, engine: "recorder" };
};

export const canShareVideo = (ext: "mp4" | "webm"): boolean => typeof navigator !== "undefined" && typeof navigator.canShare === "function" && navigator.canShare({ files: [new File(["x"], `x.${ext}`, { type: ext === "mp4" ? "video/mp4" : "video/webm" })] });

export const shareVideoFile = async (result: VideoResult, name: string, title: string, text: string): Promise<boolean> => {
  const file = new File([result.blob], `${name}.${result.ext}`, { type: result.mime });
  if (typeof navigator.share !== "function" || !navigator.canShare?.({ files: [file] })) return false;
  try { await navigator.share({ files: [file], title, text }); return true; } catch { return false; }
};
