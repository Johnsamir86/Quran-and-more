import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useColorScheme } from "react-native";

import { DEFAULT_THEME, SCHEME_STORAGE_KEY, THEMES, THEME_STORAGE_KEY, isThemeId, type ColorScheme, type SchemePreference, type Theme, type ThemeId, type ThemeTokens } from "@qam/core";

/** Selected brand theme (serene, classic, night, warm) and light/dark preference, persisted per device. */
interface ThemeCtx {
  themeId: ThemeId;
  theme: Theme;
  scheme: ColorScheme;
  schemePreference: SchemePreference;
  tokens: ThemeTokens;
  setThemeId: (id: ThemeId) => void;
  setSchemePreference: (p: SchemePreference) => void;
}

const Ctx = createContext<ThemeCtx | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [themeId, setTheme] = useState<ThemeId>(DEFAULT_THEME);
  const [pref, setPref] = useState<SchemePreference>("system");
  useEffect(() => {
    AsyncStorage.multiGet([THEME_STORAGE_KEY, SCHEME_STORAGE_KEY]).then(([[, t], [, s]]) => {
      if (isThemeId(t)) setTheme(t);
      if (s === "light" || s === "dark" || s === "system") setPref(s);
    }).catch(() => undefined);
  }, []);
  const setThemeId = useCallback((id: ThemeId) => { setTheme(id); AsyncStorage.setItem(THEME_STORAGE_KEY, id).catch(() => undefined); }, []);
  const setSchemePreference = useCallback((p: SchemePreference) => { setPref(p); AsyncStorage.setItem(SCHEME_STORAGE_KEY, p).catch(() => undefined); }, []);
  const scheme: ColorScheme = pref === "system" ? (system === "dark" ? "dark" : "light") : pref;
  const theme = THEMES[themeId];
  const value = useMemo(() => ({ themeId, theme, scheme, schemePreference: pref, tokens: theme[scheme], setThemeId, setSchemePreference }), [themeId, theme, scheme, pref, setThemeId, setSchemePreference]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useTheme = (): ThemeCtx => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useTheme outside ThemeProvider");
  return c;
};
