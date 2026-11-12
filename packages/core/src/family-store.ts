/**
 * Local-first family data: profiles, bookmarks, notes and reading progress
 * for every member of the family on this device. Children and relatives
 * never need an account; when the parent signs in with their Quran
 * Foundation account the parent's own items sync to Quran.com through the
 * User APIs, and the whole family record syncs to our backend.
 *
 * Pure data model + reducer; persistence adapters live in the apps.
 */
import { defaultSettingsFor, type AgeBand, type Gender, type Profile, type ProfileRole, type ProfileSettings } from "./profiles";

export interface LocalBookmark {
  id: string;
  profileId: string;
  verseKey: string;
  /** Optional mushaf page the bookmark was made on. */
  page?: number;
  createdAt: number;
  /** Quran Foundation bookmark id once synced (parent profiles only). */
  remoteId?: string;
}

export interface LocalNote {
  id: string;
  profileId: string;
  verseKey: string;
  body: string;
  createdAt: number;
  updatedAt: number;
  remoteId?: string;
}

export interface LocalProgress {
  profileId: string;
  lastVerseKey: string | null;
  lastPage: number | null;
  /** ISO day -> seconds read/listened */
  days: Record<string, number>;
  streak: number;
  lastActiveDay: string | null;
}

export interface FamilyState {
  version: 1;
  familyId: string;
  activeProfileId: string | null;
  profiles: Profile[];
  bookmarks: LocalBookmark[];
  notes: LocalNote[];
  progress: Record<string, LocalProgress>;
}

export const AVATARS = ["🌙", "⭐", "🌸", "🌿", "🕌", "📖", "🐪", "🦋", "🌞", "🪷", "🫶", "🧕", "🧔", "👧", "👦", "👵", "👴"] as const;

const uid = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`);

export const initialFamilyState = (): FamilyState => ({
  version: 1,
  familyId: uid(),
  activeProfileId: null,
  profiles: [],
  bookmarks: [],
  notes: [],
  progress: {},
});

export interface NewProfileInput {
  displayName: string;
  role: ProfileRole;
  gender: Gender;
  ageBand: AgeBand;
  locale: string;
  avatar?: string;
}

export type FamilyAction =
  | { type: "profile/add"; input: NewProfileInput; id?: string }
  | { type: "profile/update"; id: string; patch: Partial<Pick<Profile, "displayName" | "gender" | "ageBand" | "role">> & { avatar?: string; settings?: Partial<ProfileSettings> } }
  | { type: "profile/remove"; id: string }
  | { type: "profile/select"; id: string | null }
  | { type: "bookmark/toggle"; verseKey: string; page?: number }
  | { type: "bookmark/remove"; id: string }
  | { type: "note/save"; verseKey: string; body: string; id?: string }
  | { type: "note/remove"; id: string }
  | { type: "progress/record"; verseKey?: string; page?: number; seconds: number; day: string }
  | { type: "hydrate"; state: FamilyState };

const todayMinus = (day: string, n: number) => {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
};

export const familyReducer = (state: FamilyState, action: FamilyAction): FamilyState => {
  switch (action.type) {
    case "hydrate":
      return action.state.version === 1 ? action.state : state;
    case "profile/add": {
      const id = action.id ?? uid();
      const profile: Profile & { avatar?: string } = {
        id,
        familyId: state.familyId,
        role: action.input.role,
        displayName: action.input.displayName.trim() || "—",
        gender: action.input.gender,
        ageBand: action.input.ageBand,
        settings: defaultSettingsFor(action.input.ageBand, action.input.locale),
        avatar: action.input.avatar ?? AVATARS[state.profiles.length % AVATARS.length],
      };
      return { ...state, profiles: [...state.profiles, profile], activeProfileId: state.activeProfileId ?? id };
    }
    case "profile/update":
      return {
        ...state,
        profiles: state.profiles.map((p) =>
          p.id === action.id
            ? { ...p, ...action.patch, settings: action.patch.settings ? { ...p.settings, ...action.patch.settings } : p.settings }
            : p,
        ),
      };
    case "profile/remove": {
      const profiles = state.profiles.filter((p) => p.id !== action.id);
      const { [action.id]: _removed, ...progress } = state.progress;
      return {
        ...state,
        profiles,
        bookmarks: state.bookmarks.filter((b) => b.profileId !== action.id),
        notes: state.notes.filter((n) => n.profileId !== action.id),
        progress,
        activeProfileId: state.activeProfileId === action.id ? profiles[0]?.id ?? null : state.activeProfileId,
      };
    }
    case "profile/select":
      return { ...state, activeProfileId: action.id };
    case "bookmark/toggle": {
      const pid = state.activeProfileId;
      if (!pid) return state;
      const existing = state.bookmarks.find((b) => b.profileId === pid && b.verseKey === action.verseKey);
      return existing
        ? { ...state, bookmarks: state.bookmarks.filter((b) => b.id !== existing.id) }
        : { ...state, bookmarks: [{ id: uid(), profileId: pid, verseKey: action.verseKey, page: action.page, createdAt: Date.now() }, ...state.bookmarks] };
    }
    case "bookmark/remove":
      return { ...state, bookmarks: state.bookmarks.filter((b) => b.id !== action.id) };
    case "note/save": {
      const pid = state.activeProfileId;
      if (!pid) return state;
      const body = action.body.trim();
      const now = Date.now();
      if (action.id) {
        if (!body) return { ...state, notes: state.notes.filter((n) => n.id !== action.id) };
        return { ...state, notes: state.notes.map((n) => (n.id === action.id ? { ...n, body, updatedAt: now } : n)) };
      }
      if (!body) return state;
      return { ...state, notes: [{ id: uid(), profileId: pid, verseKey: action.verseKey, body, createdAt: now, updatedAt: now }, ...state.notes] };
    }
    case "note/remove":
      return { ...state, notes: state.notes.filter((n) => n.id !== action.id) };
    case "progress/record": {
      const pid = state.activeProfileId;
      if (!pid) return state;
      const prev: LocalProgress = state.progress[pid] ?? { profileId: pid, lastVerseKey: null, lastPage: null, days: {}, streak: 0, lastActiveDay: null };
      const days = { ...prev.days, [action.day]: (prev.days[action.day] ?? 0) + Math.max(0, action.seconds) };
      let streak = prev.streak;
      if (prev.lastActiveDay !== action.day) {
        streak = prev.lastActiveDay === todayMinus(action.day, 1) ? prev.streak + 1 : 1;
      }
      return {
        ...state,
        progress: {
          ...state.progress,
          [pid]: { profileId: pid, lastVerseKey: action.verseKey ?? prev.lastVerseKey, lastPage: action.page ?? prev.lastPage, days, streak, lastActiveDay: action.day },
        },
      };
    }
    default:
      return state;
  }
};

export const activeProfile = (state: FamilyState): (Profile & { avatar?: string }) | null =>
  state.profiles.find((p) => p.id === state.activeProfileId) ?? null;

export const bookmarksFor = (state: FamilyState, profileId: string) => state.bookmarks.filter((b) => b.profileId === profileId);
export const notesFor = (state: FamilyState, profileId: string) => state.notes.filter((n) => n.profileId === profileId);
export const isBookmarked = (state: FamilyState, verseKey: string) =>
  !!state.activeProfileId && state.bookmarks.some((b) => b.profileId === state.activeProfileId && b.verseKey === verseKey);

export const FAMILY_STORAGE_KEY = "qam.family.v1";
