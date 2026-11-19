import type { AsrJuristic, CalcMethodId, HighLatRule, PrayerName } from "./prayer-times";

/**
 * Azan (call to prayer) recordings. Streamed from Islamic Network's CDN (the
 * Aladhan project); Islamic Network confirmed on its community forum that the
 * recordings may be bundled or streamed in apps without attribution.
 * See docs/FEATURES.md → Azan.
 */
export interface Muezzin { id: string; name: string; url: string; country?: string }

const A = (n: number) => `https://cdn.aladhan.com/audio/adhans/a${n}.mp3`;

export const MUEZZINS: Muezzin[] = [
  { id: "alafasy", name: "Mishary Rashid Alafasy", url: A(4), country: "KW" },
  { id: "alafasy-2", name: "Mishary Rashid Alafasy (2)", url: A(7), country: "KW" },
  { id: "alafasy-3", name: "Mishary Rashid Alafasy (3)", url: A(9), country: "KW" },
  { id: "nafees", name: "Ahmad al-Nafees", url: A(1), country: "KW" },
  { id: "ozcan", name: "Hafiz Mustafa Özcan", url: A(2), country: "TR" },
  { id: "aladhan-5", name: "Aladhan collection 5", url: A(5) },
  { id: "aladhan-6", name: "Aladhan collection 6", url: A(6) },
  { id: "aladhan-8", name: "Aladhan collection 8", url: A(8) },
  { id: "aladhan-10", name: "Aladhan collection 10", url: A(10) },
];
export const DEFAULT_MUEZZIN = "alafasy";
export const muezzinById = (id: string | null | undefined): Muezzin => MUEZZINS.find((m) => m.id === id) ?? MUEZZINS[0];

/** Everything the azan feature needs to compute and announce prayer times for one person/device. */
export interface AzanSettings {
  latitude: number;
  longitude: number;
  timeZone: string;
  city: string;
  countryCode: string;
  /** "auto" picks the method for the country. */
  method: CalcMethodId | "auto";
  asr: AsrJuristic | "auto";
  highLat: HighLatRule;
  muezzin: string;
  /** Which prayers get an azan / notification. */
  prayers: Record<Exclude<PrayerName, "sunrise">, boolean>;
  /** Play the full azan inside the app when it is open at prayer time. */
  playInApp: boolean;
  notifications: boolean;
}

export const DEFAULT_AZAN_SETTINGS: AzanSettings = {
  latitude: 21.4225,
  longitude: 39.8262,
  timeZone: "Asia/Riyadh",
  city: "Makkah",
  countryCode: "SA",
  method: "auto",
  asr: "auto",
  highLat: "night-middle",
  muezzin: DEFAULT_MUEZZIN,
  prayers: { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true },
  playInApp: true,
  notifications: false,
};

export const AZAN_STORAGE_KEY = "qam.azan.v1";

/** Validate a stored/posted settings object, filling gaps with defaults. */
export const normalizeAzanSettings = (raw: unknown): AzanSettings => {
  const r = (raw && typeof raw === "object" ? raw : {}) as Partial<AzanSettings>;
  const num = (v: unknown, d: number) => (typeof v === "number" && Number.isFinite(v) ? v : d);
  const str = (v: unknown, d: string) => (typeof v === "string" && v.length < 120 ? v : d);
  const d = DEFAULT_AZAN_SETTINGS;
  return {
    latitude: Math.max(-89.9, Math.min(89.9, num(r.latitude, d.latitude))),
    longitude: Math.max(-180, Math.min(180, num(r.longitude, d.longitude))),
    timeZone: str(r.timeZone, d.timeZone),
    city: str(r.city, d.city),
    countryCode: str(r.countryCode, d.countryCode).toUpperCase().slice(0, 2),
    method: str(r.method, d.method) as AzanSettings["method"],
    asr: (r.asr === "hanafi" || r.asr === "standard" ? r.asr : "auto"),
    highLat: (r.highLat === "one-seventh" || r.highLat === "angle-based" ? r.highLat : "night-middle"),
    muezzin: muezzinById(r.muezzin).id,
    prayers: { ...d.prayers, ...(r.prayers && typeof r.prayers === "object" ? r.prayers : {}) },
    playInApp: r.playInApp !== false,
    notifications: r.notifications === true,
  };
};

/** Resolve "auto" choices into concrete calculation options. */
export const resolveCalc = (s: AzanSettings, methodForCountry: (c: string) => CalcMethodId, asrForCountry: (c: string) => AsrJuristic) => ({
  latitude: s.latitude,
  longitude: s.longitude,
  method: s.method === "auto" ? methodForCountry(s.countryCode) : s.method,
  asr: s.asr === "auto" ? asrForCountry(s.countryCode) : s.asr,
  highLat: s.highLat,
});

/**
 * Curated "ayah of the day" pool: complete, self-standing ayat that read well on
 * their own (promises, supplications, reminders), rotated by day so the whole
 * family sees the same ayah. The study page links to the full context.
 */
export const AYAH_OF_DAY_KEYS: string[] = [
  "1:5", "2:152", "2:153", "2:186", "2:201", "2:216", "2:255", "2:286", "3:8", "3:26", "3:139", "3:159", "3:173", "3:185", "3:190", "3:200",
  "4:36", "4:58", "4:110", "5:2", "5:3", "6:17", "6:59", "6:162", "7:23", "7:55", "7:56", "7:199", "8:2", "8:46", "9:51", "9:128", "9:129",
  "10:57", "10:62", "11:88", "11:114", "12:64", "12:86", "12:87", "13:11", "13:28", "14:7", "14:34", "14:40", "15:49", "16:18", "16:90", "16:97", "16:128",
  "17:23", "17:24", "17:37", "17:80", "17:82", "18:10", "18:46", "18:109", "18:110", "19:96", "20:14", "20:25", "20:114", "21:35", "21:83", "21:87", "21:107",
  "22:46", "23:97", "23:118", "24:35", "25:63", "25:74", "26:80", "27:19", "27:62", "28:24", "28:56", "28:77", "29:2", "29:45", "29:69", "30:21", "30:60",
  "31:17", "31:18", "31:19", "33:35", "33:41", "33:56", "33:70", "35:28", "36:58", "36:82", "39:10", "39:53", "40:44", "40:60", "41:30", "41:34", "42:30",
  "42:36", "43:67", "44:58", "45:13", "47:7", "48:4", "49:10", "49:12", "49:13", "50:16", "51:56", "53:39", "54:17", "55:13", "55:60", "57:4", "57:20", "58:11",
  "59:19", "59:22", "59:23", "59:24", "64:11", "65:2", "65:3", "66:8", "67:2", "73:8", "74:7", "87:14", "93:5", "93:11", "94:5", "94:6", "96:1", "97:3", "103:2", "103:3", "110:3", "112:1", "112:2", "112:3", "112:4",
];

/** Deterministic daily pick (same ayah for everyone on a given UTC day). */
export const ayahOfDayKey = (day: string, hash: (s: string) => number): string => AYAH_OF_DAY_KEYS[Math.abs(hash(`ayah-of-the-day:${day}`)) % AYAH_OF_DAY_KEYS.length];
