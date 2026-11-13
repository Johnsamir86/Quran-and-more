"use client";

import { LOCALES, hasUiDictionary } from "@qam/core";

import { setUiLocale, useI18n } from "@/lib/i18n";

/** Interface-language picker used in every header; languages without their own UI text show English UI with content in that language. */
export default function LanguageSelect({ className }: { className?: string }) {
  const { locale, m } = useI18n();
  return (
    <select className={className} value={locale} onChange={(e) => setUiLocale(e.target.value)} aria-label={m.common.uiLanguage} title={m.common.uiLanguage}>
      {LOCALES.map((l) => <option key={l.code} value={l.code}>{l.nativeName}{hasUiDictionary(l.code) ? "" : " · EN"}</option>)}
    </select>
  );
}
