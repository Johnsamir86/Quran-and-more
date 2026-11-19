# Store listing kit

Decisions (2026-11-14): paid app at the $4.99 tier on both stores; one in-app
subscription "Offline Audio" ($1.99/month, $14.99/year with a 7-day trial)
that unlocks offline surah downloads and every archive reciter. Everything
else (Quran text, recitation with word highlighting, mushaf, translations,
tafsir, learn, hifz, games, ask in retrieval mode, azan, story, 66 languages,
4 themes) is included in the purchase price. No ads, no tracking SDKs.

## Identity

| | |
|---|---|
| Name | Quran and More |
| Arabic name | القرآن وأكثر |
| Subtitle (App Store, ≤30) | Listen, read, learn, azan |
| Short description (Play, ≤80) | Quran for the whole family: gapless recitation, mushaf, tafsir, azan, learning |
| Bundle / package id | foundation.quranandmore.app |
| Category | Education (primary), Reference (secondary) · Play: Education |
| Age rating | 4+ / Everyone (no user-generated content shown publicly, no ads) |
| Price | Tier 5 ($4.99) · in-app: offline_audio_monthly $1.99, offline_audio_yearly $14.99 (7-day trial) |
| Support URL | https://quran-and-more.netlify.app |
| Privacy policy | https://quran-and-more.netlify.app/privacy |

## Description (long)

Quran and More is one Quran app for the whole family. Listen to any reciter
with the words lighting up as they are recited, read the printed mushaf page
with the official fonts, understand each ayah with translations and tafsir in
your language, memorise with spaced review, learn vocabulary with short
lessons, and get the azan for your city in the voice you choose.

- Player: gapless recitation, word highlighting, repeat and range, sleep timer,
  translation and tafsir beside the ayah, 60+ reciters including archive voices
- Mushaf: Madani, Tajweed, KFGQPC and IndoPak layouts, tap a word to listen
- Study: word by word, translations, up to three tafsirs side by side
- Learn, Hifz, Play: lessons with XP and streaks, memorisation methods (6446,
  3×3), games for the whole family
- Azan: prayer times for your city with your country's method, azan in nine
  voices, notifications, ayah of the day in story form
- Family: a profile for every member with their own settings, bookmarks, notes
  and progress; kids and senior modes
- 66 interface languages, 4 themes with light and dark
- Offline Audio (optional subscription): download any surah and unlock every
  archive reciter

Content comes from the Quran Foundation / Quran.com catalogue, credited to its
authors. Translations and tafsir selections are shown with their sources; a
scholarly review of the app's own selections is pending and the app says so.

## Keywords (App Store, ≤100 chars)

quran,koran,mushaf,tafsir,azan,adhan,prayer times,hifz,recitation,islam,family,arabic

## Screenshots plan (6.9" and 6.5" iPhone, 13" iPad, Android phone/tablet)

1. Player with word highlighting and the tafsir panel split beside it
2. Mushaf page (Tajweed layout)
3. Azan: next prayer, today's times, muezzin picker
4. Ayah of the day story on a wallpaper
5. Learn hub + a lesson exercise
6. Family profiles with kids mode
7. Themes: the four looks side by side
8. Languages: the picker with Arabic, Urdu, Indonesian, French

Capture from the simulator with the smoke routes in `.github/workflows/ios.yml`
or `xcrun simctl io booted screenshot`, then frame in Canva (device frames,
one-line captions in the Serene theme).

## Privacy nutrition labels

- Data not linked to you: none collected by the app itself today. Family
  profiles, bookmarks, notes and progress stay on the device.
- With an account (Supabase): email address and name (Apple/Google), used for
  sign-in and sync only. Not used for tracking. No third-party advertising.
- Location: used on the device to compute prayer times; never sent to a server.
- Microphone: only during the memorisation check; audio is compared on the
  device and not uploaded.
- Purchases: handled by Apple / Google through RevenueCat (anonymous app user id).
- Web push (web app): subscription endpoint and azan settings stored in Netlify Blobs.

## RevenueCat set-up

1. Create the project, add iOS and Android apps (bundle id above).
2. Products: `offline_audio_monthly`, `offline_audio_yearly` (App Store Connect
   subscription group "Offline Audio"; Play Console subscription with two base plans).
3. Entitlement `offline_audio` attached to both products; offering `default`
   with packages `$rc_monthly` and `$rc_annual`.
4. Put the public SDK keys in EAS secrets `EXPO_PUBLIC_REVENUECAT_IOS_KEY` /
   `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`. Without them the app shows the
   subscription as unavailable and nothing is gated (test builds).

## Supabase set-up (accounts)

1. New project; Authentication → Providers: Apple (Services ID, key id, team
   id, private key), Google (web client id/secret; iOS and Android client ids in
   Google Cloud), Email with magic links.
2. Redirect URLs: `quranandmore://auth`, `https://quran-and-more.netlify.app/auth/callback`.
3. Table `family_state (user_id uuid primary key, state jsonb, updated_at timestamptz)`
   with RLS `user_id = auth.uid()`; the family record syncs as one document.
4. EAS secrets / Netlify env: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`,
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
