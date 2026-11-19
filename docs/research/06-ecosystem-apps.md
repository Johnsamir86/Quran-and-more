# Ecosystem apps we learn from (surveyed 2026-11-12)

What each app does, what we replicate, and what needs login or licensed
content. Items marked *(unverified)* could not be confirmed from a primary source.

| App | What it is | What we replicate | Needs login / licence |
|---|---|---|---|
| Quranlingo (quranlingo.app) | Gamified Quran learning: stage map by surah, fill-blank / order-verse / matching / meaning-match with transliteration, spaced repetition of missed ayahs, XP, streaks, badges, daily challenge, parent dashboard, "for schools" | `/learn`: lessons per surah from the word-by-word data (meaning, word, hidden word, order), XP and levels, streaks, per-profile progress in the family store | Parent dashboard across devices needs accounts; their word illustrations are their own asset |
| Quran.ai / Quran.org Labs | Select an ayah, ask, get fully cited answers via the Quran MCP server inside ChatGPT/Claude; Labs: Quran Spaces (live study rooms), Media Generator (ayah images/videos), Quran App Store, Quran ID SSO | `/ask`: retrieval over the Search API + tafsir, verbatim citations, "pending scholarly review" label, report button; optional model answer with a verbatim guard | A language-model key (`ANTHROPIC_API_KEY`); Quran ID for the App Store listing |
| Qariah (qariah.app) | Women reciters only, 60+ reciters, several riwayat, offline, follow-along, reflections, Quran.com login; built on the open-source Bayaan project | Reciter directory by riwayah, loop/autoplay/offline UX; female-only visibility rule already in profiles | Their audio catalogue is not redistributable; needs a licence or their partnership |
| Tasmi (tasmi.cloud) | Hifz companion, no microphone: read/recite sets with peek, self-grading (forgot 10 min, hard 1 d, good 4 d, easy 9 d), Tasmi method (8 stages), 6446 and 3×3 methods, weekday plans | `/hifz`: hide/peek, self-grading with spaced review, repeat counter for 6446, optional browser speech check scored word by word | None (sync needs login) |
| Tazkiya (tazkiya.chat) | Guided ayah-by-ayah journey (Understand / Apply), colour-coded source tiers, citations, report button, daily wird, QuranReflect feed | Source tiers and report button on `/ask`; guided journey later | AI credits and Quran ID; Bridges translation is licensed |
| QuranArena (quranarena.ca) | Room-code multiplayer quizzes: next-ayah, word meaning, fill blank, trivia; scope by juz/surah; flashcards; memorisation tester; progress | `/play`: which surah, next ayah, missing word, which juz; scope by Juz Amma / short surahs / whole Quran; speed scoring; family leaderboard | Rooms/friends need accounts (later) |
| Quran Link (quran.link) | Word tap → all occurrences + dictionaries, side-by-side translations/tafsirs, favourites with topic tags, notes, planner, car mode | `/study/<key>`: word-by-word with occurrence search, up to three tafsirs side by side, translations, surah info; `/v/<key>` share links with a preview image | Their dictionaries are licensed |
| QuranReflect (quranreflect.com) | Reflections per ayah, lessons (teachers) vs reflections, groups/pages, verified review, likes/comments | Reflections panel on the study page (reads via the gateway with `content.reflections.read` / `post.read`); family-private reflections = our notes | Posting and personal feeds need Quran ID and `post.*` scopes |
| tafsir.app (Nuqayah) | Arabic research reader: 45+ tafsirs, asbab al-nuzul, qira'at, i'rab, lexicons, several riwayat as text and page images | Tafsir compare on the study page over the 20 API tafsirs; more sources via QUL later | Nuqayah/turath digitised editions carry their own terms |

Corrections to earlier assumptions: Tasmi is self-graded, not microphone based;
quran.link has no public verse-URL or image feature today (our `/v/<key>` is our own);
QuranArena's multiplayer needs accounts, so we start with solo modes.

## Search API coverage (api-docs.quran.foundation/docs/search_apis_versioned/1.0.0)

`GET /search/api/v1/search` with `query`, `mode=quick|advanced`, `page`, `size`,
`translation_ids`, `exact_matches_only`; response `result.navigation[]` (surah /
juz / page / ayah hits), `result.verses[]`, `pagination`. Implemented in
`apps/web/src/lib/search-api.ts` and exposed as `/api/public/v1/search`; verse
text and translations are hydrated from the content source so results stay
verbatim. The open v4 `search?q=` is the fallback when the gateway is unavailable.
