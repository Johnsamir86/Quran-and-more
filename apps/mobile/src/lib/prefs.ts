import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

let onChange: ((p: NotificationPrefs) => void) | null = null;
/** lib/notifications registers the rescheduler here to avoid an import cycle. */
export const setNotificationPrefsListener = (fn: (p: NotificationPrefs) => void) => { onChange = fn; };

/** Notification preferences for everything that is not the azan (that lives in AzanSettings). */
export interface NotificationPrefs {
  daily: boolean;
  /** "HH:MM" local time for the ayah of the day */
  dailyTime: string;
  hifz: boolean;
  family: boolean;
  streak: boolean;
  sound: "chime" | "silent";
}
export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = { daily: true, dailyTime: "07:30", hifz: true, family: false, streak: true, sound: "chime" };
export const NOTIF_PREFS_KEY = "qam.notif.v1";

export const loadNotificationPrefs = async (): Promise<NotificationPrefs> => {
  try { const raw = await AsyncStorage.getItem(NOTIF_PREFS_KEY); return raw ? { ...DEFAULT_NOTIFICATION_PREFS, ...(JSON.parse(raw) as Partial<NotificationPrefs>) } : DEFAULT_NOTIFICATION_PREFS; } catch { return DEFAULT_NOTIFICATION_PREFS; }
};
export const saveNotificationPrefs = (p: NotificationPrefs) => AsyncStorage.setItem(NOTIF_PREFS_KEY, JSON.stringify(p)).catch(() => undefined);

export const useNotificationPrefs = () => {
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_NOTIFICATION_PREFS);
  useEffect(() => { loadNotificationPrefs().then(setPrefs); }, []);
  const update = useCallback((patch: Partial<NotificationPrefs>) => setPrefs((p) => { const next = { ...p, ...patch }; void saveNotificationPrefs(next); onChange?.(next); return next; }), []);
  return { prefs, update };
};
