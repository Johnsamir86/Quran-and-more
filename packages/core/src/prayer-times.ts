/**
 * Prayer times computed on the device (no network): the standard astronomical
 * algorithm used by PrayTimes.org and most prayer apps, with the calculation
 * methods published by Aladhan (same Fajr/Isha angles, same minute offsets),
 * a country → method table so the times match what mosques in that country
 * announce, Hanafi/standard Asr, and a high-latitude fallback.
 *
 * All times come back as absolute Date instants, so they are correct in any
 * time zone and across daylight-saving changes; format them with the
 * location's IANA zone (see `formatPrayerTime`).
 */
export type PrayerName = "fajr" | "sunrise" | "dhuhr" | "asr" | "maghrib" | "isha";
export const PRAYER_NAMES: PrayerName[] = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"];
/** Prayers that get an azan (sunrise is informational). */
export const AZAN_PRAYERS: Exclude<PrayerName, "sunrise">[] = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

export type AsrJuristic = "standard" | "hanafi";
export type HighLatRule = "night-middle" | "one-seventh" | "angle-based";

/** Fajr/Isha as a solar depression angle (degrees) or Isha/Maghrib as minutes after sunset/maghrib. */
export interface CalcMethod {
  id: CalcMethodId;
  /** Aladhan method number, for cross-checking against api.aladhan.com. */
  aladhanId: number;
  name: string;
  fajrAngle: number;
  ishaAngle?: number;
  ishaMinutes?: number;
  maghribAngle?: number;
  maghribMinutes?: number;
}

export type CalcMethodId =
  | "mwl" | "isna" | "egypt" | "makkah" | "karachi" | "tehran" | "gulf" | "kuwait" | "qatar" | "singapore"
  | "france" | "turkey" | "russia" | "dubai" | "jakim" | "tunisia" | "algeria" | "kemenag" | "morocco" | "lisbon" | "jordan";

export const CALC_METHODS: CalcMethod[] = [
  { id: "mwl", aladhanId: 3, name: "Muslim World League", fajrAngle: 18, ishaAngle: 17 },
  { id: "isna", aladhanId: 2, name: "Islamic Society of North America (ISNA)", fajrAngle: 15, ishaAngle: 15 },
  { id: "egypt", aladhanId: 5, name: "Egyptian General Authority of Survey", fajrAngle: 19.5, ishaAngle: 17.5 },
  { id: "makkah", aladhanId: 4, name: "Umm Al-Qura University, Makkah", fajrAngle: 18.5, ishaMinutes: 90 },
  { id: "karachi", aladhanId: 1, name: "University of Islamic Sciences, Karachi", fajrAngle: 18, ishaAngle: 18 },
  { id: "tehran", aladhanId: 7, name: "Institute of Geophysics, University of Tehran", fajrAngle: 17.7, ishaAngle: 14, maghribAngle: 4.5 },
  { id: "gulf", aladhanId: 8, name: "Gulf Region", fajrAngle: 19.5, ishaMinutes: 90 },
  { id: "kuwait", aladhanId: 9, name: "Kuwait", fajrAngle: 18, ishaAngle: 17.5 },
  { id: "qatar", aladhanId: 10, name: "Qatar", fajrAngle: 18, ishaMinutes: 90 },
  { id: "singapore", aladhanId: 11, name: "Majlis Ugama Islam Singapura", fajrAngle: 20, ishaAngle: 18 },
  { id: "france", aladhanId: 12, name: "Union des Organisations Islamiques de France", fajrAngle: 12, ishaAngle: 12 },
  { id: "turkey", aladhanId: 13, name: "Diyanet İşleri Başkanlığı, Türkiye", fajrAngle: 18, ishaAngle: 17 },
  { id: "russia", aladhanId: 14, name: "Spiritual Administration of Muslims of Russia", fajrAngle: 16, ishaAngle: 15 },
  { id: "dubai", aladhanId: 16, name: "Dubai", fajrAngle: 18.2, ishaAngle: 18.2 },
  { id: "jakim", aladhanId: 17, name: "Jabatan Kemajuan Islam Malaysia (JAKIM)", fajrAngle: 20, ishaAngle: 18 },
  { id: "tunisia", aladhanId: 18, name: "Tunisia", fajrAngle: 18, ishaAngle: 18 },
  { id: "algeria", aladhanId: 19, name: "Algeria", fajrAngle: 18, ishaAngle: 17 },
  { id: "kemenag", aladhanId: 20, name: "Kementerian Agama Republik Indonesia", fajrAngle: 20, ishaAngle: 18 },
  { id: "morocco", aladhanId: 21, name: "Morocco", fajrAngle: 19, ishaAngle: 17 },
  { id: "lisbon", aladhanId: 22, name: "Comunidade Islâmica de Lisboa", fajrAngle: 18, maghribMinutes: 3, ishaMinutes: 77 },
  { id: "jordan", aladhanId: 23, name: "Ministry of Awqaf, Jordan", fajrAngle: 18, maghribMinutes: 5, ishaAngle: 18 },
];

export const calcMethodById = (id: string): CalcMethod => CALC_METHODS.find((m) => m.id === id) ?? CALC_METHODS[0];

/** ISO 3166-1 alpha-2 country → the method its official authority publishes (or the common choice). */
const COUNTRY_METHODS: Record<string, CalcMethodId> = {
  EG: "egypt", SD: "egypt", SS: "egypt", LY: "egypt", SY: "egypt", IQ: "egypt", LB: "egypt", YE: "egypt", DJ: "egypt", SO: "egypt", ER: "egypt", ET: "egypt", TD: "egypt", NG: "egypt",
  SA: "makkah",
  AE: "dubai", BH: "gulf", OM: "gulf", KW: "kuwait", QA: "qatar", JO: "jordan", PS: "jordan",
  IR: "tehran",
  PK: "karachi", AF: "karachi", BD: "karachi", IN: "karachi", NP: "karachi", LK: "karachi", MV: "karachi", BT: "karachi", MM: "karachi",
  US: "isna", CA: "isna", MX: "isna",
  SG: "singapore", MY: "jakim", BN: "jakim", ID: "kemenag", TL: "kemenag",
  FR: "france", MC: "france",
  TR: "turkey", CY: "turkey", AZ: "turkey",
  RU: "russia", BY: "russia", UA: "russia",
  TN: "tunisia", DZ: "algeria", MA: "morocco", EH: "morocco", MR: "morocco", PT: "lisbon",
};

/** Countries whose majority school is Hanafi (Asr at shadow length 2). */
const HANAFI_COUNTRIES = new Set(["TR", "PK", "IN", "BD", "AF", "KZ", "UZ", "TJ", "KG", "TM", "RU", "AZ", "BA", "AL", "XK", "MK", "CN", "TT", "GY", "SR", "MM", "NP"]);

export const methodForCountry = (countryCode: string | null | undefined): CalcMethodId => COUNTRY_METHODS[(countryCode ?? "").toUpperCase()] ?? "mwl";
export const asrForCountry = (countryCode: string | null | undefined): AsrJuristic => (HANAFI_COUNTRIES.has((countryCode ?? "").toUpperCase()) ? "hanafi" : "standard");

export interface PrayerCalcOptions {
  latitude: number;
  longitude: number;
  method?: CalcMethodId;
  asr?: AsrJuristic;
  highLat?: HighLatRule;
  /** Minutes added per prayer, e.g. for a local mosque that announces Isha 5 minutes later. */
  adjustments?: Partial<Record<PrayerName, number>>;
}

export type PrayerTimes = Record<PrayerName, Date>;

// ---- trigonometry in degrees ----
const dtr = (d: number) => (d * Math.PI) / 180;
const rtd = (r: number) => (r * 180) / Math.PI;
const sin = (d: number) => Math.sin(dtr(d));
const cos = (d: number) => Math.cos(dtr(d));
const tan = (d: number) => Math.tan(dtr(d));
const arcsin = (x: number) => rtd(Math.asin(Math.max(-1, Math.min(1, x))));
const arccos = (x: number) => rtd(Math.acos(Math.max(-1, Math.min(1, x))));
const arctan2 = (y: number, x: number) => rtd(Math.atan2(y, x));
const arccot = (x: number) => rtd(Math.atan(1 / x));
const fixAngle = (a: number) => fix(a, 360);
const fixHour = (a: number) => fix(a, 24);
const fix = (a: number, b: number) => { const r = a - b * Math.floor(a / b); return r < 0 ? r + b : r; };

/** Julian day number for a civil date (Gregorian). */
export const julianDay = (year: number, month: number, day: number): number => {
  if (month <= 2) { year -= 1; month += 12; }
  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + B - 1524.5;
};

/** Declination and equation of time (hours) for a Julian day. US Naval Observatory approximation. */
const sunPosition = (jd: number) => {
  const D = jd - 2451545.0;
  const g = fixAngle(357.529 + 0.98560028 * D);
  const q = fixAngle(280.459 + 0.98564736 * D);
  const L = fixAngle(q + 1.915 * sin(g) + 0.02 * sin(2 * g));
  const e = 23.439 - 0.00000036 * D;
  const declination = arcsin(sin(e) * sin(L));
  const RA = fixHour(arctan2(cos(e) * sin(L), cos(L)) / 15);
  const equation = q / 15 - RA;
  return { declination, equation: equation > 12 ? equation - 24 : equation < -12 ? equation + 24 : equation };
};

/**
 * Compute the prayer times for the civil date (year, month 1-12, day) at a location.
 * Returned instants are absolute; the civil date is interpreted at the location's
 * longitude, so pass the date as it is in the location's time zone.
 */
export const computePrayerTimes = (year: number, month: number, day: number, opts: PrayerCalcOptions): PrayerTimes => {
  const method = calcMethodById(opts.method ?? "mwl");
  const lat = opts.latitude;
  const lng = opts.longitude;
  const asrFactor = opts.asr === "hanafi" ? 2 : 1;
  const jDate = julianDay(year, month, day) - lng / (15 * 24);

  const midDay = (t: number) => fixHour(12 - sunPosition(jDate + t).equation);
  const sunAngleTime = (angle: number, t: number, ccw = false) => {
    const decl = sunPosition(jDate + t).declination;
    const noon = midDay(t);
    const x = (-sin(angle) - sin(decl) * sin(lat)) / (cos(decl) * cos(lat));
    const h = arccos(x) / 15;
    return noon + (ccw ? -h : h);
  };
  const asrTime = (factor: number, t: number) => {
    const decl = sunPosition(jDate + t).declination;
    const angle = -arccot(factor + tan(Math.abs(lat - decl)));
    return sunAngleTime(angle, t);
  };

  // Two passes: first with rough day portions, then refined with the first-pass results.
  let t = { fajr: 5 / 24, sunrise: 6 / 24, dhuhr: 12 / 24, asr: 13 / 24, sunset: 18 / 24, maghrib: 18 / 24, isha: 18 / 24 };
  let out = { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, sunset: 0, maghrib: 0, isha: 0 };
  for (let pass = 0; pass < 2; pass++) {
    const riseSet = 0.833;
    out = {
      fajr: sunAngleTime(method.fajrAngle, t.fajr, true),
      sunrise: sunAngleTime(riseSet, t.sunrise, true),
      dhuhr: midDay(t.dhuhr),
      asr: asrTime(asrFactor, t.asr),
      sunset: sunAngleTime(riseSet, t.sunset),
      maghrib: method.maghribAngle ? sunAngleTime(method.maghribAngle, t.maghrib) : sunAngleTime(riseSet, t.sunset),
      isha: method.ishaAngle ? sunAngleTime(method.ishaAngle, t.isha) : sunAngleTime(riseSet, t.sunset),
    };
    t = { fajr: out.fajr / 24, sunrise: out.sunrise / 24, dhuhr: out.dhuhr / 24, asr: out.asr / 24, sunset: out.sunset / 24, maghrib: out.maghrib / 24, isha: out.isha / 24 };
  }

  // Local mean solar hours → UTC hours.
  const tzShift = -lng / 15;
  const h: Record<string, number> = {};
  for (const k of Object.keys(out) as (keyof typeof out)[]) h[k] = out[k] + tzShift;
  if (method.maghribMinutes) h.maghrib = h.sunset + method.maghribMinutes / 60;
  if (method.ishaMinutes) h.isha = h.maghrib + method.ishaMinutes / 60;

  // High latitudes: when twilight never ends, place Fajr/Isha a portion of the night from sunrise/sunset.
  const rule = opts.highLat ?? "night-middle";
  const night = fixHour(h.sunrise + 24 - h.sunset);
  const portion = (angle: number) => (rule === "angle-based" ? (angle / 60) * night : rule === "one-seventh" ? night / 7 : night / 2);
  const fajrGap = fixHour(h.sunrise - h.fajr);
  if (!Number.isFinite(h.fajr) || fajrGap > portion(method.fajrAngle)) h.fajr = h.sunrise - portion(method.fajrAngle);
  const ishaAngle = method.ishaAngle ?? 18;
  const ishaGap = fixHour(h.isha - h.sunset);
  if (!Number.isFinite(h.isha) || ishaGap > portion(ishaAngle)) h.isha = h.sunset + portion(ishaAngle);
  if (method.maghribAngle) {
    const gap = fixHour(h.maghrib - h.sunset);
    if (!Number.isFinite(h.maghrib) || gap > portion(method.maghribAngle)) h.maghrib = h.sunset + portion(method.maghribAngle);
  }

  // Dhuhr is announced a minute after the sun's transit by most authorities.
  h.dhuhr += 1 / 60;

  const base = Date.UTC(year, month - 1, day);
  const toDate = (name: PrayerName) => {
    const minutes = (h[name] + (opts.adjustments?.[name] ?? 0) / 60) * 60;
    return new Date(base + Math.round(minutes) * 60_000);
  };
  return { fajr: toDate("fajr"), sunrise: toDate("sunrise"), dhuhr: toDate("dhuhr"), asr: toDate("asr"), maghrib: toDate("maghrib"), isha: toDate("isha") };
};

/** Year/month/day of an instant in an IANA time zone. */
export const civilDateIn = (date: Date, timeZone: string): { year: number; month: number; day: number } => {
  try {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "numeric", day: "numeric" }).formatToParts(date);
    const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
    return { year: get("year"), month: get("month"), day: get("day") };
  } catch {
    return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
  }
};

export const addDays = (d: { year: number; month: number; day: number }, n: number) => {
  const x = new Date(Date.UTC(d.year, d.month - 1, d.day + n));
  return { year: x.getUTCFullYear(), month: x.getUTCMonth() + 1, day: x.getUTCDate() };
};

/** Prayer times for "today" and "tomorrow" in the location's zone, plus the next prayer from `now`. */
export const prayerSchedule = (now: Date, timeZone: string, opts: PrayerCalcOptions) => {
  const today = civilDateIn(now, timeZone);
  const yesterday = addDays(today, -1);
  const tomorrow = addDays(today, 1);
  const t0 = computePrayerTimes(yesterday.year, yesterday.month, yesterday.day, opts);
  const t1 = computePrayerTimes(today.year, today.month, today.day, opts);
  const t2 = computePrayerTimes(tomorrow.year, tomorrow.month, tomorrow.day, opts);
  const seq: { name: PrayerName; at: Date; day: "yesterday" | "today" | "tomorrow" }[] = [];
  for (const [day, t] of [["yesterday", t0], ["today", t1], ["tomorrow", t2]] as const) for (const name of PRAYER_NAMES) seq.push({ name, at: t[name], day });
  const next = seq.find((s) => s.name !== "sunrise" && s.at.getTime() > now.getTime()) ?? null;
  const prevIdx = next ? seq.indexOf(next) - 1 : seq.length - 1;
  const current = [...seq.slice(0, prevIdx + 1)].reverse().find((s) => s.name !== "sunrise") ?? null;
  return { today: t1, tomorrow: t2, next, current, date: today };
};

export const formatPrayerTime = (d: Date, timeZone: string, locale = "en", hour12?: boolean): string => {
  try {
    return new Intl.DateTimeFormat(locale, { timeZone, hour: "2-digit", minute: "2-digit", hour12 }).format(d);
  } catch {
    return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
  }
};

/** Hijri date (Umm al-Qura) for display; empty string when the runtime lacks the calendar. */
export const hijriDate = (d: Date, locale = "en", timeZone?: string): string => {
  try {
    return new Intl.DateTimeFormat(`${locale}-u-ca-islamic-umalqura`, { timeZone, day: "numeric", month: "long", year: "numeric" }).format(d);
  } catch {
    return "";
  }
};

export const formatCountdown = (ms: number): string => {
  const total = Math.max(0, Math.round(ms / 60_000));
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h > 0 ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}m`;
};
