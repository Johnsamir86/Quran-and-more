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

/** Layout id from MUSHAF_LAYOUTS in ./mushaf (e.g. "madani_v2", "indopak_15", "tajweed"). */
export type MushafLayoutId = string;

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
    mushafLayout: uiMode === "kids" ? "kfgqpc_hafs" : "madani_v2",
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
  id: number | string;
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
