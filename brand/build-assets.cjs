/**
 * Renders every logo/icon asset from brand/logo/mark.svg with headless Chromium.
 * Run: node brand/build-assets.cjs   (from the repo root; uses the preinstalled Playwright Chromium)
 */
const { chromium } = require("playwright");
const { mkdirSync, readFileSync, writeFileSync, copyFileSync } = require("node:fs");
const { resolve } = require("node:path");

const root = resolve(__dirname, "..");
(async () => {
const mark = readFileSync(resolve(root, "brand/logo/mark.svg"), "utf8");
const out = resolve(root, "brand/out");
mkdirSync(out, { recursive: true });

const GREEN = "#14805f", GOLD = "#d8ad5c", CREAM = "#f6f3ea", INK = "#15201b";
const svgData = (color, dot = GOLD) => `data:image/svg+xml;utf8,${encodeURIComponent(mark.replace("currentColor", color).replace("var(--dot, #d8ad5c)", dot))}`;

const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&family=Noto+Naskh+Arabic:wght@500;700&display=block" rel="stylesheet">`;

const page = await (await chromium.launch()).newPage();
async function render(name, html, width, height, { transparent = false, scale = 1 } = {}) {
  await page.setViewportSize({ width, height });
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8">${FONTS}<style>html,body{margin:0;width:${width}px;height:${height}px;background:${transparent ? "transparent" : "white"};overflow:hidden}*{box-sizing:border-box}</style></head><body>${html}</body></html>`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(150);
  const path = resolve(out, name);
  await page.screenshot({ path, omitBackground: transparent, type: "png", scale: scale === 1 ? "css" : "device" });
  return path;
}

// 1. Icon tiles (iOS full-bleed, web, favicon): green tile, white mark, gold dot.
const tile = (size, pad = 0.14) => `<div style="width:${size}px;height:${size}px;background:${GREEN};display:grid;place-items:center"><img src="${svgData("#ffffff")}" style="width:${Math.round(size * (1 - pad * 2))}px;height:${Math.round(size * (1 - pad * 2))}px"></div>`;
await render("icon-1024.png", tile(1024), 1024, 1024);
await render("icon-512.png", tile(512), 512, 512);
await render("icon-192.png", tile(192), 192, 192);
await render("icon-180.png", tile(180), 180, 180);
await render("favicon-48.png", tile(48, 0.1), 48, 48);
await render("favicon-32.png", tile(32, 0.08), 32, 32);

// 2. Android adaptive: foreground mark inside the 66% safe zone on transparent, solid background, monochrome.
const fg = (size, color) => `<div style="width:${size}px;height:${size}px;display:grid;place-items:center"><img src="${svgData(color, color === "#ffffff" ? GOLD : color)}" style="width:${Math.round(size * 0.5)}px;height:${Math.round(size * 0.5)}px"></div>`;
await render("android-icon-foreground.png", fg(1024, "#ffffff"), 1024, 1024, { transparent: true });
await render("android-icon-monochrome.png", fg(1024, "#ffffff").replace(GOLD, "#ffffff"), 1024, 1024, { transparent: true });
await render("android-icon-background.png", `<div style="width:1024px;height:1024px;background:${GREEN}"></div>`, 1024, 1024);

// 3. Splash: white mark on transparent (splash background colour is the brand green in app.json).
await render("splash-icon.png", `<div style="width:512px;height:512px;display:grid;place-items:center"><img src="${svgData("#ffffff")}" style="width:400px;height:400px"></div>`, 512, 512, { transparent: true });
await render("badge-96.png", `<div style="width:96px;height:96px;display:grid;place-items:center"><img src="${svgData("#ffffff", "#ffffff")}" style="width:88px;height:88px"></div>`, 96, 96, { transparent: true });

// 4. Lockups (for the brand book, stores and web): horizontal and stacked, on cream and on green.
const lockup = (bg, fgColor, arColor, w, h, stacked) => `
<div style="width:${w}px;height:${h}px;background:${bg};display:flex;${stacked ? "flex-direction:column;" : ""}align-items:center;justify-content:center;gap:${stacked ? 28 : 40}px;font-family:'Plus Jakarta Sans',sans-serif;color:${fgColor}">
  <div style="width:${stacked ? 300 : 260}px;height:${stacked ? 300 : 260}px;background:${bg === GREEN ? "transparent" : GREEN};border-radius:${stacked ? 68 : 58}px;display:grid;place-items:center"><img src="${svgData("#ffffff")}" style="width:${stacked ? 230 : 200}px;height:${stacked ? 230 : 200}px"></div>
  <div style="display:flex;flex-direction:column;align-items:${stacked ? "center" : "flex-start"};gap:6px;line-height:1">
    <div style="font-size:${stacked ? 108 : 112}px;font-weight:800;letter-spacing:-0.02em">Quran and More</div>
    <div style="font-family:'Noto Naskh Arabic',serif;font-size:${stacked ? 84 : 88}px;font-weight:700;color:${arColor};direction:rtl">القرآن وأكثر</div>
  </div>
</div>`;
await render("lockup-horizontal-cream.png", lockup(CREAM, INK, GREEN, 2000, 560, false), 2000, 560);
await render("lockup-horizontal-green.png", lockup(GREEN, "#ffffff", GOLD, 2000, 560, false), 2000, 560);
await render("lockup-stacked-cream.png", lockup(CREAM, INK, GREEN, 1400, 1000, true), 1400, 1000);
await render("lockup-stacked-green.png", lockup(GREEN, "#ffffff", GOLD, 1400, 1000, true), 1400, 1000);

// 5. Open Graph default image.
await render("og-default.png", `
<div style="width:1200px;height:630px;background:linear-gradient(135deg,#0f5a4a,#14805f 55%,#3dba91);display:flex;align-items:center;padding:0 96px;gap:64px;font-family:'Plus Jakarta Sans',sans-serif;color:#fff">
  <div style="width:280px;height:280px;background:rgba(255,255,255,0.12);border:2px solid rgba(255,255,255,0.25);border-radius:64px;display:grid;place-items:center"><img src="${svgData("#ffffff")}" style="width:220px;height:220px"></div>
  <div style="display:flex;flex-direction:column;gap:14px">
    <div style="font-size:92px;font-weight:800;letter-spacing:-0.02em;line-height:1">Quran and More</div>
    <div style="font-family:'Noto Naskh Arabic',serif;font-size:64px;font-weight:700;color:${GOLD};direction:rtl;line-height:1.2">القرآن وأكثر</div>
    <div style="font-size:30px;opacity:0.9;max-width:720px;line-height:1.3">Listen, read, learn and pray. One Quran app for the whole family.</div>
  </div>
</div>`, 1200, 630);

// 6. Copy into the apps.
const cp = (from, to) => copyFileSync(resolve(out, from), resolve(root, to));
cp("icon-1024.png", "apps/mobile/assets/images/icon.png");
cp("android-icon-foreground.png", "apps/mobile/assets/images/android-icon-foreground.png");
cp("android-icon-background.png", "apps/mobile/assets/images/android-icon-background.png");
cp("android-icon-monochrome.png", "apps/mobile/assets/images/android-icon-monochrome.png");
cp("splash-icon.png", "apps/mobile/assets/images/splash-icon.png");
cp("favicon-48.png", "apps/mobile/assets/images/favicon.png");
cp("icon-192.png", "apps/web/public/icon-192.png");
cp("icon-512.png", "apps/web/public/icon-512.png");
cp("icon-180.png", "apps/web/public/apple-touch-icon.png");
cp("badge-96.png", "apps/web/public/badge-96.png");
cp("og-default.png", "apps/web/public/og-default.png");
cp("icon-32.png".replace("icon-32", "favicon-32"), "apps/web/src/app/icon.png");
writeFileSync(resolve(root, "apps/mobile/assets/expo.icon/Assets/mark.svg"), mark.replace("currentColor", "#ffffff").replace("var(--dot, #d8ad5c)", GOLD));
console.log("assets written to brand/out and copied into the apps");
process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
