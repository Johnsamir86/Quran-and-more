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
  outside the API catalogue (Ajmi, Muaiqly, Kurdi, al-Banna murattal and
  mujawwad) get word timings from our
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
- `/azan` prayer times computed on the device for any city (country-specific
  calculation method, Hanafi/standard Asr, high-latitude rule), azan in a
  choice of muezzin voices, in-app azan at prayer time and push notifications
  per prayer (web push via a Netlify scheduled function; local notifications
  with the azan sound on Android/iOS)
- `/story` ayah of the day in story form: full-screen wallpaper, the ayah, its
  meaning, a tafsir excerpt and a reflection prompt; opened from the azan
  notification
- Interface in 66 languages (every language that has a Quran translation in
  the catalogue): 50 full UI dictionaries, 16 core dictionaries, the rest
  fall back to English per string; content stays in the chosen language
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

## iOS (iPhone and iPad)

The same Expo app targets iOS 16.4 and later, so it runs on every iPhone from
the iPhone 8 / SE (2nd generation) up to the iPhone 18 Pro and 18 Pro Max, and
on iPhone Duo (both the 5.4-inch outer display and the 7.6-inch inner one) as
well as iPad. Layout follows the window, not the device: compact (< 600 pt,
every phone in portrait, the Duo outer display) and regular (≥ 600 pt, the Duo
inner display at 669 × 951 pt, iPad, split view) classes, continuous resizing
(`UIRequiresFullScreen` is off), safe-area insets for the Dynamic Island and
rounded corners, all four orientations, and a 28 s azan notification sound
(under the 30 s iOS limit). Build with the newest Xcode (27.1 or later) so the
app reaches the full inner display of iPhone Duo.

Three ways to get a build:

```bash
# 1. Unsigned builds from GitHub Actions (no Apple account needed):
#    .github/workflows/ios.yml runs on every push to this branch and uploads
#    ios-simulator-app (drag onto any iPhone simulator), ios-simulator-screenshots
#    (iPhone 18 Pro / Pro Max / Duo when the runner has them) and ios-unsigned-archive.

# 2. On a Mac with Xcode:
cd apps/mobile
EXPO_PUBLIC_API_BASE_URL=https://quran-and-more.netlify.app npx expo prebuild -p ios
cd ios && pod install && open QuranandMore.xcworkspace   # pick your team, run on a device or simulator

# 3. TestFlight / App Store through EAS (needs an Expo account and the Apple Developer team):
cd apps/mobile
npx eas-cli login
npx eas-cli build -p ios --profile production      # signed .ipa, credentials managed by EAS
npx eas-cli submit -p ios                           # upload to App Store Connect
npx eas-cli build -p ios --profile development     # simulator build for quick testing
```

Bundle id `foundation.quranandmore.app`, build number 5. Push notifications on
iOS use local scheduled notifications (no APNs key needed); the `aps-environment`
entitlement is present for a future remote-push setup.

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
