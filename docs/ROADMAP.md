# Roadmap (build order agreed on 2026-11-12)

Phase 0 (done): research, prelive API connection, monorepo, core domain,
database schema, public API v1 (content), mobile skeleton.

Done so far in Phase 1 (2026-11-12):
- Unified player (web + mobile): gapless engine with word sync, full
  reciter catalogue, translations, tafsir, word meanings, repeat, speed,
  sleep timer, stations, resume
- Mushaf page view (web + mobile): Madani v1/v2, Tajweed colour, KFGQPC
  Hafs, IndoPak 15/16 with the official per-page fonts loaded on demand
- Family profiles (local-first): parent / child / adult / senior / teacher,
  kids and senior UI modes, per-profile bookmarks, notes, daily minutes and
  streaks; sync to the Quran Foundation account is wired for when user
  login scopes are enabled on the client
- Archive reciters (Ahmed al-Ajmi, Maher al-Muaiqly, Raad al-Kurdi) with
  word sync produced by forced alignment (torchaudio MMS_FA), benchmarked
  within ~50-100 ms of the official timings; all 342 surah files shipped
  (3% low-confidence words, see `tools/align/README.md`)
- Study layer (web + mobile): Search API with navigation and verbatim results,
  study page per ayah (word by word, translations, up to three tafsirs side
  by side, surah info, hadith / answers / reflections when the gateway
  serves them), Quranlingo-style lessons with XP and streaks, Tasmi-style
  memorisation with spaced review and a browser speech check, arena games,
  restricted-mode Ask with verbatim citations, shareable verse links with
  preview images, ayah of the day. The Expo app has the same six screens
  (search, study, learn, play, memorise, ask) on the same public API; the
  microphone check stays web-only until a speech module is added
- Focus player (web + mobile): one-screen landscape/TV layout with the
  current ayah, word highlight and translation beneath; split layout for
  every panel (surahs, reciter, translation, tafsir, wallpaper, notes,
  settings): a side column, or the bottom half on portrait phones, never
  an overlay on the player, on web and Android;
  wallpapers per surah (nature photos, Islamic art patterns, live canvas,
  optional Pexels); full tafsir / reciter / translation catalogues

Phase 1, Core reader on every screen
- Mushaf page view with every layout (Madani 15/16, IndoPak, Tajweed, KFGQPC)
- Translation mode, word-by-word, tap-to-hear, surah info, juz/hizb/page nav
- Audio player: reciters by style, gapless, repeat/range/speed, highlight
- Bookmarks, collections, notes, goals, streaks, reading history (QF APIs)
- Family profiles: parent, child, adult, senior; kids and senior UI modes
- 66 interface languages (all translation languages), RTL, device-language
  default: done (50 full dictionaries, 16 core, English fallback per string)
- Azan: on-device prayer times per country method, muezzin choice, in-app
  azan, push / local notifications, ayah-of-the-day story: done
- Offline text bundle
- Netlify deploy (web + backend): done. Android APK from the repo: done.
  iOS: project generated, size classes for iPhone SE → 18 Pro Max, iPhone Duo
  (outer and inner display) and iPad, CI simulator build and unsigned archive
  (`.github/workflows/ios.yml`), EAS profiles for TestFlight / App Store; a
  signed store build still needs the Apple Developer team on EAS or a Mac.
  TV targets: later

Brand and themes: logo, four themes, tabs, Me screen, notification chime,
sources badge, store kit: done (2026-11-14). Accounts and Offline Audio code
in place, waiting for Supabase / RevenueCat / store products.

Phase 2, Study
- Tafsir compare, hadith per ayah, Answers, qira'at (production), Read in
  Context, pin and compare, rich notes with embeds, PDF export

Phase 3, Learn and memorise
- Learning Plans (Arabic first) authored from sources, scholar review flow
- Memorisation: staged methods, 6446, 3x3, spaced review, hidden-word and
  next-ayah tests, recite-in-prayer, plans and reminders
- Arabic speech recognition alignment and mistake marking
- Quranic Arabic: grammar per word, vocabulary games

Phase 4, Family and madrasah
- Parent dashboard: progress, goals, daily limits, weekly email
- Madrasah: classes, invites, assignments (lesson/revision/review/qaidah),
  pass/fail, word-level mistakes, parent summaries

Phase 5, Entertaining tab
- Games: next ayah, blank ayah, word match, trivia, memory, runner
- Leaderboards for family and class, achievements, daily challenges

Phase 6, Community and media
- QuranReflect: feed, post, six reactions, Re-Reflect, groups
- Media maker: verse images and recitation videos with word-timed captions,
  AI backgrounds in restricted mode, share to social
- AI Ask with scholar-grounded citations and model choice

Phase 7, Business and integrations
- Stripe + RevenueCat tiers (Free, Plus, Family, Madrasah)
- Public API keys, webhooks, OpenAPI docs, VOD integration (Telfaz)
- Production credentials, search scope, store submissions
