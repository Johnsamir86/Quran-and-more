"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from "react";

import {
  FAMILY_STORAGE_KEY,
  TEXT_SIZE_SCALE,
  activeProfile,
  familyReducer,
  initialFamilyState,
  type FamilyAction,
  type FamilyState,
  type Profile,
} from "@qam/core";

interface FamilyContextValue {
  state: FamilyState;
  dispatch: (action: FamilyAction) => void;
  profile: (Profile & { avatar?: string }) | null;
  hydrated: boolean;
}

const FamilyContext = createContext<FamilyContextValue | null>(null);

/** Keeps the family record in localStorage and applies the active profile's UI mode to <html>. */
export function FamilyProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(familyReducer, undefined, initialFamilyState);
  const hydratedRef = useRef(false);
  const [, force] = useReducer((n: number) => n + 1, 0);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(FAMILY_STORAGE_KEY);
      if (raw) dispatch({ type: "hydrate", state: JSON.parse(raw) as FamilyState });
    } catch { /* ignore */ }
    hydratedRef.current = true;
    force();
  }, []);

  useEffect(() => {
    if (!hydratedRef.current) return;
    try { window.localStorage.setItem(FAMILY_STORAGE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
  }, [state]);

  const profile = activeProfile(state);

  /* UI mode: font scale, contrast and a data attribute for theming. */
  useEffect(() => {
    const root = document.documentElement;
    const mode = profile?.settings.uiMode ?? "standard";
    root.dataset.uiMode = mode;
    root.style.setProperty("--profile-scale", String(profile?.settings.fontScale ?? 1));
    root.style.setProperty("--text-scale", String(TEXT_SIZE_SCALE.medium * (profile?.settings.fontScale ?? 1)));
    root.dataset.highContrast = profile?.settings.highContrast ? "true" : "false";
  }, [profile]);

  const safeDispatch = useCallback((a: FamilyAction) => dispatch(a), []);
  const value = useMemo(() => ({ state, dispatch: safeDispatch, profile, hydrated: hydratedRef.current }), [state, safeDispatch, profile]);
  return <FamilyContext.Provider value={value}>{children}</FamilyContext.Provider>;
}

export const useFamily = (): FamilyContextValue => {
  const ctx = useContext(FamilyContext);
  if (!ctx) throw new Error("useFamily must be used inside FamilyProvider");
  return ctx;
};

/** Record reading/listening time for the active profile (call every ~15 s while active). */
export const useProgressTicker = (verseKey: string | null, page: number | null, active: boolean) => {
  const { dispatch } = useFamily();
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => {
      dispatch({ type: "progress/record", verseKey: verseKey ?? undefined, page: page ?? undefined, seconds: 15, day: new Date().toISOString().slice(0, 10) });
    }, 15000);
    return () => window.clearInterval(id);
  }, [active, verseKey, page, dispatch]);
};
