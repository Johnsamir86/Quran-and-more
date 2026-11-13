import * as Notifications from "expo-notifications";
import { Stack, router } from "expo-router";
import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { I18nManager, useColorScheme } from "react-native";

import { resolveLocale, localeDir } from "@qam/core";

import { FamilyProvider } from "@/lib/family";
import { configureNotifications, refreshAzanSchedule } from "@/lib/azan";
import { LocaleProvider, useI18n } from "@/lib/i18n";

const deviceLocale = resolveLocale(Intl.DateTimeFormat().resolvedOptions().locale);
if (localeDir(deviceLocale) === "rtl" && !I18nManager.isRTL) {
  I18nManager.allowRTL(true);
}

/** On launch: make sure the azan channel exists, top up scheduled azan notifications, and open the story when one is tapped. */
function AzanBoot() {
  const { locale } = useI18n();
  useEffect(() => {
    configureNotifications().then(() => refreshAzanSchedule(locale)).catch(() => undefined);
    const open = (response: Notifications.NotificationResponse) => {
      const url = response.notification.request.content.data?.url;
      if (typeof url === "string") router.push(url as never);
    };
    Notifications.getLastNotificationResponseAsync().then((r) => { if (r) open(r); }).catch(() => undefined);
    const sub = Notifications.addNotificationResponseReceivedListener(open);
    return () => sub.remove();
  }, [locale]);
  return null;
}

export default function RootLayout() {
  const scheme = useColorScheme();
  return (
    <LocaleProvider>
    <AzanBoot />
    <FamilyProvider>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerTitleAlign: "center",
          headerStyle: { backgroundColor: scheme === "dark" ? "#0b1228" : "#ffffff" },
          headerTintColor: scheme === "dark" ? "#e5e7eb" : "#0b1228",
        }}
      >
        <Stack.Screen name="index" options={{ title: "Quran and More" }} />
        <Stack.Screen name="read/[chapterId]" options={{ title: "" }} />
        <Stack.Screen name="player" options={{ title: "" }} />
        <Stack.Screen name="mushaf" options={{ title: "" }} />
        <Stack.Screen name="family" options={{ title: "" }} />
        <Stack.Screen name="search" options={{ title: "" }} />
        <Stack.Screen name="study/[verseKey]" options={{ title: "" }} />
        <Stack.Screen name="learn" options={{ title: "" }} />
        <Stack.Screen name="play" options={{ title: "" }} />
        <Stack.Screen name="hifz" options={{ title: "" }} />
        <Stack.Screen name="ask" options={{ title: "" }} />
        <Stack.Screen name="azan" options={{ title: "" }} />
        <Stack.Screen name="story" options={{ title: "", headerShown: false }} />
      </Stack>
    </FamilyProvider>
    </LocaleProvider>
  );
}
