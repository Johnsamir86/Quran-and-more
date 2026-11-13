# Architecture

## Runtime topology

```
            ┌──────────────────────────┐
            │  Quran Foundation APIs   │  content, user data, QuranReflect, OAuth2
            └────────────┬─────────────┘
                         │ client credentials (server) / PKCE (user)
┌────────────────────────┴─────────────────────────┐
│  apps/web  (Next.js on Netlify)                  │
│  - pages: reader, study, library, family, plans  │
│  - /api/*          app backend (session cookie)  │
│  - /api/public/v1  integrations (API keys)       │
│  - Postgres (Neon) via packages/db               │
│  - AI gateway (restricted mode)                  │
└───────┬───────────────────────┬──────────────────┘
        │ HTTPS JSON            │ HTTPS JSON + webhooks
┌───────┴────────┐      ┌───────┴────────┐
│ apps/mobile    │      │ 3rd parties    │  e.g. VOD platforms
│ iOS, Android,  │      │ (API key)      │
│ Android TV,    │      └────────────────┘
│ Apple TV       │
└────────────────┘
```

## Identity

- Parent signs in with Quran Foundation OAuth (Authorization Code + PKCE).
  The `sub` claim is the stable key. Our `accounts` row references it.
- A family has one owner account and up to N profiles. Child, senior and
  teacher-view profiles have no QF account; their progress lives in our
  database. Adults may link their own QF account to a profile so their
  bookmarks sync with Quran.com.
- Madrasahs are organisations with teachers (accounts) and classes.
  A child profile is enrolled into a class with an invite code; the parent
  then sees assignments, grades and marked mistakes.

## Content

- All Quran text, translations, tafsir, audio come from the Content API with
  granular scopes. Responses are cached at the edge (public API) and in
  memory (token).
- Mushaf page rendering uses `code_v2` glyphs and word line numbers so pages
  match the printed Madani mushaf. Tajweed layout uses `text_uthmani_tajweed`.
- Offline: text, translations and fonts are bundled per mushaf layout. Audio
  streams from the Quran Foundation CDN.

## AI gateway (restricted mode)

- Provider adapters (Anthropic, OpenAI, Google, others) behind one
  interface; the user picks the model.
- Every job records `restrictedMode`, the provider and the verbatim check.
- Visual generation never receives the ayah as something to edit; the ayah
  is composited from the official text after generation and verified with
  `assertVerbatimQuran`.
- Q&A retrieves only from scholar-reviewed sources (tafsir list, Answers,
  verified QuranReflect authors) and must cite.

## Speech (memorisation)

- Phase one: Arabic speech recognition for word alignment, hidden-word
  tests and mistake marking. No tajweed grading claims.
- Phase two: dedicated tajweed model.

## Payments

- Web: Stripe Checkout and Customer Portal.
- iOS and Android: RevenueCat, mapping store products to the same tier ids.
- `subscriptions` holds the source of truth; feature gates read the tier.

## Study layer (web + mobile)

- `lib/search-api.ts`: Quran Foundation Search API (client credentials, scope
  `search`) with verse hydration; open v4 search as fallback.
- `lib/study-api.ts`: one-ayah bundle (words, translations, tafsir list, surah
  info, hadith / answers / reflections via `qfGet`), lesson sources, random
  ayat for games and the ayah of the day.
- `lib/ask-api.ts`: retrieval over search + tafsir; optional Claude call with
  a verbatim guard that strips any Arabic quotation not found in the sources.
- `packages/core`: `text.ts` (normalisation, recitation comparison, seeded
  RNG), `learn.ts` (lesson builder, levels), `games.ts` (rounds, scoring);
  learning XP and game scores live in the family store per profile.
- Routes: `/search`, `/study/[verseKey]`, `/learn`, `/hifz`, `/play`, `/ask`,
  `/v/[verseKey]` (share landing with `/api/og/[verseKey]` preview image).
- Mobile (`apps/mobile/src/app`): `search`, `study/[verseKey]`, `learn`,
  `play`, `hifz`, `ask` call the same public routes through
  `lib/study-api.ts`; `lib/ui.tsx` holds the shared palette and widgets.
  Lesson XP and game scores go through the same family reducer; hifz cards
  use the same `qam.hifz.v1` shape in AsyncStorage.

## Azan and story

- `packages/core/prayer-times.ts`: the PrayTimes-style solar algorithm with
  Aladhan's method table (angles / minute offsets), ISO country → method and
  Asr school, high-latitude rules; returns absolute instants so any time zone
  and DST work. Tested against api.aladhan.com reference days.
- `packages/core/azan.ts`: muezzin list (Islamic Network CDN, bundling and
  streaming permitted per their forum), `AzanSettings` + normaliser, the
  curated ayah-of-the-day pool.
- Web: `/azan` (`components/azan`), `/story` (`components/story`),
  `lib/azan-client.ts` (localStorage settings, Open-Meteo geocoding,
  BigDataCloud reverse geocoding, web push subscribe). Server:
  `lib/azan-push.ts` keeps subscriptions in Netlify Blobs (store `azan`),
  generates the VAPID pair + cron secret on first use into
  `config:azan` (env `VAPID_*` / `CRON_SECRET` override), and `tick()`
  announces prayers that fell in the last 12 minutes. `netlify/functions/
  azan-tick.mts` runs every 5 minutes and calls `/api/azan/tick`.
  `public/sw.js` shows the notification and opens `/story?prayer=…&azan=1`,
  which plays the chosen azan.
- Mobile: `lib/azan.ts` (AsyncStorage settings, expo-location with on-device
  reverse geocoding, expo-notifications: Android channel `azan` with the
  bundled 28 s `assets/sounds/azan.wav`, one scheduled local notification per
  prayer for the next 3 days, refreshed on every launch); `azan.tsx`,
  `story.tsx`; `_layout.tsx` opens the story when a notification is tapped.
- i18n: `packages/core/i18n` (English base, per-language overlays merged by
  `getMessages`), `registry.ts` lists the dictionaries.

## Public API v1

- `GET /api/public/v1/chapters` and `GET /api/public/v1/verses/:chapterId`
  are open (content only).
- Family, progress and plan endpoints require `X-Api-Key`. Keys are hashed,
  scoped and rate limited. Webhooks sign payloads with the key's secret.
