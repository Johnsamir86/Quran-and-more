# Quran Foundation API — verified findings (2026-11-12)

Everything below was verified against the live prelive environment with this
project's client, unless marked *docs only*.

## Environments

| | Prelive (sandbox) | Production |
|---|---|---|
| OAuth2 server | `https://prelive-oauth2.quran.foundation` | `https://oauth2.quran.foundation` |
| API gateway | `https://apis-prelive.quran.foundation` | `https://apis.quran.foundation` |
| Content base path | `/content/api/v4/...` | same |
| User APIs base path | `/auth/v1/...` | same |
| QuranReflect | `/quran-reflect/v1/...` | same |
| Dataset | **Only Surah 1 and 2**, 14 translations, 2 reciters | full |

Tokens are environment-bound. A prelive token is rejected by production.

## Auth

**Content (app-level), client credentials, server-side only**

```
POST {oauth2}/oauth2/token
Authorization: Basic base64(client_id:client_secret)
Content-Type: application/x-www-form-urlencoded
grant_type=client_credentials&scope=content.quran.read content.translations.read ...
```

- This client is on the **granular scope policy**. Requesting the legacy
  umbrella scope `content` returns `invalid_scope`.
- Scopes granted to our prelive client (verified): `content.quran.read`,
  `content.translations.read`, `content.tafsirs.read`, `content.audio.read`,
  `content.metadata.read`, `content.hadith.read`, `content.answers.read`,
  `content.sync.read`, `content.reflections.read`, `post.read`, `comment.read`.
- **Not granted**: `search`, `analytics.events.write`, `qiraat`. Search must be
  requested separately from Quran Foundation.
- Token lifetime 3600 s, no refresh token. Cache and refresh ~30 s before expiry.
- Every API call sends `x-auth-token: <access_token>` and `x-client-id: <client_id>`.
- If the token endpoint returns 403 `error code: 1010`, set a custom `User-Agent`.

**User data, Authorization Code + PKCE (OIDC)**

- `GET {oauth2}/oauth2/auth` with `response_type=code`, `client_id`,
  `redirect_uri` (must match registered URI exactly), `scope`, `state`,
  `nonce`, `code_challenge`, `code_challenge_method=S256`.
- `POST {oauth2}/oauth2/token` with `grant_type=authorization_code` (+ Basic
  auth for confidential clients). Refresh with `grant_type=refresh_token`
  (needs `offline_access`).
- User scopes: `openid offline_access user bookmark collection note
  reading_session preference activity_day goal streak post comment room tag
  app_state sync`. Request only approved parent scopes.
- Use the `id_token` `sub` claim as the stable user key, never email.
- Account deletion arrives as a signed `user.deleted` webhook.
- The starter already implements this flow (`/api/auth/start`, `/callback`,
  `/api/session/refresh`, `/api/auth/logout`).

## Content API surface (SDK `client.content.v4`)

| Group | Methods | Notes |
|---|---|---|
| chapters | list, get, getInfo | `?language=ar` localises names; `chapters/{id}/info` returns surah intro HTML |
| verses | byChapter, byPage, byJuz, byHizb, byRub, byRange, byKey, random | params: `words`, `translations`, `tafsirs`, `audio` (reciter id), `fields` (`text_uthmani`, `text_indopak`, `text_imlaei`, `text_uthmani_tajweed`, `code_v1`, `code_v2`), `word_fields`, `per_page`, `page`, `mushaf` |
| juzs | list | verse mapping per juz |
| resources | languages, translations, tafsirs, recitations, chapterReciters, recitationStyles, chapterInfos, verseMedia | catalogue endpoints |
| audio | chapterRecitation (full-surah mp3 + duration), verseRecitation.byChapter / byKey (per-ayah segments) | timestamps endpoint gives ms ranges for text-audio sync |
| tafsirs | `tafsirs/{id}/by_ayah/{key}` | HTML text |
| answers | byAyah, get, countWithinRange | Quran.com "Answers" Q&A |
| hadithReferences | byAyah, hadithsByAyah | related hadith per ayah |
| qiraat | readers, readings, transmitters, junctures, matrix | production only, needs `qiraat` scope |

Word-by-word: each word has `text_uthmani`, `translation`, `transliteration`,
`audio_url` (relative to `https://audio.qurancdn.com/`), `line_number`,
`page_number` (enables true mushaf page layout).

Per-ayah audio URLs are relative to `https://verses.quran.foundation/`.
Full-surah files come from `https://download.quranicaudio.com/qdc/...`.

## User API surface (SDK `client.auth.v1`, needs user session)

bookmarks, collections, notes (incl. publish-as-reflection, PDF export),
readingSessions, readingBookmarks (3 named slots), goals (create, estimate,
getTodaysPlan), streaks, activityDays (reading-time estimates), preferences
(bulk sync of reader settings), appState (document store + change feed),
sync (push/pull mutations for offline-first), media.shareVerse (verse image
generation), users.connectedApps.

## QuranReflect (SDK `client.quranReflect.v1`)

posts (feed, related, byVerse, create, like, react, save, re-reflect, report),
comments (CRUD, like, hide, report), rooms/groups (create, join, invite,
approve, follow pages), users (profile, follow, followers), tags, trending
hashtags, explore. Public reads need `post.read` / `comment.read` app token;
writes need a user session.

## Other product APIs

- **Search**: `client.search.v1.query` — needs the `search` scope (not yet granted).
- **Analytics**: `client.analytics.v1.events.submit` — needs `analytics.events.write`.
- **Quran MCP** (`mcp.quran.ai`, github.com/quran/quran-mcp): semantic
  search and retrieval over verified text, translations, tafsir, morphology.
- Quran Media Maker and Learning Plans have no public API in the docs.

## Rules to respect

- Keep `CLIENT_SECRET` server-side only. Never ship it in a browser or mobile bundle.
- Add `<meta name="google" content="notranslate">` and `translate="no"` on
  Quranic text so browsers never machine-translate it.
- 429 → retry with bounded exponential backoff and jitter.
- Support: developers@quran.com

## Open source references

- quran/quran.com-frontend-next (web), quran/quran_android, quran/quran-ios,
  quran/api-js (this SDK), quran/quran-mcp, quran/audio.quran.com
