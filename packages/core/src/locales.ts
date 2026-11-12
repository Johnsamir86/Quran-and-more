/**
 * Interface languages supported by Quran.com (19). The app ships every one of
 * them; the device language picks the default and the user can change it.
 */
export interface Locale {
  code: string;
  name: string;
  nativeName: string;
  dir: "ltr" | "rtl";
}

export const LOCALES = [
  { code: "en", name: "English", nativeName: "English", dir: "ltr" },
  { code: "ar", name: "Arabic", nativeName: "العربية", dir: "rtl" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", dir: "ltr" },
  { code: "fa", name: "Persian", nativeName: "فارسی", dir: "rtl" },
  { code: "fr", name: "French", nativeName: "Français", dir: "ltr" },
  { code: "id", name: "Indonesian", nativeName: "Indonesia", dir: "ltr" },
  { code: "it", name: "Italian", nativeName: "Italiano", dir: "ltr" },
  { code: "nl", name: "Dutch", nativeName: "Nederlands", dir: "ltr" },
  { code: "pt", name: "Portuguese", nativeName: "Português", dir: "ltr" },
  { code: "ru", name: "Russian", nativeName: "Русский", dir: "ltr" },
  { code: "sq", name: "Albanian", nativeName: "Shqip", dir: "ltr" },
  { code: "th", name: "Thai", nativeName: "ภาษาไทย", dir: "ltr" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe", dir: "ltr" },
  { code: "ur", name: "Urdu", nativeName: "اردو", dir: "rtl" },
  { code: "zh", name: "Chinese", nativeName: "简体中文", dir: "ltr" },
  { code: "ms", name: "Malay", nativeName: "Melayu", dir: "ltr" },
  { code: "es", name: "Spanish", nativeName: "Español", dir: "ltr" },
  { code: "sw", name: "Swahili", nativeName: "Kiswahili", dir: "ltr" },
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt", dir: "ltr" },
] as const satisfies readonly Locale[];

export type LocaleCode = (typeof LOCALES)[number]["code"];

export const DEFAULT_LOCALE: LocaleCode = "en";

export const isLocaleCode = (value: string): value is LocaleCode =>
  LOCALES.some((locale) => locale.code === value);

/** Pick the best supported locale from a device/browser language tag like "ar-EG". */
export const resolveLocale = (deviceLanguage: string | undefined | null): LocaleCode => {
  if (!deviceLanguage) return DEFAULT_LOCALE;
  const lower = deviceLanguage.toLowerCase();
  if (isLocaleCode(lower)) return lower;
  const base = lower.split(/[-_]/)[0];
  return isLocaleCode(base) ? base : DEFAULT_LOCALE;
};

export const localeDir = (code: LocaleCode): "ltr" | "rtl" =>
  LOCALES.find((l) => l.code === code)?.dir ?? "ltr";
