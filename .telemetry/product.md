# Product: Quran and More

**Last updated:** 2026-11-14
**Method:** codebase scan + conversation

## Product Identity
- **One-liner:** A family opens one app to listen to the Quran with the words lighting up as they are recited, read the printed mushaf page, understand an ayah through translations and tafsir, memorise and play, and get the azan for their city; each family member has their own profile and progress.
- **Category:** consumer religious education and media (Quran reader, audio player, learning)
- **Product type:** B2C (family-shared device accounts; no organisations)
- **Collaboration:** hybrid: single-player use, shared family profiles on one account, future madrasah classes

## Business Model
- **Monetization:** paid app (one-time purchase, $4.99 USD tier) plus one in-app subscription "Offline Audio" ($1.99/month or $14.99/year) that unlocks offline surah downloads and the archive reciters beyond the core catalogue. Quran text, recitation, mushaf, translations, tafsir, azan and story are included in the purchase price. Web is free (marketing + same content) with the subscription not applicable.
- **Pricing tiers:** App ($4.99) · Offline Audio monthly ($1.99) · Offline Audio yearly ($14.99)
- **Billing integration:** App Store / Google Play through RevenueCat (planned; env-gated in code), no Stripe on web

## Tech Stack
- **Primary language:** TypeScript
- **Framework:** Next.js 15 (web, Netlify) and Expo SDK 58 / React Native 0.88 with expo-router (iOS, Android); shared `packages/core`
- **Database:** none of our own yet; Quran Foundation / Quran.com APIs for content, Netlify Blobs for push subscriptions, device storage (localStorage / AsyncStorage) for family state; Supabase planned for accounts and sync
- **Background jobs:** Netlify scheduled function `azan-tick` (every 5 minutes); forced-alignment batch offline in `tools/align`
- **HTTP client patterns:** `fetch` (web routes and mobile `lib/api.ts`), `@quranjs/api` SDK server-side
- **Module organization:** npm workspaces + Turborepo; `apps/web`, `apps/mobile`, `packages/core`

## Value Mapping

### Primary Value Action
**Listening to or reading an ayah** (player playback or mushaf page view) — the moment the family actually engages with the Quran. If this drops to zero, the product has failed.

### Core Features (directly deliver value)
1. **Player** — gapless recitation with word highlighting, any reciter, translation and tafsir beside the ayah
2. **Mushaf** — printed page layouts with official fonts, tap-to-listen
3. **Study** — word by word, translations, tafsir compare, surah info
4. **Azan and prayer times** — daily return trigger: prayer times per country method, azan voice, notifications
5. **Ayah of the day story** — daily reflective moment, opened from the azan notification
6. **Learn / Hifz / Play** — vocabulary lessons, memorisation with spaced review, games

### Supporting Features (enable core actions)
1. **Family profiles** — per-member settings, bookmarks, notes, progress, kids/senior UI modes
2. **Search** — finding an ayah or surah to listen to or study
3. **Ask (Quran AI, restricted)** — retrieval over ayat and tafsir; supports study
4. **Settings: language (66), theme (4), notifications** — comfort and retention
5. **Accounts and sync (planned)** — Apple / Google / email / Quran.com sign-in via Supabase to keep family state across devices
6. **Offline Audio (subscription)** — downloads and archive reciters; monetisation of the listening habit

## Entity Model

### Users
- **ID format:** device-local family record (`qam.family.v1`) with profile UUIDs today; Supabase `auth.users` UUID once accounts ship
- **Roles:** parent, adult, child, senior, teacher (profile roles inside one family)
- **Multi-account:** no (one account per family; several profiles)

### Accounts
- **ID format:** family id (UUID) inside the family record; maps to one Supabase user when sign-in exists
- **Hierarchy:** flat (family → profiles)

## Group Hierarchy

```
Family (account)
└── Profile (person)
```

| Group Type | Parent | Where Actions Happen |
|------------|--------|---------------------|
| Family | — | purchases, subscription, sign-in, azan location |
| Profile | Family | listening, reading, study, lessons, hifz, games, notes, bookmarks |

**Default event level:** Profile
**Admin actions at:** Family (parent profile)

## Current State
- **Existing tracking:** none (no analytics SDK in web or mobile)
- **Documentation:** partial (README, docs/ARCHITECTURE.md, docs/ROADMAP.md)
- **Known issues:** no funnel visibility for first listen, azan opt-in, story opens, lesson completion, purchase conversion

## Integration Targets
| Destination | Purpose | Priority |
|-------------|---------|----------|
| PostHog (proposed; self-serve, EU hosting available, works in Expo and Next.js) | product analytics, funnels, retention | high |
| RevenueCat events (planned) | purchase and subscription lifecycle | high |
| Netlify request logs | server health only | low |

No destination has been chosen yet; PostHog is the recommendation because it covers web and React Native with one SDK and respects the no-ads, privacy-first positioning (no third-party ad identifiers).

## Codebase Observations
- **Feature areas inferred:** `/player`, `/mushaf`, `/family`, `/search`, `/study/[verseKey]`, `/learn`, `/hifz`, `/play`, `/ask`, `/azan`, `/story`, `/v/[verseKey]`, public API v1 under `/api/public/v1`; the same screens exist in `apps/mobile/src/app`
- **Entity model inferred:** `packages/core/src/profiles.ts` (Profile, ProfileSettings, UiMode), `family-store.ts` (bookmarks, notes, progress, learn XP, game scores), `azan.ts` (AzanSettings), `subscriptions.ts` (tiers scaffold)
