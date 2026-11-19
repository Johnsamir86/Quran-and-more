/**
 * Interface languages. The list covers every language that has at least one
 * Quran translation in the Quran Foundation / Quran.com catalogue (69 names,
 * 66 distinct languages), so the UI language selector matches the translation
 * languages. Languages without a UI dictionary of their own show English UI
 * text while content (translations, tafsir, word meanings) stays in the
 * chosen language; see i18n/index.ts for which ones have dictionaries.
 */
export interface Locale {
  code: string;
  /** English name, lower-cased elsewhere to match `language_name` in the content API. */
  name: string;
  nativeName: string;
  dir: "ltr" | "rtl";
  /** Other spellings the content API uses for this language. */
  aliases?: readonly string[];
}

export const LOCALES = [
  { code: "en", name: "English", nativeName: "English", dir: "ltr" },
  { code: "ar", name: "Arabic", nativeName: "العربية", dir: "rtl" },
  { code: "ur", name: "Urdu", nativeName: "اردو", dir: "rtl" },
  { code: "fr", name: "French", nativeName: "Français", dir: "ltr" },
  { code: "es", name: "Spanish", nativeName: "Español", dir: "ltr" },
  { code: "de", name: "German", nativeName: "Deutsch", dir: "ltr" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe", dir: "ltr" },
  { code: "id", name: "Indonesian", nativeName: "Indonesia", dir: "ltr" },
  { code: "ms", name: "Malay", nativeName: "Melayu", dir: "ltr" },
  { code: "fa", name: "Persian", nativeName: "فارسی", dir: "rtl" },
  { code: "prs", name: "Dari", nativeName: "دری", dir: "rtl" },
  { code: "ru", name: "Russian", nativeName: "Русский", dir: "ltr" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", dir: "ltr" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", dir: "ltr" },
  { code: "pt", name: "Portuguese", nativeName: "Português", dir: "ltr" },
  { code: "it", name: "Italian", nativeName: "Italiano", dir: "ltr" },
  { code: "nl", name: "Dutch", nativeName: "Nederlands", dir: "ltr" },
  { code: "zh", name: "Chinese", nativeName: "简体中文", dir: "ltr" },
  { code: "ja", name: "Japanese", nativeName: "日本語", dir: "ltr" },
  { code: "ko", name: "Korean", nativeName: "한국어", dir: "ltr" },
  { code: "sw", name: "Swahili", nativeName: "Kiswahili", dir: "ltr" },
  { code: "ha", name: "Hausa", nativeName: "Hausa", dir: "ltr" },
  { code: "so", name: "Somali", nativeName: "Soomaali", dir: "ltr" },
  { code: "am", name: "Amharic", nativeName: "አማርኛ", dir: "ltr" },
  { code: "om", name: "Oromo", nativeName: "Afaan Oromoo", dir: "ltr" },
  { code: "yo", name: "Yoruba", nativeName: "Yorùbá", dir: "ltr" },
  { code: "bm", name: "Bambara", nativeName: "Bamanankan", dir: "ltr" },
  { code: "rw", name: "Kinyarwanda", nativeName: "Ikinyarwanda", dir: "ltr" },
  { code: "lg", name: "Ganda", nativeName: "Luganda", dir: "ltr" },
  { code: "zgh", name: "Amazigh", nativeName: "ⵜⴰⵎⴰⵣⵉⵖⵜ", dir: "ltr" },
  { code: "sq", name: "Albanian", nativeName: "Shqip", dir: "ltr" },
  { code: "bs", name: "Bosnian", nativeName: "Bosanski", dir: "ltr" },
  { code: "bg", name: "Bulgarian", nativeName: "Български", dir: "ltr" },
  { code: "ro", name: "Romanian", nativeName: "Română", dir: "ltr" },
  { code: "pl", name: "Polish", nativeName: "Polski", dir: "ltr" },
  { code: "cs", name: "Czech", nativeName: "Čeština", dir: "ltr" },
  { code: "uk", name: "Ukrainian", nativeName: "Українська", dir: "ltr" },
  { code: "sv", name: "Swedish", nativeName: "Svenska", dir: "ltr" },
  { code: "no", name: "Norwegian", nativeName: "Norsk", dir: "ltr" },
  { code: "fi", name: "Finnish", nativeName: "Suomi", dir: "ltr" },
  { code: "he", name: "Hebrew", nativeName: "עברית", dir: "rtl" },
  { code: "ku", name: "Kurdish", nativeName: "کوردی", dir: "rtl" },
  { code: "ps", name: "Pashto", nativeName: "پښتو", dir: "rtl" },
  { code: "sd", name: "Sindhi", nativeName: "سنڌي", dir: "rtl" },
  { code: "ug", name: "Uighur", nativeName: "ئۇيغۇرچە", dir: "rtl", aliases: ["uighur, uyghur", "uyghur"] },
  { code: "dv", name: "Divehi", nativeName: "ދިވެހި", dir: "rtl", aliases: ["divehi, dhivehi, maldivian", "dhivehi", "maldivian"] },
  { code: "az", name: "Azeri", nativeName: "Azərbaycanca", dir: "ltr", aliases: ["azerbaijani"] },
  { code: "kk", name: "Kazakh", nativeName: "Қазақша", dir: "ltr" },
  { code: "uz", name: "Uzbek", nativeName: "Oʻzbekcha", dir: "ltr" },
  { code: "tg", name: "Tajik", nativeName: "Тоҷикӣ", dir: "ltr" },
  { code: "tt", name: "Tatar", nativeName: "Татарча", dir: "ltr" },
  { code: "ce", name: "Chechen", nativeName: "Нохчийн", dir: "ltr" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", dir: "ltr" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", dir: "ltr" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം", dir: "ltr" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", dir: "ltr" },
  { code: "mr", name: "Marathi", nativeName: "मराठी", dir: "ltr" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી", dir: "ltr" },
  { code: "as", name: "Assamese", nativeName: "অসমীয়া", dir: "ltr" },
  { code: "ne", name: "Nepali", nativeName: "नेपाली", dir: "ltr" },
  { code: "si", name: "Sinhala", nativeName: "සිංහල", dir: "ltr", aliases: ["sinhala, sinhalese", "sinhalese"] },
  { code: "th", name: "Thai", nativeName: "ภาษาไทย", dir: "ltr" },
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt", dir: "ltr" },
  { code: "km", name: "Khmer", nativeName: "ខ្មែរ", dir: "ltr", aliases: ["central khmer"] },
  { code: "tl", name: "Tagalog", nativeName: "Tagalog", dir: "ltr", aliases: ["filipino"] },
  { code: "mrw", name: "Maranao", nativeName: "Mëranaw", dir: "ltr" },
  { code: "yuw", name: "Yau", nativeName: "Yau", dir: "ltr", aliases: ["yau,yuw", "yau"] },
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
  if (base === "fil") return "tl";
  if (base === "nb" || base === "nn") return "no";
  if (base === "ber" || base === "tzm" || base === "kab") return "zgh";
  return isLocaleCode(base) ? base : DEFAULT_LOCALE;
};

export const localeDir = (code: string): "ltr" | "rtl" =>
  LOCALES.find((l) => l.code === code)?.dir ?? "ltr";

export const localeByCode = (code: string): Locale | undefined => LOCALES.find((l) => l.code === code);

/** Map a content-API language name ("english", "uighur, uyghur") to a locale code. */
export const localeForLanguageName = (name: string | null | undefined): LocaleCode | null => {
  if (!name) return null;
  const n = name.trim().toLowerCase();
  const hit = (LOCALES as readonly Locale[]).find((l) => l.name.toLowerCase() === n || l.aliases?.some((a) => a === n));
  return (hit?.code as LocaleCode | undefined) ?? null;
};

/** Content-API language name for a locale (what `language_name` filters expect). */
export const languageNameForLocale = (code: string): string => (localeByCode(code)?.name ?? "English").toLowerCase();
