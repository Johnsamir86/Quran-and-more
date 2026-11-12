/**
 * Restricted mode for AI creations.
 *
 * Rule: AI may design (layouts, backgrounds, captions styling, explanations
 * grounded in scholar-reviewed sources) but may never alter the Quranic
 * text, its translation, its audio or its meaning. The verse text that ends up
 * in any artifact must be byte-for-byte the text served by the Quran
 * Foundation API after Unicode normalisation.
 */
export const RESTRICTED_MODE_POLICY = {
  mayGenerate: [
    "visual layout, colours, typography choices, background images or video",
    "caption timing and placement derived from official word timestamps",
    "titles, hashtags and descriptions that do not quote or paraphrase ayat",
    "explanations that quote scholar-reviewed tafsir with citations",
  ],
  mayNever: [
    "rewrite, shorten, reorder or 'improve' any ayah, word or diacritic",
    "produce its own translation of an ayah",
    "synthesise or clone a reciter's voice; audio comes only from the official reciter files",
    "answer religious questions from sources that are not scholar-reviewed",
  ],
} as const;

const normalise = (s: string): string =>
  s.normalize("NFC")
    .replace(/[​-‏‪-‮﻿]/g, "") // zero-width and bidi marks
    .replace(/\s+/g, " ")
    .trim();

export class RestrictedModeViolation extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RestrictedModeViolation";
  }
}

/**
 * Throws if `candidate` is not exactly the official text. Use it before
 * rendering any AI-produced artifact that includes Quranic text.
 */
export const assertVerbatimQuran = (official: string, candidate: string): void => {
  if (normalise(official) !== normalise(candidate)) {
    throw new RestrictedModeViolation("Quranic text in the AI output differs from the official text.");
  }
};

/** Return true when every official verse appears verbatim inside the output. */
export const outputContainsAllVersesVerbatim = (officialVerses: string[], output: string): boolean => {
  const haystack = normalise(output);
  return officialVerses.every((v) => haystack.includes(normalise(v)));
};

/** Sources the AI may cite. Only scholar-reviewed material. */
export const SCHOLAR_REVIEWED_SOURCES = {
  tafsirSlugs: [
    "ar-tafsir-ibn-kathir", "ar-tafsir-muyassar", "ar-tafsir-al-saddi",
    "ar-tafseer-al-qurtubi", "ar-tafseer-al-tabari", "ar-tafsir-al-baghawi",
    "ar-tafsir-jalalayn", "en-tafisr-ibn-kathir", "en-tafsir-maarif-ul-quran",
    "en-al-jalalayn", "ar-tafsir-al-wasit",
  ],
  /** Quran.com "Answers" are scholar reviewed. */
  answers: true,
  /** QuranReflect posts count only when the author is a verified scholar. */
  quranReflectVerifiedOnly: true,
} as const;
