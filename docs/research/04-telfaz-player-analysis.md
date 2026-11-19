# Telfaz APK: how its Quran module works (static analysis, 2026-11-12)

Analysed `telfaz-1.0.1_1.apk` (package `com.etvwin.ott`, native Kotlin,
Jetpack Compose, Media3/ExoPlayer). No emulator was used; the dex was
decompiled and the Quran module (`com.etvwin.ott.data.quran`,
`com.etvwin.ott.ui.quran`) read end to end.

## Data sources

| Purpose | Endpoint | Notes |
|---|---|---|
| Surah list | `https://api.quran.com/api/v4/chapters?language=ar` | Public, unauthenticated API |
| Verses of a surah | `/verses/by_chapter/{n}?language=ar&words=false&per_page=300&fields=text_uthmani&audio={reciterId}&translations={id}` | One request per surah; translation optional |
| Basmala audio | `/verses/by_key/1:1?...&audio={reciterId}` | Prepended as its own segment |
| Tafsir | `/tafsirs/16/by_ayah/{verseKey}` | Fixed to Tafsir al-Muyassar (Arabic); HTML stripped |
| Translation catalogue | `/resources/translations` | Default Saheeh International (20) or "no translation" |
| Reciters | hardcoded: Mishari al-Afasy (7), AbdulBaset (2), riwayah Hafs 'an 'Asim | images from `media.telfaz.net/prod1/static/assets/quran-reciters/` |
| Full-surah audio (radio) | `/chapter_recitations/{reciterId}` | For continuous "stations" |
| Per-ayah audio | `https://verses.quran.foundation/` + relative url | Played as ExoPlayer playlist |

## Player model

- `QuranUiState` holds: page (HOME, BROWSE, PLAYER), tab (SURAHS, RADIO,
  RECITERS, SETTINGS), surahs, reciters, chapter recitations, picked and
  playing surah, `segments`, `segmentIndex`, `isPlaying`, status (IDLE,
  LOADING, READY, ENDED, NETWORK_ERROR, UNAVAILABLE), reciter, translation,
  textSize (SMALL 0.82, MEDIUM 1.0, LARGE 1.16), autoAdvance, motion,
  panel (SURAHS, RECITER, TRANSLATION, TAFSIR, SETTINGS), tafsir,
  tafsirLoading, resume (surah + segment).
- A surah becomes a list of `QuranSegment` (key, ayah, arabic,
  translation, audioUrl, durationMs). The Basmala is segment 0 for every
  surah except 1 and 9. ExoPlayer gets one media item per segment with id
  `verse:{index}`, so the highlighted text and the audio are always the
  same index.
- Changing reciter or translation reloads the segments and keeps the
  index ("you can choose another reciter and continue from the same
  position").
- Auto-advance opens the next surah when the last segment ends.
- Resume is persisted in SharedPreferences (last_surah, last_segment) with
  reciter, translation, text size, auto and motion.
- A foreground `MediaSessionService` ("quran-recitation") keeps playback in
  the background with lock-screen controls.
- Radio tab: curated stations such as "Juz Amma (An-Naba to An-Nas)",
  "Ya-Sin, Al-Waqi'ah, Al-Mulk: three surahs read in the evening",
  "Surah Al-Kahf: read on Friday, on repeat", "frequently listened surahs",
  "selected recitations", plus the complete mushaf per reciter.
- UI copy is Arabic-first (labels listed in the decompiled composables).

## What we built differently

- Our backend (apps/web) proxies the Quran Foundation API with OAuth2
  client credentials and granular scopes instead of the public legacy
  endpoint, caches at the edge, and exposes the same data through
  `/api/public/v1/*` for web, mobile, TV and third parties.
- Tafsir is selectable per language (Jalalayn for Arabic, Ibn Kathir for
  English on prelive) instead of fixed.
- Reciters come from the catalogue (not two hardcoded ones) and respect the
  female-reciters-for-female-profiles rule.
- Translations come from the full catalogue with a language filter.
- The shared state machine lives in `packages/core/src/player.ts` with
  tests, and both the web and the Expo player are thin shells around it.
