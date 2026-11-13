import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { formatNumber, getMessages, isLocaleCode, localeDir, resolveLocale, type Messages } from "@qam/core";

const KEY = "qam.locale";
const deviceLocale = () => resolveLocale(Intl.DateTimeFormat().resolvedOptions().locale);

export interface I18n { locale: string; m: Messages; dir: "ltr" | "rtl"; isRtl: boolean; isAr: boolean; num: (n: number) => string; setLocale: (code: string) => void }
const Ctx = createContext<I18n | null>(null);

/** Interface language for the whole app: the saved choice, else the device language. */
export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<string>(deviceLocale);
  useEffect(() => { AsyncStorage.getItem(KEY).then((v) => { if (v && isLocaleCode(v)) setLocaleState(v); }).catch(() => undefined); }, []);
  const setLocale = useCallback((code: string) => { setLocaleState(code); AsyncStorage.setItem(KEY, code).catch(() => undefined); }, []);
  const value = useMemo<I18n>(() => ({ locale, m: getMessages(locale), dir: localeDir(locale), isRtl: localeDir(locale) === "rtl", isAr: locale === "ar", num: (n) => formatNumber(n, locale), setLocale }), [locale, setLocale]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useI18n = (): I18n => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useI18n outside LocaleProvider");
  return c;
};
