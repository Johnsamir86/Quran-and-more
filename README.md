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
  gapless with word highlighting, repeat and memorisation controls. Reciters
  outside the API catalogue (Ajmi, Muaiqly, Kurdi) get word timings from our
  own forced-alignment pipeline in `tools/align`
- `/mushaf` printed page layouts (Madani, Tajweed, KFGQPC, IndoPak) with the
  official fonts, tap any word to listen from there
- `/family` profiles for every family member with bookmarks, notes and progress

Android test build: https://quran-and-more.netlify.app/android.apk (arm64; latest APK is kept on the `apk-builds` branch)
- `/search` Quran Foundation Search API (surah, juz, page and ayah navigation
  plus verbatim verse results in 70 languages)
- `/study/2:255` one ayah in depth: word by word with occurrence search,
  translations, up to three tafsirs side by side, surah info, related hadith,
  answers and reflections when the production gateway serves them
- `/learn` Quranlingo-style vocabulary lessons per surah with XP, levels and streaks
- `/hifz` Tasmi-style memorisation: hide, recall, self-grade, spaced review,
  6446 and 3x3 drills, optional microphone check
- The Android/iOS app (`apps/mobile`) has the same player, mushaf, family and
  study screens (search, study, learn, play, memorise, ask) on the same API
- `/play` arena games: which surah, next ayah, missing word, which juz
- `/ask` Quran AI in restricted mode: answers only from retrieved ayat and
  tafsir, quoted verbatim, pending scholarly review (model answers need
  `ANTHROPIC_API_KEY`)
- `/v/2:255` shareable verse links with a preview image
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

## Content source

`CONTENT_SOURCE=qdc` (default) reads the open Quran.com v4 API: the whole
mushaf, every reciter, 126 translations and 20 tafsirs. `CONTENT_SOURCE=qf`
reads the Quran Foundation gateway with `CLIENT_ID` / `CLIENT_SECRET`
(prelive carries Surah 1 and 2 only; production needs production credentials).

## Android APK (test build)

```bash
cd apps/mobile
EXPO_PUBLIC_API_BASE_URL=https://quran-and-more.netlify.app npx expo prebuild -p android
cd android && ./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a
# -> android/app/build/outputs/apk/release/app-release.apk (signed with the debug key)
```

Needs JDK 17+, the Android SDK (platform 36, build-tools 36) and about 10 GB of
disk for the native build. Store builds go through EAS (`eas build -p android`).

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
