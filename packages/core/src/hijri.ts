/**
 * Hijri calendar through the platform's Umm al-Qura tables (Intl, calendar "islamic-umalqura"),
 * the same civil calendar Saudi Arabia and most prayer apps use. Dates can differ by a day from a
 * country's moon-sighting announcement; the UI says so and offers a manual ±1 day adjustment.
 */
export interface HijriDate { year: number; month: number; day: number }

export const HIJRI_MONTHS: { ar: string; en: string }[] = [
  { ar: "محرّم", en: "Muharram" }, { ar: "صفر", en: "Safar" }, { ar: "ربيع الأول", en: "Rabiʿ al-Awwal" }, { ar: "ربيع الآخر", en: "Rabiʿ al-Thani" },
  { ar: "جمادى الأولى", en: "Jumada al-Ula" }, { ar: "جمادى الآخرة", en: "Jumada al-Akhirah" }, { ar: "رجب", en: "Rajab" }, { ar: "شعبان", en: "Shaʿban" },
  { ar: "رمضان", en: "Ramadan" }, { ar: "شوّال", en: "Shawwal" }, { ar: "ذو القعدة", en: "Dhu al-Qaʿdah" }, { ar: "ذو الحجة", en: "Dhu al-Hijjah" },
];

const fmt = new Map<string, Intl.DateTimeFormat>();
const formatter = (timeZone?: string) => {
  const key = timeZone ?? "local";
  let f = fmt.get(key);
  if (!f) { f = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura-nu-latn", { timeZone, year: "numeric", month: "numeric", day: "numeric" }); fmt.set(key, f); }
  return f;
};

/** Hijri date for a Gregorian instant, with an optional ±n day adjustment for local sighting. */
export const toHijri = (date: Date, adjustDays = 0, timeZone?: string): HijriDate => {
  const d = adjustDays ? new Date(date.getTime() + adjustDays * 86_400_000) : date;
  const parts = formatter(timeZone).formatToParts(d);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  return { year: get("year"), month: get("month"), day: get("day") };
};

export const formatHijri = (h: HijriDate, lang: "ar" | "en" = "en"): string => {
  const m = HIJRI_MONTHS[h.month - 1] ?? HIJRI_MONTHS[0];
  return lang === "ar" ? `${h.day} ${m.ar} ${h.year} هـ` : `${h.day} ${m.en} ${h.year} AH`;
};

/** Days in a Hijri month according to the same tables (29 or 30). */
export const hijriMonthLength = (year: number, month: number, timeZone?: string): number => {
  // Walk from a Gregorian anchor near the month's end.
  const g = hijriToGregorian({ year, month, day: 1 }, timeZone);
  for (let n = 31; n >= 28; n--) { const h = toHijri(new Date(g.getTime() + (n - 1) * 86_400_000), 0, timeZone); if (h.month === month && h.year === year) return n; }
  return 29;
};

/** Gregorian noon (UTC) of a Hijri date, found by stepping from an estimate. */
export const hijriToGregorian = (h: HijriDate, timeZone?: string): Date => {
  // Estimate: 1 Muharram 1 AH ≈ 622-07-19; mean year 354.367 days.
  const est = new Date(Date.UTC(622, 6, 19, 12) + ((h.year - 1) * 354.36708 + (h.month - 1) * 29.5306 + (h.day - 1)) * 86_400_000);
  for (let i = 0; i < 40; i++) {
    const cur = toHijri(est, 0, timeZone);
    const diff = (cur.year - h.year) * 354 + (cur.month - h.month) * 29.5 + (cur.day - h.day);
    if (Math.abs(diff) < 0.6 && cur.year === h.year && cur.month === h.month && cur.day === h.day) return est;
    est.setTime(est.getTime() - Math.round(diff || (cur.day > h.day ? 1 : -1)) * 86_400_000);
  }
  return est;
};

/** Widely observed dates only (no contested commemorations). */
export type IslamicEventId = "newYear" | "ashura" | "ramadanStart" | "lastTenNights" | "eidFitr" | "arafah" | "eidAdha" | "tashriq" | "whiteDays";
export interface IslamicEvent { id: IslamicEventId; month: number; day: number; days: number; fasting?: boolean }
export const ISLAMIC_EVENTS: IslamicEvent[] = [
  { id: "newYear", month: 1, day: 1, days: 1 },
  { id: "ashura", month: 1, day: 10, days: 1, fasting: true },
  { id: "ramadanStart", month: 9, day: 1, days: 1 },
  { id: "lastTenNights", month: 9, day: 21, days: 10 },
  { id: "eidFitr", month: 10, day: 1, days: 1 },
  { id: "arafah", month: 12, day: 9, days: 1, fasting: true },
  { id: "eidAdha", month: 12, day: 10, days: 1 },
  { id: "tashriq", month: 12, day: 11, days: 3 },
];

/** Local midnight of the calendar day that a noon-UTC instant falls on. */
const localDay = (g: Date) => new Date(g.getUTCFullYear(), g.getUTCMonth(), g.getUTCDate());

export interface UpcomingEvent { id: IslamicEventId | "whiteDays"; hijri: HijriDate; date: Date; inDays: number; fasting?: boolean }

/** The next 12 months of events from `today`, soonest first; white days (13–15) of the current and next month included. */
export const upcomingEvents = (today: Date, adjustDays = 0, timeZone?: string): UpcomingEvent[] => {
  const now = toHijri(today, adjustDays, timeZone);
  const out: UpcomingEvent[] = [];
  const startOfToday = new Date(today); startOfToday.setHours(0, 0, 0, 0);
  const push = (id: UpcomingEvent["id"], h: HijriDate, fasting?: boolean) => {
    const g = localDay(new Date(hijriToGregorian(h, timeZone).getTime() - adjustDays * 86_400_000));
    const inDays = Math.round((g.getTime() - startOfToday.getTime()) / 86_400_000);
    if (inDays >= 0 && inDays <= 366) out.push({ id, hijri: h, date: g, inDays, fasting });
  };
  for (const y of [now.year, now.year + 1]) for (const e of ISLAMIC_EVENTS) push(e.id, { year: y, month: e.month, day: e.day }, e.fasting);
  for (let k = 0; k < 2; k++) { let m = now.month + k, y = now.year; if (m > 12) { m -= 12; y += 1; } push("whiteDays", { year: y, month: m, day: 13 }, true); }
  return out.sort((a, b) => a.inDays - b.inDays);
};

/** Days until 1 Ramadan (0 during Ramadan). */
export const daysToRamadan = (today: Date, adjustDays = 0, timeZone?: string): number => {
  const h = toHijri(today, adjustDays, timeZone);
  if (h.month === 9) return 0;
  const target = { year: h.month > 9 ? h.year + 1 : h.year, month: 9, day: 1 };
  const g = localDay(new Date(hijriToGregorian(target, timeZone).getTime() - adjustDays * 86_400_000));
  const start = new Date(today); start.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((g.getTime() - start.getTime()) / 86_400_000));
};

/** Calendar grid for a Hijri month: each cell carries the Gregorian date. */
export const hijriMonthGrid = (year: number, month: number, adjustDays = 0, timeZone?: string): { day: number; date: Date }[] => {
  const len = hijriMonthLength(year, month, timeZone);
  const first = localDay(new Date(hijriToGregorian({ year, month, day: 1 }, timeZone).getTime() - adjustDays * 86_400_000));
  return Array.from({ length: len }, (_, i) => ({ day: i + 1, date: new Date(first.getFullYear(), first.getMonth(), first.getDate() + i) }));
};
