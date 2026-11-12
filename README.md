# Quran and More

One Quran experience for the whole family, from children to grandparents, on
web, iOS, Android and TV. Built on the Quran Foundation APIs (the backend
behind Quran.com) so bookmarks, notes, goals and reflections sync with
Quran.com and every connected Quran app.

## Layout

```
apps/web        Next.js 15 app: reader, accounts (QF OAuth + PKCE), backend for
                mobile/TV, public API v1 for integrations. Deployed on Netlify.
apps/mobile     Expo (React Native) app: iOS, Android, Android/Google TV, Apple TV.
packages/core   Shared domain: locales (19), profiles and family rules,
                subscription tiers, restricted-mode guardrails, QF client.
packages/db     Postgres schema (Drizzle): families, child profiles, madrasahs,
                classes, assignments, mistakes, plans, memorisation cards,
                games, subscriptions, AI jobs, API keys, webhooks.
docs/research   Verified API findings, catalog of the 24 apps on the Quran.com
                App Store, and the master feature matrix.
docs/           Architecture and roadmap.
```

## What works today

- `/player` listen, read, translate and study tafsir in one screen, any reciter,
  gapless with word highlighting, repeat and memorisation controls
- `/mushaf` printed page layouts (Madani, Tajweed, KFGQPC, IndoPak) with the
  official fonts, tap any word to listen from there
- `/family` profiles for every family member with bookmarks, notes and progress
- Public API v1 under `/api/public/v1` for integrations

## Run

```bash
npm install
cp apps/web/.env.local.example apps/web/.env.local   # add CLIENT_ID / CLIENT_SECRET
npm run dev:web        # http://localhost:3000
npm run dev:mobile     # Expo dev server (scan with Expo Go or run a simulator)
npm run api:smoke      # verifies the Quran Foundation connection
npm test
```

## Rules that never change

- Quranic text, translations and audio are served verbatim from the Quran
  Foundation API. AI features run in restricted mode and can never alter an
  ayah, a word, a diacritic, a translation or a reciter's voice
  (`packages/core/src/restricted-mode.ts`).
- The client secret lives only on the server. Mobile and TV apps call our
  backend.
- Female reciters are available to female profiles only.
- Children have no account of their own. They are sub-profiles of a parent's
  Quran Foundation account.
