# Quran Foundation / Quran.com developer inventory (verified 2026-11-12)

Everything a developer can use from the Quran Foundation (QF) ecosystem,
checked live against the APIs, OpenAPI specs, CDNs and package registries.
Items marked *(unverified)* could not be confirmed.

## 1. Environments, auth, headers

| Item | Value |
|---|---|
| Docs | https://api-docs.quran.foundation/ (llms.txt: https://api-docs.quran.foundation/llms.txt) |
| Developer Console | https://dev-console.quran.foundation/projects ; request production access: https://api-docs.quran.foundation/request-access/ |
| Content API | prod `https://apis.quran.foundation/content/api/v4` ; prelive `https://apis-prelive.quran.foundation/content/api/v4` |
| User APIs | prod `https://apis.quran.foundation/auth/v1/...` ; prelive `https://apis-prelive.quran.foundation/auth/v1/...` |
| QuranReflect reads | `https://apis.quran.foundation/content/quran-reflect/v1/...` |
| Search | `https://apis.quran.foundation/search/api/v1/search` (scope `search`, extra console permission) |
| Analytics | `POST https://apis.quran.foundation/analytics/v1/events:batch` (scope `analytics.events.write`) |
| OAuth2 | prod `https://oauth2.quran.foundation` ; prelive `https://prelive-oauth2.quran.foundation` (`/oauth2/token`, `/oauth2/auth`, `/userinfo`, `/oauth2/introspect`, `/oauth2/revoke`, `/oauth2/sessions/logout`) |
| Headers | `x-auth-token: <access token>` + `x-client-id: <client id>` on every call |
| Tokens | client_credentials (backend) or PKCE (public/mobile); TTL 3600 s |
| Errors | 400 invalid_request, 401, 403, 404, 422, 429 rate_limit_exceeded (no numeric limits published) |
| OpenAPI specs | content v4 https://api-docs.quran.foundation/openAPI/content/v4.json (106 paths) ; user v1 https://api-docs.quran.foundation/openAPI/user-related-apis/v1.json (107 paths) ; prelive user https://api-docs.quran.foundation/openAPI/user-related-apis/pre-live/v1.json ; oauth2 .../openAPI/oauth2-apis/v1.json ; search .../openAPI/search/v1.json ; analytics .../openAPI/analytics/v1.json |

### Scopes
- Granular content (new backend apps): `content.quran.read`, `content.translations.read`, `content.tafsirs.read`, `content.audio.read`, `content.hadith.read`, `content.metadata.read`, `content.sync.read`, `content.answers.read`, `content.reflections.read`. Legacy `content` is not issued to new clients.
- `qiraat.read` (production only), `search`, `analytics.events.write`.
- User: `openid`, `offline_access`, `bookmark.*`, `collection.*`, `reading_session.*`, `preference.*`, `activity_day.*`, `goal.*`, `streak.*`, `user.*`, `note.*`, `app_state.*`, `sync`; QuranReflect `post.*`, `comment.*`, `room.*`, `tag.read`.
- Browser/mobile clients get no content scope: content must be proxied by our backend (which is what `apps/web` does).

## 2. Content API v4, complete path list

Common verse params: `language` (word-by-word language), `words`, `translations` (ids; `57` = transliteration), `audio` (ayah recitation id), `tafsirs`, `word_fields`, `translation_fields`, `tafsir_fields`, `fields`, `page`, `per_page` (max 50 on QF; legacy host accepts 300). `mushaf` applies to `/verses/by_page`, `/pages`, `/pages/lookup`, `/juzs`.

| Group | Endpoints |
|---|---|
| Chapters | `/chapters`, `/chapters/{id}`, `/chapters/{id}/info?language=&resource_id=&include_resources=true` |
| Verses | `/verses/by_chapter|by_page|by_juz|by_hizb|by_rub_el_hizb|by_manzil|by_ruku/{n}`, `/verses/by_range?from=&to=`, `/verses/by_key/{s:a}`, `/verses/random?chapter_number|page_number|juz_number|...` |
| Scripts | `/quran/verses/{uthmani|uthmani_simple|uthmani_tajweed|imlaei|indopak|indopak_nastaleeq|code_v1|code_v2}`; `/quran/translations/{id}`; `/quran/tafsirs/{id}`; `/quran/recitations/{id}` |
| Translations / tafsirs | `/translations/{id}/by_chapter|by_page|by_juz|by_hizb|by_rub_el_hizb|by_manzil|by_ruku/{n}`, `/translations/{id}/by_ayah/{key}`, `/foot_notes/{id}`; same shapes under `/tafsirs/{id}/...` (grouped by `group_verse_key_from/to`) |
| Audio, ayah by ayah | `/resources/recitations`, `/resources/recitation_styles`, `/recitations/{id}/by_chapter|by_juz|by_page|by_hizb|by_rub_el_hizb|by_manzil|by_ruku/{n}`, `/recitations/{id}/by_ayah/{key}`; `url` is relative to `https://verses.quran.foundation/` |
| Audio, gapless surah | `/resources/chapter_reciters`, `/chapter_recitations/{reciter}`, `/chapter_recitations/{reciter}/{chapter}?segments=true` (verse timings + `[word_index,start_ms,end_ms]`), `/audio/reciters/{id}/timestamp?verse_key=&word_from=&word_to=`, `/audio/reciters/{id}/lookup?chapter_number=&timestamp=` |
| Resources | `/resources/translations`, `/resources/translations/{id}/info`, `/resources/tafsirs`, `/resources/tafsirs/{id}/info`, `/resources/recitations/{id}/info`, `/resources/languages`, `/resources/chapter_infos`, `/resources/verse_media`, `/resources/sync`, `/resources/snapshots/{group}/{id}` |
| Structure | `/juzs`, `/hizbs`, `/rub_el_hizbs`, `/rukus`, `/manzils`, `/pages?mushaf=`, `/pages/{n}`, `/pages/lookup?mushaf=&chapter_number|juz_number|...` |
| Hadith (sunnah.com) | `/hadith_references/by_ayah/{key}`, `/hadith_references/by_ayah/{key}/hadiths`, `/hadith_references/count_within_range` (scope `content.hadith.read`) |
| Answers | `/answers/by_ayah/{key}`, `/answers/{id}`, `/answers/count_within_range` (scope `content.answers.read`) |
| QuranReflect reads | `/quran-reflect/v1/posts/feed?tab=&languages=&filter[references][0][chapterId]=&filter[postTypeIds]=1|2&...`, `/posts/{id}`, `/posts/user-posts/{id}`, `/posts/{id}/comments` |
| Qira'at (prod only) | `/qiraat/readers`, `/qiraat/transmitters`, `/qiraat/junctures/by_verse/{key}`, `/qiraat/junctures/by_chapter/{n}`, `/qiraat/readings/{id}`, `/qiraat/matrix/by_verse/{key}` |
| Content Sync (offline) | `/resources/sync?resources=translations:131;tafsirs:169&bootstrap=true` then `?sync_token=`; groups `quran_core`, `mushafs`, `translations`, `word_by_word_translations`, `word_by_word_transliterations`, `tafsirs`, `recitations`, `chapter_recitations`. The only permitted way to keep an offline copy; resync at least every 7 days |

Field names: `fields` = `text_uthmani, text_uthmani_simple, text_uthmani_tajweed, text_imlaei, text_imlaei_simple, text_indopak, text_indopak_nastaleeq, text_qpc_hafs, text_qpc_nastaleeq_hafs, text_qpc_nastaleeq, image_url, code_v1, code_v2, page_number, v1_page, v2_page`; `word_fields` adds `line_number, line_v1, line_v2, location, verse_key` (plus `audio_url`, `translation`, `transliteration`, `char_type_name` always present).

Mushaf ids (font tutorial): **1 = QCF V2** (`code_v2`), **2 = QCF V1** (`code_v1`), **19 = QCF V4 tajweed**, 4 = Uthmani text, 5 = QPC Hafs (UthmanicHafs font), 3/6/7 = IndoPak Nastaleeq variants. Fonts: `https://verses.quran.foundation/fonts/quran/hafs/{v1,v2}/woff2/p{1..604}.woff2`, `.../hafs/v4/colrv1/woff2/p{n}.woff2`, `.../hafs/v4/ot-svg/{light,dark,sepia}/woff2/p{n}.woff2`, `.../hafs/uthmanic_hafs/UthmanicHafs1Ver18.woff2`, `.../hafs/nastaleeq/indopak/indopak-nastaleeq-waqf-lazim-v4.2.1.woff2`, `.../surah-names/v1/sura_names.woff2`.

## 3. User APIs v1 (user JWT)

| Group | Endpoints |
|---|---|
| Bookmarks | `GET/POST /v1/bookmarks` (`type=page|juz|surah|ayah`, `key`, `verseNumber`, `mushafId`), `DELETE /v1/bookmarks/{id}`, `/v1/bookmarks/ayahs-range`, `/v1/bookmarks/collections`; named slots `GET/POST /v1/reading-bookmarks`, `PATCH/DELETE /v1/reading-bookmarks/{slot}` |
| Collections | `GET/POST /v1/collections`, `/v1/collections/all`, `/v1/collections/{id}`, `/v1/collections/{id}/bookmarks` |
| Notes | `GET/POST /v1/notes` (`ranges[]`, `saveToQR`), `/v1/notes/by-verse/{key}`, `/by-range`, `/count-within-range`, `GET/PATCH/DELETE /v1/notes/{id}`, `POST /v1/notes/{id}/publish` |
| Goals | `POST /v1/goals` (`QURAN_PAGES|QURAN_TIME|QURAN_RANGE`, `amount`, `duration`), `PUT/DELETE /v1/goals/{id}`, `/v1/goals/get-todays-plan`, `/v1/goals/estimate` |
| Streaks | `/v1/streaks`, `/v1/streaks/current-streak-days` |
| Reading sessions / activity days | `POST/GET /v1/reading-sessions`; `POST/GET /v1/activity-days`, `/v1/activity-days/estimate-reading-time` |
| Preferences | `GET/POST /v1/preferences` (`group ∈ tafsirs, translations, audio, theme, quranReaderStyles, reading, language`), `/v1/preferences/bulk` |
| App State | `/v1/app-state:config`, `:bootstrap`, `:changes?since=`, `GET/PUT/DELETE /v1/app-state/{collection}/{key}` |
| Sync | `GET/POST /v1/sync` |
| Media | `POST /media/share-verse` (`verseKey`, `endVerseKey`, `locale`, `translations[]`) |
| Users | `/v1/users/profile`, `/v1/users/{id}`, `/search`, followers/following, connected apps |
| QuranReflect | posts (feed, by-verse, create, like, save, report, export), comments, rooms (28 endpoints), tags, trending hashtags |

Search: `GET /api/v1/search?query=&mode=quick|advanced&translation_ids=&exact_matches_only=1&page=&size=`.

## 4. Legacy open host (what `CONTENT_SOURCE=qdc` uses)

`https://api.quran.com/api/v4/*` and `https://api.qurancdn.com/api/v4/*` answer without credentials with the full dataset (same shapes as QF v4). No rate-limit headers and no published limits or sunset date; origin header labels it "legacy". `https://api.qurancdn.com/api/qdc/*` is what quran.com's own frontend calls (adds `/audio/reciters?locale=`, `/pages/lookup`, `/resources/word_by_word_translations`, `/verses/advanced_copy`, `/navigate`). Not on the legacy host: `/pages`, `/pages/lookup`, `/foot_notes`, hadith, answers, qira'at, sync, reflect. We treat it as the dev/bridge source and switch to the QF gateway (`CONTENT_SOURCE=qf`) when production credentials arrive.

## 5. SDKs and tools

| Tool | Details |
|---|---|
| `@quranjs/api` 3.17.2 | https://github.com/quran/api-js ; `@quranjs/api/server` (client credentials, SSR), `@quranjs/api/public` (PKCE); `contentScopeMode: "granular"` since 3.17 |
| `@quranjs/create-app` 0.3.0 | templates `next`, `sveltekit`; `skills list|get quranjs|get oauth`; `doctor` |
| `quran-foundation-api` 0.12.1 (PyPI) | `from quran_foundation import QuranClient` ; chapters, verses, audio, resources, search, answers, hadith, user APIs |
| MCP | https://github.com/quran/quran-mcp hosted at `https://mcp.quran.ai` (text in several qira'at, 50+ translations, 15+ tafsirs, search, morphology, page rendering) |
| npm utilities | `quran-meta` 7 (juz/hizb/page/ruku/manzil conversion, 8 riwayas), `quran-qcf4` (V4 fonts + page JSON) |
| Repos | quran_android, quran-ios / QuranEngine, quran.com-frontend-next, quran.com-images, audio.quran.com, mobile-sync, qursync-android, quran-tajweed, quran-oauth2-client-example, oauth2-react-native-client-example |

## 6. QUL, Quranic Universal Library (https://qul.tarteel.ai/resources, downloads only)

133 recitations (58 segmented, some letter level), 28 mushaf layouts, 26 fonts (incl. qira'at fonts and sign-language font), 204 translations (13 word by word), 115 tafsirs, 30 scripts, morphology for 77 432 words, 5 278 mutashabihat, 4 001 similar-ayah sets, 1 049 ayah themes, 3 158 topics, surah info in 9 languages. Licences vary; several entries are copyrighted with no download.

## 7. Audio hosts

| Host | Pattern |
|---|---|
| `https://verses.quran.foundation/` | `Alafasy/mp3/001001.mp3`, `wbw/001_001_001.mp3`, fonts under `/fonts/quran/...` (canonical) |
| `https://audio.qurancdn.com/`, `https://verses.quran.com/` | same relative paths (mirrors) |
| `https://download.quranicaudio.com/qdc/{reciter}/{style}/{surah}.mp3` | gapless files from `chapter_recitations` |
| `https://quranicaudio.com/api/qaris` | 177 reciters (self-host if used) |
| `https://everyayah.com/data/recitations.js` | 64 ayah-by-ayah folders |
| `https://static.qurancdn.com/images/w/rq-color/{s}/{a}/{w}.png` | word images |

## 8. Live catalogue counts

- Chapter (gapless) reciters: 14 (ids 1, 2, 3, 4, 5, 6, 7, 9, 10, 12, 97, 161, 168, 173). Ayah-by-ayah recitations: 12 (ids 1 to 12). Different id spaces; our player merges them into 16 rows.
- Translations: 126 across 70 language labels (english 9, urdu 8, turkish 5, bengali 4, ...). Ids: 131 Khattab, 20 Saheeh, 85 Abdel Haleem, 84 Usmani, 95 Maududi, 149 Bridges, 19 Pickthall, 57 transliteration.
- Tafsirs: 20 (arabic 16 Muyassar, 93 Wasit, 14 Ibn Kathir, 15 Tabari, 90 Qurtubi, 91 Sa'di, 94 Baghawi; english 169, 168, 817; bengali 381, 165, 166, 164; urdu 157, 160, 818, 159; russian 170; kurdish 804).
- Chapter infos: 5 resources. Verse media: 1 (Bayyinah).

## 9. Prelive vs production

| | Prelive | Production |
|---|---|---|
| Content | Surah 1 and 2 only | full |
| Credentials | immediate for backend apps | after access review |
| Qira'at | no | with `qiraat.read` |
| User APIs | full (106 paths) | 107 paths |

## 10. Gaps

No public Tarteel speech-recognition API (own ASR needed). sunnah.com key is a manual request (QF proxies it with `content.hadith.read`). Legacy host has no published limits or sunset. Mushaf ids beyond 1/2/3/4/5/6/7/19 are not documented (QUL layout ids exist).

## 11. Checklist for this app (status)

Done: direct v4 content layer, gapless with word highlight, all reciters, 126 translations, 20 tafsirs, word by word, mushaf layouts with QCF fonts, focus player, wallpapers, family profiles (local).

Next: `/audio/reciters/{id}/timestamp` for word-range repeat; `/pages/lookup` navigation (QF only); footnotes; chapter info; tajweed text mode; Quran ID login once scopes are enabled (bookmarks, collections, notes, goals, streaks, reading sessions, preferences, app state); search API; QuranReflect feed per ayah; Answers and Hadith per ayah; Content Sync offline; share-verse images; qira'at browser (production); QUL morphology / similar ayahs / mutashabihat as bundled sqlite; extra reciters self-hosted from quranicaudio / everyayah; Connected Apps listing and analytics events.
