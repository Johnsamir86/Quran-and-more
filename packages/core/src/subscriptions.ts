/**
 * Freemium tiers. Features are gated by key, never by role, so the same gate
 * works on web (Stripe) and in the stores (RevenueCat).
 */
export type TierId = "free" | "plus" | "family" | "madrasah";

export type FeatureKey =
  | "reader.core"            // mushaf, translations, word-by-word, audio streaming
  | "reader.all_layouts"     // every mushaf layout
  | "offline.text"           // offline Quran text + translations
  | "audio.playlists"
  | "audio.sleep_timer"
  | "study.tafsir_multi"     // compare several tafsirs side by side
  | "study.hadith"
  | "study.answers"
  | "notes.rich"             // rich notes with verse/hadith embeds
  | "notes.pdf_export"
  | "memorize.basic"         // hidden-word and next-ayah tests
  | "memorize.spaced"        // spaced-repetition deck + plans
  | "memorize.speech"        // Arabic speech recognition alignment
  | "learn.plans"            // learning plans (Arabic first)
  | "learn.arabic"           // grammar and vocabulary
  | "play.games"             // entertaining tab: games, quizzes, leaderboards
  | "social.reflect"         // QuranReflect posting and reactions
  | "media.share_image"
  | "media.ai_creations"     // AI visuals/captions in restricted mode
  | "ai.ask"                 // scholar-grounded Q&A
  | "ai.model_choice"
  | "family.profiles"        // child sub-profiles
  | "family.progress"        // parent dashboard, goals, limits
  | "madrasah.classes"       // teacher assignments, mistake marking, parent emails
  | "tv.apps"
  | "api.access";            // public API keys for integrations

export interface Tier {
  id: TierId;
  name: string;
  monthlyUsd: number;
  maxProfiles: number;
  features: FeatureKey[];
}

// Decision of 16 Nov 2026: free is the mushaf and the player with three reciters, one translation and
// one tafsir at a time; everything else is Plus.
const FREE: FeatureKey[] = ["reader.core", "offline.text"];

const PLUS: FeatureKey[] = [
  ...FREE, "reader.all_layouts", "audio.playlists", "audio.sleep_timer", "study.hadith", "study.answers",
  "study.tafsir_multi", "notes.rich", "notes.pdf_export", "memorize.basic", "memorize.spaced",
  "memorize.speech", "learn.plans", "learn.arabic", "play.games", "social.reflect", "media.share_image", "media.ai_creations",
  "ai.ask", "family.profiles", "tv.apps",
];

const FAMILY: FeatureKey[] = [...PLUS, "family.progress", "ai.model_choice"];

const MADRASAH: FeatureKey[] = [...FAMILY, "madrasah.classes", "api.access"];

export const TIERS: Record<TierId, Tier> = {
  free: { id: "free", name: "Free", monthlyUsd: 0, maxProfiles: 2, features: FREE },
  plus: { id: "plus", name: "Plus", monthlyUsd: 1.99, maxProfiles: 8, features: PLUS },
  family: { id: "family", name: "Family", monthlyUsd: 9.99, maxProfiles: 8, features: FAMILY },
  madrasah: { id: "madrasah", name: "Madrasah", monthlyUsd: 29.99, maxProfiles: 500, features: MADRASAH },
};

export const hasFeature = (tier: TierId, feature: FeatureKey): boolean =>
  TIERS[tier].features.includes(feature);

/** Lowest tier that unlocks a feature, for upgrade prompts. */
export const tierFor = (feature: FeatureKey): TierId =>
  (["free", "plus", "family", "madrasah"] as TierId[]).find((t) => hasFeature(t, feature)) ?? "madrasah";

/* ---------- Plus (the single paid bundle in the apps) ---------- */
export const PLUS_PRICE = { monthlyUsd: 1.99, yearlyUsd: 14.99, lifetimeUsd: 29.99 } as const;
/** Store product ids (RevenueCat offering "plus"). */
export const PLUS_PRODUCT_IDS = { monthly: "offline_audio_monthly", yearly: "offline_audio_yearly", lifetime: "plus_lifetime" } as const;
/** What a locked screen is about, for the paywall headline. */
export type PlusFeature = "reciters" | "wallpapers" | "story" | "video" | "ask" | "hifz" | "learn" | "play" | "family" | "azan" | "worship" | "names" | "offline" | "tafsirMulti" | "tv";
/** The three reciters in the free tier: Mishari al-Afasy, Mahmoud Khalil al-Husary (murattal), Abdul Basit (murattal). */
export const FREE_RECITER_IDS: readonly string[] = ["c7", "c6", "c2"];
export const FREE_CHAPTER_RECITER_IDS: readonly number[] = [7, 6, 2];
export const isFreeReciter = (r: { id?: string | null; chapterReciterId?: number | null; recitationId?: number | null; source?: string | null }): boolean => {
  if (r.source && r.source !== "qf") return false;
  if (r.id && FREE_RECITER_IDS.includes(r.id)) return true;
  if (r.chapterReciterId != null && FREE_CHAPTER_RECITER_IDS.includes(r.chapterReciterId)) return true;
  return r.recitationId != null && r.chapterReciterId == null && FREE_CHAPTER_RECITER_IDS.includes(r.recitationId);
};
