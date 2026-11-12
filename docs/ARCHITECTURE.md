# Architecture

## Runtime topology

```
            ┌──────────────────────────┐
            │  Quran Foundation APIs   │  content, user data, QuranReflect, OAuth2
            └────────────┬─────────────┘
                         │ client credentials (server) / PKCE (user)
┌────────────────────────┴─────────────────────────┐
│  apps/web  (Next.js on Netlify)                  │
│  - pages: reader, study, library, family, plans  │
│  - /api/*          app backend (session cookie)  │
│  - /api/public/v1  integrations (API keys)       │
│  - Postgres (Neon) via packages/db               │
│  - AI gateway (restricted mode)                  │
└───────┬───────────────────────┬──────────────────┘
        │ HTTPS JSON            │ HTTPS JSON + webhooks
┌───────┴────────┐      ┌───────┴────────┐
│ apps/mobile    │      │ 3rd parties    │  e.g. VOD platforms
│ iOS, Android,  │      │ (API key)      │
│ Android TV,    │      └────────────────┘
│ Apple TV       │
└────────────────┘
```

## Identity

- Parent signs in with Quran Foundation OAuth (Authorization Code + PKCE).
  The `sub` claim is the stable key. Our `accounts` row references it.
- A family has one owner account and up to N profiles. Child, senior and
  teacher-view profiles have no QF account; their progress lives in our
  database. Adults may link their own QF account to a profile so their
  bookmarks sync with Quran.com.
- Madrasahs are organisations with teachers (accounts) and classes.
  A child profile is enrolled into a class with an invite code; the parent
  then sees assignments, grades and marked mistakes.

## Content

- All Quran text, translations, tafsir, audio come from the Content API with
  granular scopes. Responses are cached at the edge (public API) and in
  memory (token).
- Mushaf page rendering uses `code_v2` glyphs and word line numbers so pages
  match the printed Madani mushaf. Tajweed layout uses `text_uthmani_tajweed`.
- Offline: text, translations and fonts are bundled per mushaf layout. Audio
  streams from the Quran Foundation CDN.

## AI gateway (restricted mode)

- Provider adapters (Anthropic, OpenAI, Google, others) behind one
  interface; the user picks the model.
- Every job records `restrictedMode`, the provider and the verbatim check.
- Visual generation never receives the ayah as something to edit; the ayah
  is composited from the official text after generation and verified with
  `assertVerbatimQuran`.
- Q&A retrieves only from scholar-reviewed sources (tafsir list, Answers,
  verified QuranReflect authors) and must cite.

## Speech (memorisation)

- Phase one: Arabic speech recognition for word alignment, hidden-word
  tests and mistake marking. No tajweed grading claims.
- Phase two: dedicated tajweed model.

## Payments

- Web: Stripe Checkout and Customer Portal.
- iOS and Android: RevenueCat, mapping store products to the same tier ids.
- `subscriptions` holds the source of truth; feature gates read the tier.

## Public API v1

- `GET /api/public/v1/chapters` and `GET /api/public/v1/verses/:chapterId`
  are open (content only).
- Family, progress and plan endpoints require `X-Api-Key`. Keys are hashed,
  scoped and rate limited. Webhooks sign payloads with the key's secret.
