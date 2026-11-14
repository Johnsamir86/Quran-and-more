import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { getMessages } from "@qam/core";

import { AZAN_CHANNEL, refreshAzanSchedule } from "./azan";
import { loadNotificationPrefs, setNotificationPrefsListener, type NotificationPrefs } from "./prefs";

/**
 * Non-azan notifications. Android channels (each with its own sound and importance):
 *  - azan       azan.wav   (see lib/azan.ts)
 *  - daily      chime.wav  ayah of the day at the chosen time
 *  - reminders  chime.wav  memorisation review, streak
 *  - family     chime.wav  family activity (opt-in)
 * iOS uses the same sound files per notification; categories give the actions.
 */
export const CHANNELS = { daily: "daily", reminders: "reminders", family: "family" } as const;
const IDS = { daily: "qam-daily", hifz: "qam-hifz", streak: "qam-streak" } as const;

export const configureChannels = async () => {
  if (Platform.OS !== "android") return;
  const base = { vibrationPattern: [0, 200, 100, 200], lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC };
  await Notifications.setNotificationChannelAsync(CHANNELS.daily, { name: "Ayah of the day", importance: Notifications.AndroidImportance.DEFAULT, sound: "chime.wav", ...base }).catch(() => undefined);
  await Notifications.setNotificationChannelAsync(CHANNELS.reminders, { name: "Reminders", importance: Notifications.AndroidImportance.DEFAULT, sound: "chime.wav", ...base }).catch(() => undefined);
  await Notifications.setNotificationChannelAsync(CHANNELS.family, { name: "Family", importance: Notifications.AndroidImportance.LOW, sound: "chime.wav", ...base }).catch(() => undefined);
};

const sound = (p: NotificationPrefs) => (p.sound === "silent" ? undefined : "chime.wav");
const hm = (s: string) => { const [h, m] = s.split(":").map(Number); return { hour: Number.isFinite(h) ? h : 7, minute: Number.isFinite(m) ? m : 30 }; };

/** Replace the repeating non-azan notifications according to the preferences. Azan schedules are untouched. */
export const scheduleReminders = async (locale: string, prefs?: NotificationPrefs) => {
  const p = prefs ?? (await loadNotificationPrefs());
  const m = getMessages(locale);
  const scheduled = await Notifications.getAllScheduledNotificationsAsync().catch(() => []);
  for (const n of scheduled) if (Object.values(IDS).includes(n.identifier as never)) await Notifications.cancelScheduledNotificationAsync(n.identifier).catch(() => undefined);
  const perm = await Notifications.getPermissionsAsync();
  if (!perm.granted) return;
  const daily = (identifier: string, channelId: string, title: string, body: string, time: string, url: string) =>
    Notifications.scheduleNotificationAsync({
      identifier,
      content: { title, body, sound: sound(p), data: { url }, ...(Platform.OS === "android" ? { channelId } : {}) },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, ...hm(time), channelId },
    }).catch(() => undefined);
  if (p.daily) await daily(IDS.daily, CHANNELS.daily, m.story.title, m.story.reflectPrompt, p.dailyTime, "/story");
  if (p.hifz) await daily(IDS.hifz, CHANNELS.reminders, m.hifz.title, m.hifz.due, "18:30", "/hifz");
  if (p.streak) await daily(IDS.streak, CHANNELS.reminders, m.common.appName, m.family.continue, "20:30", "/");
};

/** On launch: channels, azan top-up, reminders; later preference changes reschedule automatically. */
export const refreshAllNotifications = async (locale: string) => {
  setNotificationPrefsListener((p) => { void scheduleReminders(locale, p); });
  await configureChannels();
  await refreshAzanSchedule(locale);
  await scheduleReminders(locale);
};

export const sendTestNotification = async (locale: string) => {
  const p = await loadNotificationPrefs();
  const m = getMessages(locale);
  await Notifications.scheduleNotificationAsync({
    content: { title: m.common.appName, body: m.settings.notifTest, sound: sound(p), data: { url: "/" }, ...(Platform.OS === "android" ? { channelId: CHANNELS.reminders } : {}) },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 2, channelId: CHANNELS.reminders },
  });
};
