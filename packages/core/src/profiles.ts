/**
 * Family model: one parent account (a Quran Foundation login) owns a family
 * with child sub-profiles. Teachers belong to a madrasah organisation and can
 * be linked to a child's profile so parents see madrasah progress.
 */
export type ProfileRole = "parent" | "child" | "adult" | "senior" | "teacher";

export type Gender = "male" | "female" | "unspecified";

/** Visual/interaction mode. Each mode is a full experience, not a cut-down one. */
export type UiMode = "kids" | "standard" | "senior" | "tv";

export type AgeBand = "0-6" | "7-12" | "13-17" | "18-59" | "60+";

export interface ProfileSettings {
  locale: string;
  uiMode: UiMode;
  /** mushaf layout id, see MUSHAF_LAYOUTS */
  mushafLayout: MushafLayoutId;
  translationIds: number[];
  tafsirIds: string[];
  reciterId: number;
  wordByWordLocale: string;
  fontScale: number; // 1 = default, senior mode defaults to 1.6
  highContrast: boolean;
  dailyLimitMinutes?: number; // parent-set screen limit for children
}

export interface Profile {
  id: string;
  familyId: string;
  role: ProfileRole;
  displayName: string;
  gender: Gender;
  ageBand: AgeBand;
  settings: ProfileSettings;
}

export const MUSHAF_LAYOUTS = [
  { id: "madani_15", label: "Madani 15 lines", mushafId: 1, lines: 15, script: "uthmani", font: "code_v1" },
  { id: "madani_16", label: "Madani 16 lines", mushafId: 2, lines: 16, script: "uthmani", font: "code_v2" },
  { id: "indopak_15", label: "IndoPak 15 lines", mushafId: 3, lines: 15, script: "indopak", font: "indopak" },
  { id: "indopak_16", label: "IndoPak 16 lines", mushafId: 4, lines: 16, script: "indopak", font: "indopak" },
  { id: "tajweed", label: "Tajweed (colour coded)", mushafId: 11, lines: 15, script: "uthmani_tajweed", font: "tajweed_v4" },
  { id: "kfgqpc_hafs", label: "KFGQPC Hafs", mushafId: 6, lines: 15, script: "uthmani", font: "qpc_hafs" },
  { id: "uthmani_text", label: "Plain Uthmani text (flow)", mushafId: 2, lines: 0, script: "uthmani", font: "text" },
] as const;

export type MushafLayoutId = (typeof MUSHAF_LAYOUTS)[number]["id"];

export const ageBandToUiMode = (band: AgeBand): UiMode => {
  switch (band) {
    case "0-6":
    case "7-12":
      return "kids";
    case "60+":
      return "senior";
    default:
      return "standard";
  }
};

export const defaultSettingsFor = (
  band: AgeBand,
  locale: string,
): ProfileSettings => {
  const uiMode = ageBandToUiMode(band);
  return {
    locale,
    uiMode,
    mushafLayout: uiMode === "kids" ? "uthmani_text" : "madani_15",
    translationIds: [],
    tafsirIds: [],
    reciterId: 7, // Mishari Rashid al-`Afasy
    wordByWordLocale: locale,
    fontScale: uiMode === "senior" ? 1.6 : uiMode === "kids" ? 1.3 : 1,
    highContrast: uiMode === "senior",
  };
};

/**
 * Reciter visibility rule (product decision): female reciters are shown to
 * female profiles only. Male reciters are shown to everyone.
 */
export interface ReciterLike {
  id: number;
  gender: Gender;
}

export const canProfileHearReciter = (profile: Pick<Profile, "gender">, reciter: ReciterLike): boolean =>
  reciter.gender !== "female" || profile.gender === "female";

export const filterRecitersForProfile = <T extends ReciterLike>(profile: Pick<Profile, "gender">, reciters: T[]): T[] =>
  reciters.filter((r) => canProfileHearReciter(profile, r));

/** Who may read a child's progress. */
export type ProgressViewerRole = "parent" | "teacher";

export const canViewProgress = (viewer: { role: ProfileRole; familyId?: string; madrasahId?: string }, child: { familyId: string; linkedMadrasahIds: string[] }): boolean => {
  if (viewer.role === "parent" || viewer.role === "adult") return viewer.familyId === child.familyId;
  if (viewer.role === "teacher") return !!viewer.madrasahId && child.linkedMadrasahIds.includes(viewer.madrasahId);
  return false;
};
