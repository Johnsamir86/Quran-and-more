# Master feature matrix for the unified family Quran app

Deduplicated from all 24 apps plus Quran.com. "API" says whether the Quran
Foundation API already supplies the data; "Build" is our own work.

## 1. Reading
| Feature | Seen in | API support |
|---|---|---|
| Mushaf page view (Madani 15/16-line, IndoPak, Tajweed colouring) | Quran.com, Quran iOS/Android, Mehrab, Tafsir App | yes: `verses/by_page`, `code_v2` glyphs, `text_uthmani_tajweed`, word line numbers |
| Translation / book-style reading mode | Quran.com, Quran iOS | yes: 100+ translations |
| Word-by-word translation, transliteration, tap-to-hear | Quran.com, Maani, Nahw | yes: `words=true`, `audio_url` |
| Multiple scripts (Uthmani, Imlaei, IndoPak) | Quran Caption, Qurannotate | yes |
| Surah intro, revelation context, Read in Context | Quran.com, Tafsir App | yes: `chapters/{id}/info` |
| Pin and compare verses | Quran.com | build |
| Verse of the Day / Week, Duas, Ayat al-Kursi quick links | Quran.com, Quran Kareem | partial (`verses/random`) + curated lists |
| Dark/night/sepia themes, font scaling, large print | all | build |
| 19+ UI languages, RTL | Quran.com, Mehrab | i18n build; content from API |

## 2. Listening
| Feature | Seen in | API support |
|---|---|---|
| Reciter library with styles (murattal/mujawwad) and riwayat | Quran Audio, Mehrab | yes: `resources/chapter_reciters`, `recitation_styles` |
| Gapless per-ayah playback with text highlight | Quran Audio, Quran.com | yes: per-ayah mp3 + word timestamps |
| Repeat verse / range, repeat counts, pauses between verses, speed | Quran iOS (1–100x), Tasmi | build on top of segments |
| Playlists, favourites, sleep timer with fade | Quran Audio | build |
| Offline downloads, background play, lock-screen, CarPlay/Android Auto | Quran Audio, Mehrab | build (PWA/native) |
| Women reciters | Qariah | not in QF catalogue; licence needed |
| Quran Radio | Quran.com, Mehrab | stream endpoints exist on quran.com |
| Khatma by listening time | Quran Audio | build (activity days) |

## 3. Memorization (hifz)
| Feature | Seen in | API support |
|---|---|---|
| Staged methods (8-stage, 6446, 3x3) | Tasmi | build |
| Hidden-word recall, blank-ayah tests, next-ayah quiz | Mehrab, QuranArena | build |
| Spaced repetition review deck | Tasmi | build (store in app-state API) |
| Memorization plans paced by weekday + reminders | Tasmi, Mehrab | build (goals API) |
| AI tajweed / pronunciation feedback | Mehrab, QuranLingo, Tarteel | external speech model needed |
| Recite-in-prayer tracking | Tasmi | build |
| Mastery visualisation (heart grid per surah) | Mehrab | build |

## 4. Learning and Arabic
| Feature | Seen in | API support |
|---|---|---|
| Learning Plans / courses with progress | Quran.com | no public API; build own |
| Quran in a Year schedule | Quran.com | build |
| Grammar (i'rab) per word, roots, morphology | Nahw, Maani, Corpus | partial (word fields); Corpus data separately |
| Tajweed rules lessons with makharij diagrams | Mehrab | build / content |
| Gamified vocabulary games (match, puzzle, runner) | QuranLingo | build |
| Live teacher 1:1 and study circles | Mehrab, Quran Space | build (WebRTC) |

## 5. Tafsir and study
| Feature | Seen in | API support |
|---|---|---|
| Multiple tafsirs, side-by-side compare | Tafsir App, ReadTafsir, Quran Link | yes: `tafsirs/{id}/by_ayah` |
| Related hadith per ayah | Quran.com, Sunnah.com | yes: hadith references (`content.hadith.read`) |
| Answers (scholar Q&A) per ayah | Quran.com | yes: `answers` |
| Qira'at readings and junctures | Quran.com, Tafsir App | production only, `qiraat` scope |
| Asbab al-nuzul, dictionaries, root index | Tafsir App, Maani | not in QF API |
| Semantic search / Ask the Quran with citations | Maani, Tazkiya, Quran MCP | `search` scope (pending) + Quran MCP |

## 6. Notes, reflection, personal data
| Feature | Seen in | API support |
|---|---|---|
| Ayah notes, archive/restore, PDF export | Quran.com | yes: notes API |
| Rich notes with verse/hadith embeds | Qirtaas, Qurannotate | build editor; data via API |
| Collections, tags, named reading bookmarks | Quran.com, Quran Kareem | yes: collections, bookmarks, reading bookmarks |
| Goals, streaks, reading history calendar | Quran.com, all | yes: goals, streaks, activity days |
| Cross-device sync, offline-first | Quran.com | yes: sync + app-state APIs |

## 7. Social and community
| Feature | Seen in | API support |
|---|---|---|
| Reflections feed, six reactions, Re-Reflect, follow | QuranReflect | yes: quranReflect posts/comments/users |
| Groups, closed groups, pages | QuranReflect | yes: rooms API |
| Leaderboards, family/friends league | Mehrab, Maani, QuranLingo | build |
| Study buddies, shared bookmarks | Nahw | build |

## 8. Media and sharing
| Feature | Seen in | API support |
|---|---|---|
| Verse image generation | Quran Media Maker, Quran Audio | yes: `media.shareVerse` (user) |
| Recitation video with word-timed captions | Quran Caption, Media Maker | timestamps API + build renderer |
| Deep links that reopen the same view | Quran.com | build |

## 9. Kids, family, schools
| Feature | Seen in | API support |
|---|---|---|
| Child profiles, parent dashboard, nudges | QuranLingo | build (one QF account per person) |
| Teacher assignments: lesson / revision / review, word-level mistakes | QuranPortal | build |
| Qaidah (Noorani) tracking | QuranPortal | build + content |
| Daily parent email summaries | QuranPortal | build |
| Senior mode: large print, high contrast, audio-first | none well served | build |

## 10. AI
Grounded Q&A with citations (Maani), tajweed feedback (Mehrab), grammar
(Nahw), notes summary (Qurannotate), subtitle alignment (Quran Caption),
offline voice search (Quran Audio). All require an external model; the
Quran MCP server can ground retrieval.
