import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { AZAN_PRAYERS, AZAN_STORAGE_KEY, DEFAULT_AZAN_SETTINGS, addDays, asrForCountry, civilDateIn, computePrayerTimes, getMessages, methodForCountry, normalizeAzanSettings, resolveCalc, type AzanSettings, type Messages } from "@qam/core";

/** Azan on the phone: settings in AsyncStorage, location from the device, local notifications per prayer. */

export const loadAzanSettings = async (): Promise<AzanSettings> => {
  try {
    const raw = await AsyncStorage.getItem(AZAN_STORAGE_KEY);
    if (raw) return normalizeAzanSettings(JSON.parse(raw));
  } catch { /* fall through */ }
  return { ...DEFAULT_AZAN_SETTINGS, timeZone: deviceTimeZone() };
};
export const saveAzanSettings = (s: AzanSettings) => AsyncStorage.setItem(AZAN_STORAGE_KEY, JSON.stringify(s)).catch(() => undefined);
export const hasSavedAzanSettings = async () => Boolean(await AsyncStorage.getItem(AZAN_STORAGE_KEY).catch(() => null));

export const deviceTimeZone = (): string => {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"; } catch { return "UTC"; }
};

export interface CityHit { name: string; admin: string | null; country: string; countryCode: string; latitude: number; longitude: number; timeZone: string }

export const geocodeCity = async (query: string, locale = "en"): Promise<CityHit[]> => {
  const q = query.trim();
  if (q.length < 2) return [];
  const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=8&language=${encodeURIComponent(locale.split("-")[0])}&format=json`);
  if (!res.ok) return [];
  const json = (await res.json()) as { results?: { name: string; admin1?: string; country?: string; country_code?: string; latitude: number; longitude: number; timezone?: string }[] };
  return (json.results ?? []).map((r) => ({ name: r.name, admin: r.admin1 ?? null, country: r.country ?? "", countryCode: (r.country_code ?? "").toUpperCase(), latitude: r.latitude, longitude: r.longitude, timeZone: r.timezone ?? deviceTimeZone() }));
};

/** Device GPS + on-device reverse geocoding (no third-party service). */
export const detectLocation = async (): Promise<Pick<AzanSettings, "latitude" | "longitude" | "timeZone" | "city" | "countryCode"> | null> => {
  const perm = await Location.requestForegroundPermissionsAsync();
  if (perm.status !== "granted") return null;
  const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  const { latitude, longitude } = pos.coords;
  let city = `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
  let countryCode = "";
  try {
    const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (place) { city = place.city || place.subregion || place.region || city; countryCode = (place.isoCountryCode ?? "").toUpperCase(); }
  } catch { /* keep coordinates */ }
  return { latitude, longitude, timeZone: deviceTimeZone(), city, countryCode };
};

// ---- notifications ----
export const AZAN_CHANNEL = "azan";
const SCHEDULE_DAYS = 3;

export const configureNotifications = async () => {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
  });
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(AZAN_CHANNEL, {
      name: "Azan",
      importance: Notifications.AndroidImportance.MAX,
      sound: "azan.wav",
      vibrationPattern: [0, 300, 150, 300, 150, 600],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: false,
    }).catch(() => undefined);
  }
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const asked = await Notifications.requestPermissionsAsync({ ios: { allowAlert: true, allowSound: true, allowBadge: false } });
  return asked.granted;
};

/**
 * (Re)schedule one local notification per enabled prayer for the next few days.
 * Called whenever settings change and on every app start, so the list never runs dry.
 */
export const scheduleAzanNotifications = async (s: AzanSettings, locale: string): Promise<number> => {
  await Notifications.cancelAllScheduledNotificationsAsync().catch(() => undefined);
  if (!s.notifications) return 0;
  const m: Messages = getMessages(locale);
  const calc = resolveCalc(s, methodForCountry, asrForCountry);
  const now = Date.now();
  let day = civilDateIn(new Date(), s.timeZone);
  let count = 0;
  for (let i = 0; i < SCHEDULE_DAYS; i++) {
    const times = computePrayerTimes(day.year, day.month, day.day, calc);
    for (const p of AZAN_PRAYERS) {
      if (!s.prayers[p] || times[p].getTime() <= now + 30_000) continue;
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `${m.azan.prayers[p]} · ${s.city}`,
          body: m.story.title,
          sound: "azan.wav",
          data: { url: `/story?prayer=${p}&azan=1`, prayer: p },
          ...(Platform.OS === "android" ? { channelId: AZAN_CHANNEL } : {}),
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: times[p], channelId: AZAN_CHANNEL },
      }).catch(() => undefined);
      count += 1;
    }
    day = addDays(day, 1);
  }
  return count;
};

/** Background task is not needed: notifications are local. Call on app start to top the schedule up. */
export const refreshAzanSchedule = async (locale: string) => {
  try {
    const s = await loadAzanSettings();
    if (s.notifications) await scheduleAzanNotifications(s, locale);
  } catch { /* best effort */ }
};
