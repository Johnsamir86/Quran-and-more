"use client";

import { useEffect, useState } from "react";

import { DEFAULT_THEME, SCHEME_STORAGE_KEY, THEME_STORAGE_KEY, isThemeId, themeCssVars, type ColorScheme, type SchemePreference, type ThemeId } from "@qam/core";

/** Brand theme + light/dark preference on the web: persisted in localStorage, applied as CSS variables on <html>. */
const EVENT = "qam:theme";

const read = (): { themeId: ThemeId; pref: SchemePreference } => {
  try {
    const t = window.localStorage.getItem(THEME_STORAGE_KEY);
    const s = window.localStorage.getItem(SCHEME_STORAGE_KEY);
    return { themeId: isThemeId(t) ? t : DEFAULT_THEME, pref: s === "light" || s === "dark" ? s : "system" };
  } catch {
    return { themeId: DEFAULT_THEME, pref: "system" };
  }
};

const systemScheme = (): ColorScheme => (typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light");

export const applyTheme = (themeId: ThemeId, pref: SchemePreference) => {
  const scheme: ColorScheme = pref === "system" ? systemScheme() : pref;
  const root = document.documentElement;
  const vars = themeCssVars(themeId, scheme);
  for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v);
  root.dataset.theme = themeId;
  root.dataset.scheme = scheme;
  root.style.colorScheme = scheme;
};

export const setTheme = (themeId: ThemeId) => { try { window.localStorage.setItem(THEME_STORAGE_KEY, themeId); } catch { /* ignore */ } window.dispatchEvent(new Event(EVENT)); };
export const setSchemePreference = (pref: SchemePreference) => { try { window.localStorage.setItem(SCHEME_STORAGE_KEY, pref); } catch { /* ignore */ } window.dispatchEvent(new Event(EVENT)); };

export const useTheme = () => {
  const [state, setState] = useState<{ themeId: ThemeId; pref: SchemePreference; scheme: ColorScheme }>({ themeId: DEFAULT_THEME, pref: "system", scheme: "light" });
  useEffect(() => {
    const sync = () => { const r = read(); applyTheme(r.themeId, r.pref); setState({ ...r, scheme: r.pref === "system" ? systemScheme() : r.pref }); };
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    mq?.addEventListener?.("change", sync);
    return () => { window.removeEventListener(EVENT, sync); window.removeEventListener("storage", sync); mq?.removeEventListener?.("change", sync); };
  }, []);
  return { ...state, setTheme, setSchemePreference };
};
