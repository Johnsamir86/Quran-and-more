import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from "react";

import { FAMILY_STORAGE_KEY, activeProfile, familyReducer, initialFamilyState, type FamilyAction, type FamilyState, type Profile } from "@qam/core";

interface Ctx { state: FamilyState; dispatch: (a: FamilyAction) => void; profile: (Profile & { avatar?: string }) | null; hydrated: boolean }
const FamilyContext = createContext<Ctx | null>(null);

export function FamilyProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(familyReducer, undefined, initialFamilyState);
  const hydrated = useRef(false);
  const [, force] = useReducer((n: number) => n + 1, 0);
  useEffect(() => {
    AsyncStorage.getItem(FAMILY_STORAGE_KEY).then((raw) => { if (raw) dispatch({ type: "hydrate", state: JSON.parse(raw) as FamilyState }); }).catch(() => undefined).finally(() => { hydrated.current = true; force(); });
  }, []);
  useEffect(() => { if (hydrated.current) AsyncStorage.setItem(FAMILY_STORAGE_KEY, JSON.stringify(state)).catch(() => undefined); }, [state]);
  const safe = useCallback((a: FamilyAction) => dispatch(a), []);
  const profile = activeProfile(state);
  const value = useMemo(() => ({ state, dispatch: safe, profile, hydrated: hydrated.current }), [state, safe, profile]);
  return <FamilyContext.Provider value={value}>{children}</FamilyContext.Provider>;
}

export const useFamily = (): Ctx => { const c = useContext(FamilyContext); if (!c) throw new Error("useFamily outside FamilyProvider"); return c; };

export const useProgressTicker = (verseKey: string | null, page: number | null, active: boolean) => {
  const { dispatch } = useFamily();
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => dispatch({ type: "progress/record", verseKey: verseKey ?? undefined, page: page ?? undefined, seconds: 15, day: new Date().toISOString().slice(0, 10) }), 15000);
    return () => clearInterval(id);
  }, [active, verseKey, page, dispatch]);
};
