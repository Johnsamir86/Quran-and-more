# Speed: what makes the story and the player feel slow, and where to host

Written 19 November 2026 for v14.

## Where the time goes today

| Step | Today | Why |
| --- | --- | --- |
| Opening the video studio from the phone | 2–5 s | The app opens a web page in an in-app browser: it downloads the studio bundle (≈ 600 kB), fonts, then calls the API for reciters, translations and the whole surah payload before anything renders. Netlify functions add a cold start of 0.5–2 s when nobody used the API for a while. |
| Audio for the ayah range | 1–3 s | One file per ayah from the Quran Foundation CDN. v14 fetches them all in parallel (they were sequential). |
| Rendering the MP4 | 3–8 s for 1–3 ayat at 1080p | Done in the phone's browser with WebCodecs; already several times faster than the clip length. 720p (Plus) is about twice as fast as 1080p. |
| Sharing the image | < 1 s | Captured natively on the phone. |
| Player word sync | now smooth | Web now updates the highlight every animation frame; mobile every 100 ms. The surah payload (text, words, timings, translation) is cached at the CDN for an hour and in memory for ten minutes. |

## What v14 changed
- Parallel audio downloads in the studio, in-memory memo of surah / reciter / translation requests on the web, 100 ms player status on mobile, animation-frame highlight on web.
- Nothing yet changes the hosting, which is the remaining ceiling.

## The hosting problem

Netlify (current) runs the API as serverless functions: cold starts, a 10 s limit per call, no
background jobs, no ffmpeg, and the account is on free credits that ran out on 15 November,
which blocked the deploy. Video rendering therefore happens on the user's phone, which is the
slowest device in the chain, and every studio open re-downloads the bundle.

## Recommendation (in order of effect per dollar)

1. **Move the API and the web app to a small always-on server** on Render, Fly.io or Hetzner
   (a 2 vCPU / 4 GB instance is enough for the current traffic, roughly $7–25 a month). No cold
   starts, long-running requests allowed, ffmpeg available. Keep the same Next.js app; it runs with
   `next start` behind the host's proxy. Render has a one-click Blueprint; Fly runs the Docker image.
2. **Put a CDN in front of audio and the API**: Cloudflare (free plan) in front of the server
   caches the surah payloads, timings and the ayah MP3 files close to the user in Kuwait and the
   Gulf. Bunny CDN is the alternative if Cloudflare's free plan is not wanted. The responses already
   send `Cache-Control: public, s-maxage=3600, stale-while-revalidate`.
3. **Render videos on the server, not on the phone**: a small worker (Node + ffmpeg, or the same
   WebCodecs renderer in headless Chromium) builds the MP4 once per `surah / range / reciter /
   background / style` key and stores it in object storage (Cloudflare R2 or Backblaze B2, both
   with free egress to Cloudflare). The phone then downloads a ready file in about one second, and
   repeated shares of the same ayah cost nothing. The renderer in `apps/web/src/lib/story-video.ts`
   already runs unchanged under headless Chromium, so this is a worker loop around the existing
   code, not a rewrite.
4. **Pre-render the popular ayat** (ayah of the day, the 50 most shared) every night so the first
   share of the day is instant.
5. **Mobile app**: bundle the studio's fonts and the six background clips in the app, open the
   studio with the payload the app already has (pass it in the URL or a local server) instead of
   calling the API again, and show the preview frame immediately while the MP4 is produced.

Expected result after 1–3: studio open under one second on a warm cache, video ready in one to
two seconds for a cached ayah and four to six seconds for a new one, independent of the phone.

## Suggested stack

| Piece | Service | Monthly |
| --- | --- | --- |
| Web + API | Render web service (Starter) or Fly.io shared-cpu-2x | $7–25 |
| Video worker | Render background worker with ffmpeg, or the same box | $7 |
| Object storage for MP4s and images | Cloudflare R2 (10 GB free, no egress fees) | $0–5 |
| CDN and DNS | Cloudflare free plan | $0 |
| Database and auth (when accounts ship) | Supabase free tier | $0 |

The Netlify site can stay as a redirect, or be dropped once the domain points at Cloudflare.
