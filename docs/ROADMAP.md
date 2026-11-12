# Roadmap (build order agreed on 2026-11-12)

Phase 0 (done): research, prelive API connection, monorepo, core domain,
database schema, public API v1 (content), mobile skeleton.

Phase 1, Core reader on every screen
- Mushaf page view with every layout (Madani 15/16, IndoPak, Tajweed, KFGQPC)
- Translation mode, word-by-word, tap-to-hear, surah info, juz/hizb/page nav
- Audio player: reciters by style, gapless, repeat/range/speed, highlight
- Bookmarks, collections, notes, goals, streaks, reading history (QF APIs)
- Family profiles: parent, child, adult, senior; kids and senior UI modes
- 19 languages, RTL, device-language default
- Offline text bundle
- Netlify deploy (web + backend), EAS builds (iOS, Android), TV targets

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
