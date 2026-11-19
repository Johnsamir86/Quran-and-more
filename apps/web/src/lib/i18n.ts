"use client";

import { useEffect, useMemo, useState } from "react";

import { formatNumber, getMessages, isLocaleCode, localeDir, resolveLocale, type Messages } from "@qam/core";

/** Same storage key the player has always used, so existing choices carry over. */
export const LOCALE_KEY = "qam.player.locale";
const EVENT = "qam:locale";

export const readUiLocale = (): string => {
  try {
    const raw = window.localStorage.getItem(LOCALE_KEY);
    if (raw) { const v = JSON.parse(raw) as unknown; if (typeof v === "string" && isLocaleCode(v)) return v; }
  } catch { /* private mode */ }
  return resolveLocale(typeof navigator !== "undefined" ? navigator.language : "en");
};

export const setUiLocale = (code: string) => {
  try { window.localStorage.setItem(LOCALE_KEY, JSON.stringify(code)); } catch { /* ignore */ }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: code }));
};

/** UI language shared by every page: stored choice, else the browser language. Updates live when changed anywhere. */
export const useUiLocale = (): string => {
  const [loc, setLoc] = useState("en");
  useEffect(() => {
    setLoc(readUiLocale());
    const onChange = (e: Event) => setLoc((e as CustomEvent<string>).detail);
    window.addEventListener(EVENT, onChange);
    return () => window.removeEventListener(EVENT, onChange);
  }, []);
  useEffect(() => { document.documentElement.lang = loc; document.documentElement.dir = localeDir(loc); }, [loc]);
  return loc;
};

export interface I18n { locale: string; m: Messages; dir: "ltr" | "rtl"; isRtl: boolean; ar: boolean; num: (n: number) => string }

export const useI18n = (): I18n => {
  const locale = useUiLocale();
  return useMemo(() => ({ locale, m: getMessages(locale), dir: localeDir(locale), isRtl: localeDir(locale) === "rtl", ar: locale === "ar", num: (n: number) => formatNumber(n, locale) }), [locale]);
};
