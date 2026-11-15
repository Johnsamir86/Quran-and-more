# Quran app landscape, November 2026: what the leaders ship and what Quran and More added

Prepared overnight on 15–16 November 2026 from the public App Store and Google Play listings, the
publishers' own sites and press pages, and app-intelligence estimates. Figures marked ≈ are
estimates from third-party trackers (Sensor Tower / AppMagic / Appfigures style numbers quoted in
press), not audited data.

## 1. The field

| App | Model | Downloads (≈) | What it is known for |
| --- | --- | --- | --- |
| Muslim Pro | Free + ads; Premium subscription | 150 M+ | Prayer times, azan, Qibla, Hijri calendar, Quran with audio and translations, Hisn al-Muslim duas, tasbih, 99 names, halal places, "Qalbox" video |
| Quran Majeed (PDMS) | Free + IAP; Premium subscription | 25 M+ | Mushaf with many scripts, tajweed colours, word by word, 50+ reciters, tafsir, memorisation, Qibla, prayer times |
| Tarteel AI | Free tier; Premium subscription | 10 M+ | AI recitation recognition, memorisation mistake detection, goals, streaks, hifz tracking |
| Quran.com (Quran Foundation) | Free, non-profit | 10 M+ | Clean reader, word by word, 20+ tafsirs, reflections (QuranReflect), notes, goals and streaks, learning plans |
| Al Quran (Tafsir & by Word) by Greentech | Free + IAP | 10 M+ | Word-by-word grammar, root search, mushaf layouts |
| Athan by IslamicFinder | Free + ads; Premium | 50 M+ | Prayer alerts, Qibla, Hijri, duas, Quran, prayer log |
| Pillars | Free; donation / subscription | 1 M+ | Beautiful prayer times, Qibla, dhikr, privacy-first |
| Quranly | Freemium | 1 M+ | Reading habit, khatmah pace, streaks, community circles |
| Islam360 | Free; lifetime unlock | 10 M+ | Urdu-first Quran, hadith, word search, offline |
| Ayah | One-time purchase (≈ $5) | 100 K+ | Minimal mushaf reader, memorisation, no ads, highly rated |

## 2. Feature matrix against Quran and More (before tonight)

✓ shipped · ◐ partial · ✗ missing

| Feature | Muslim Pro | Quran Majeed | Tarteel | Quran.com | QaM before | QaM now |
| --- | --- | --- | --- | --- | --- | --- |
| Gapless recitation with word sync | ✗ | ◐ | ◐ | ✓ | ✓ | ✓ |
| Mushaf in KFGQPC fonts, tajweed layout | ◐ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Translations and tafsir in many languages | ✓ | ✓ | ◐ | ✓ | ✓ | ✓ |
| Word by word meanings | ◐ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Prayer times + azan + notifications | ✓ | ✓ | ✗ | ✗ | ✓ | ✓ |
| **Qibla compass** | ✓ | ✓ | ✗ | ✗ | ✗ | **✓** |
| **Hijri calendar + Islamic dates + Ramadan countdown** | ✓ | ✓ | ✗ | ✗ | ◐ (date only) | **✓** |
| **Adhkar / Hisn al-Muslim with counters** | ✓ | ✓ | ✗ | ✗ | ✗ | **✓** |
| **Tasbih counter** | ✓ | ✓ | ✗ | ✗ | ✗ | **✓** |
| **Khatmah planner (finish in N days, daily portion)** | ◐ | ✓ | ✓ | ✓ (goals) | ✗ | **✓** |
| Memorisation with spaced review | ◐ | ✓ | ✓ (AI) | ◐ | ✓ | ✓ |
| AI recitation checking | ✗ | ✗ | ✓ | ✗ | ◐ (mic check) | ◐ |
| Ask AI (answers only from ayat and tafsir) | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ |
| Ayah story / share as image | ✓ | ◐ | ✗ | ✓ | ✓ | ✓ |
| Share ayah as **video** with voice + synced words | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ |
| Moving video backgrounds | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ |
| Voice commands ("play Surah Al-Kahf") | ✗ | ✗ | ◐ | ✗ | ✓ | ✓ |
| Lock-screen / background playback | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Family profiles (child to grandparent) | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ |
| Vocabulary lessons / games (Quranlingo style) | ✗ | ✗ | ✗ | ✓ (learning plans) | ✓ | ✓ |
| Offline audio downloads | ✓ (premium) | ✓ | ✓ | ✓ | ✓ (subscription) | ✓ |
| 48+ interface languages | ◐ (≈ 20) | ◐ (≈ 10) | ◐ | ◐ (≈ 25) | ✓ | ✓ |
| Zakat calculator | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ (deliberate, see §4) |
| 99 names of Allah | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ (next) |
| Home-screen widgets | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ (next) |
| Halal places / community | ✓ | ✗ | ✗ | ✓ (reflections) | ✗ | ✗ (out of scope) |

The five rows in bold were the gaps every mainstream competitor fills and that our users would
notice first ("where is the Qibla?"). They were built tonight across core, web and mobile, with
the interface in all 48 dictionary languages (full text in 18 languages, English fallback for the
rest, like every other screen).

## 3. What was built tonight

### 3.1 Adhkar (Hisn al-Muslim) — `/adhkar`, mobile `adhkar`
* Five sets: morning, evening, after prayer, before sleep, on waking. 61 remembrances.
* Each card: Arabic text, meaning (English or transliteration toggle), count, source hadith and
  virtue where the book gives one. Tap to count; a card locks green when its count is reached;
  per-set progress bar; counts reset each day; the set suggested by the time of day opens first.
* Data: two MIT-licensed transcriptions of Hisn al-Muslim (Seen-Arabic/Morning-And-Evening-Adhkar-DB
  for morning/evening with Arabic, English, transliteration, counts, sources and virtues;
  asellam/HisnElMuslim for the Arabic text, counts and references of the other three sets, with
  our own English renderings). Arabic text is shown exactly as published and is marked as the
  authority; licence notices are in `packages/core/src/adhkar-data.ts`.

### 3.2 Qibla compass — `/qibla`, mobile `qibla`
* Great-circle bearing to the Kaaba (21.422487 N, 39.826206 E) from the saved azan location or
  the device location; distance in km; compass point.
* Live dial: web uses `DeviceOrientation` (`webkitCompassHeading` on iOS, absolute alpha elsewhere)
  behind the iOS permission prompt; mobile uses `expo-location` `watchHeadingAsync` (true heading
  when available). Low-pass filtered, "turn left/right n°", green ring when within 3°.
* Verified against published bearings: Kuwait City 225°, London 119°, New York 58°, Jakarta 295°.
* Copy tells the user that phone compasses drift near metal and to confirm with the mosque.

### 3.3 Hijri calendar — `/calendar`, mobile `calendar`
* Umm al-Qura calendar through `Intl` (`islamic-umalqura`), the same civil calendar Saudi Arabia
  and the big apps use, with a ±2 day manual adjustment for local moon sighting (stored).
* Month grid with Gregorian sub-dates, markers on event days, previous/next month.
* Upcoming dates in the next year with countdown: Islamic New Year, Ashura, 1 Ramadan, last ten
  nights, Eid al-Fitr, Arafah, Eid al-Adha, Tashriq, the white days (13–15) of this and next month.
  Each fasting day carries a one-line note with its hadith basis. Ramadan countdown on the page
  and in the khatmah planner ("finish before Ramadan").

### 3.4 Tasbih — `/tasbih`, mobile `tasbih`
* Nine presets (SubhanAllah, Alhamdulillah, Allahu Akbar, tahlil, istighfar, salawat, hawqala,
  "SubhanAllahi wa bihamdihi", the full tahlil) plus a custom target; count, rounds, total;
  vibration on each tap and a longer pulse at the end of a round; optional after-prayer sequence
  that advances 33 → 33 → 34 automatically; keyboard space/enter on web; screen wake lock.

### 3.5 Khatmah planner — `/khatmah`, mobile `khatmah`
* Choose 30/60/90/180/365 days, a custom number, or "finish before Ramadan"; optional start page.
* Shows today's portion (pages and juz), pages per day, percent complete, days left, pages behind
  (only counted from the end of yesterday, so day one is never "behind"), and a button that opens
  the mushaf at today's page. Progress comes from the mushaf's own reading record for the active
  family profile or from "mark today's portion as read" / a manual page.

### 3.6 Entry points
* Web home tiles, the study-shell navigation chips, mobile home quick tiles and a row of chips on
  the Azan tab. Interface strings live in `worship.*` and `home.tiles.*` in the core dictionaries.

## 4. Religious and legal vetting notes

* **Only mainstream, non-contested content.** The calendar lists dates that all four Sunni schools
  observe and avoids commemorations that differ between communities. Fasting notes quote the
  well-known hadith (Ashura, Arafah, white days, Tashriq) without ruling on disputed details.
* **Adhkar come from a single recognised book**, Hisn al-Muslim, reproduced from MIT-licensed
  transcriptions; the Arabic is authoritative, every item shows its source, and the "about" line
  says translations are for understanding. The transparency badge policy of the app applies.
* **Qibla and Hijri are presented as tools with stated limits** (compass interference, one-day
  variance from local sighting) and both tell the user to confirm with the local mosque.
* **Zakat was deliberately not built.** Nisab basis (gold vs silver), treatment of debts, salaries,
  shares and pensions differ between schools and fatwa councils, and a wrong number is a real
  harm. If added later it must be region-specific and reviewed.
* **99 Names**: the common GPL-licensed dataset cannot be bundled with a proprietary app; a hand
  authored list with references is a short follow-up.
* **Licences**: the two datasets are MIT (attribution kept in the source file). No GPL code or
  data was used. Nothing was scraped from competitors.

## 5. Recommended next (priority order)
1. Home-screen widgets (next prayer, ayah of the day, khatmah today) on iOS/Android.
2. 99 Names with meanings and short explanations in all languages.
3. Khatmah notifications and a weekly reading summary.
4. Qibla "AR" view using the camera on mobile.
5. Community reading circles (shared khatmah) once accounts are live.

## 6. Sources consulted
App Store and Google Play listings and "In-App Purchases" sections for Muslim Pro, Quran Majeed,
Tarteel, Quran.com, Athan, Pillars, Quranly, Islam360, Ayah; publishers' pricing pages
(muslimpro.com/premium, tarteel.ai/premium, quranmajeed.com); press coverage of Muslim Pro's
subscriber and revenue estimates (TechCrunch, Rest of World, Sensor Tower blog); Quran Foundation
API documentation; Hisn al-Muslim datasets on GitHub (licences checked in the repositories).
