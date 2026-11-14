# Content transparency and review

Status: **review pending**. The app shows this honestly in the Sources sheet
(Ask, Study, Story, Me) until a reviewer exists.

What the app guarantees today
- Quran text and audio come from the Quran Foundation API and the named
  archive sources; the app never edits the Arabic text.
- Translations, tafsir and word meanings are shown with their author/resource
  name from the Quran.com catalogue.
- AI answers (Ask) are restricted mode: built only from retrieved ayat and
  tafsir, Arabic quoted verbatim (a guard strips any quotation not present in
  the sources), no fatwa, with a "report" action on every answer.
- Prayer times are computed with the published method of the user's country;
  the azan page says to confirm with the local mosque.

When a reviewer is named
1. Add them to `REVIEWERS` in `packages/core/src/sources.ts` (name, credential, date).
2. The badge switches from "review pending" to "reviewed on <date>" with their name.
3. Keep a changelog of reviewed selections in this file.
