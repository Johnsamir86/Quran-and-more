# Pricing study: is Quran and More worth $4.99 up front, and what makes it so?

Status: recommendation for the launch pricing of the iOS and Android apps. Written 16 Nov 2026.

## 1. What the market charges (public store listings, Nov 2026)

| App | Entry price | Recurring | One-time |
| --- | --- | --- | --- |
| Muslim Pro | Free with ads | Premium $12.99/mo, $34.99–49.99/yr (varies by country; ≈ $3.99/mo tiers exist) | none |
| Tarteel AI | Free (limited) | $12.99/mo, $99/yr (some regions list $19.99/mo and $239.99 lifetime) | lifetime in some regions |
| Quran Majeed | Free with IAP | from $0.99/mo; ≈ $29.99/yr | ≈ $49.99 lifetime bundle |
| Athan (IslamicFinder) | Free with ads | ≈ $29.99/yr | none |
| Quranly | Free | ≈ $4.99/mo, ≈ $29.99/yr | none |
| Islam360 | Free | none | ≈ $79 lifetime unlock |
| RecitID | Free trial | $59.99/yr | none |
| Quran.com | Free | donations | none |
| Ayah (minimal mushaf) | **$4.99 paid app** | none | included |
| iQuran Pro / Quran Pro (older) | $2.99–$6.99 paid | none | included |

Observations:
* The category is dominated by **free downloads with ads or a subscription**. Paid-up-front Quran
  apps exist (Ayah, iQuran Pro) but are niche and sell on "no ads, respectful, one price".
* Annual subscriptions cluster at **$30–50 per year**. Our existing Offline Audio plan at
  $1.99/month or $14.99/year sits well under that.
* Muslim Pro's estimated revenue (≈ $80–100 K per month from the stores at the low end, far more
  including ads) comes from scale: 150 M+ downloads with a low single-digit percent converting.
* A $4.99 paywall in front of the download cuts installs by an order of magnitude compared with
  free; most users never see the quality that would have convinced them.

## 2. Does the app justify $4.99?

Yes on substance. After tonight the feature set exceeds the paid tier of every competitor except
Tarteel's AI recitation grading:
gapless word-synced recitation with 100+ reciters, the mushaf in the KFGQPC fonts, tafsir and
translations in every language the Quran Foundation hosts, Ask AI that only quotes ayat and tafsir,
memorisation with spaced review, lessons and games, family profiles, azan and prayer times, ayah
story with video export and moving backgrounds, voice commands, lock-screen playback, and now
adhkar, Qibla, Hijri calendar, tasbih, the 99 names and the khatmah planner, all in 48 languages, with no ads.

The issue is not value but **discoverability and trust**: a new brand asking for money before the
first open, in a category where the best-known apps are free, will convert poorly and collect
"why pay when Muslim Pro is free" reviews.

## 3. Recommendation

**Launch free, keep everything that touches worship free forever, and sell one premium bundle.**

* **Free, no ads, no limits:** the whole Quran (reading, listening online, word by word, one
  tafsir and translation at a time), azan and prayer times, Qibla, Hijri calendar, adhkar, tasbih,
  khatmah planner, ayah of the day, voice commands, family profiles. Charging for the Quran itself
  or for prayer tools produces the harshest feedback in this category, and the free tier is what
  earns the ratings and the word of mouth.
* **Quran and More Plus — $1.99/month, $14.99/year, or $29.99 lifetime** (the Offline Audio plan
  already wired through RevenueCat, widened):
  * offline audio downloads and archive reciters,
  * up to three tafsirs side by side, all translations at once,
  * ayah video export in 1080p without the small watermark, moving backgrounds, extra fonts,
  * Ask AI beyond a daily allowance,
  * memorisation microphone check and detailed progress,
  * family: more than two profiles, parent reports.
* **Lifetime at $29.99** answers the users who refuse subscriptions on principle (common in this
  audience) and still earns six times the proposed $4.99.
* Keep **$4.99** only as a regional fallback: if a market does not allow subscriptions through
  the store account types we support, or for a "Classic" SKU with no cloud features.

Why this beats $4.99 up front:
* Expected revenue per 1 000 store visitors: $4.99 paid app at a ≈ 2–3 % paid conversion yields
  ≈ $100–150 (net ≈ $70–105 after store fees). Free with a 3–5 % conversion to a $14.99 year or
  $29.99 lifetime yields ≈ $450–1 500 net, plus a much larger installed base for word of mouth.
* It matches what users already compare us to (Muslim Pro and Quran Majeed yearly plans) at
  a third to half their price, and keeps the religious core free, which the community expects.

## 4. What is still missing before asking for money (in order)

1. **App Store and Play Store presence**: Apple Developer Program enrolment and TestFlight; the
   Play listing with the screenshots kit already in `docs/`.
2. **Accounts and sync** (Supabase keys): a subscription people cannot restore across devices
   generates refund requests.
3. **Widgets** (next prayer, khatmah today, ayah of the day): the top request in competitor reviews.
4. **Khatmah reminders** and a weekly reading summary.
5. **Content review badge** turned from "pending" to "reviewed" for at least the Arabic UI and the
   Ask AI sources, by a named scholar or institution.
6. **A 7-day free trial** on the yearly plan and a Ramadan launch offer (Ramadan 1448 begins around
   8 February 2027 by the Umm al-Qura calendar, ≈ 85 days from this note).

## 5. Store copy for the price (ready to paste)

> Quran and More is free: the full Quran, recitation, tafsir, prayer times, Qibla, adhkar and the
> khatmah planner, with no advertising, ever. Plus adds offline audio, more tafsirs side by side,
> HD ayah videos and family reports for $14.99 a year or $29.99 once.
