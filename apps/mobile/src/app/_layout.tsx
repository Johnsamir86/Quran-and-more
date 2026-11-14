import * as Notifications from "expo-notifications";
import { Stack, router } from "expo-router";
import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { I18nManager, Platform, Settings } from "react-native";

import { resolveLocale, localeDir } from "@qam/core";

import { FamilyProvider } from "@/lib/family";
import { configureNotifications } from "@/lib/azan";
import { refreshAllNotifications } from "@/lib/notifications";
import { LocaleProvider, useI18n } from "@/lib/i18n";
import { ThemeProvider, useTheme } from "@/lib/theme";

const deviceLocale = resolveLocale(Intl.DateTimeFormat().resolvedOptions().locale);
if (localeDir(deviceLocale) === "rtl" && !I18nManager.isRTL) {
  I18nManager.allowRTL(true);
}

/** On launch: make sure the azan channel exists, top up scheduled azan notifications, and open the story when one is tapped. */
function AzanBoot() {
  const { locale } = useI18n();
  useEffect(() => {
    configureNotifications().then(() => refreshAllNotifications(locale)).catch(() => undefined);
    const open = (response: Notifications.NotificationResponse) => {
      const url = response.notification.request.content.data?.url;
      if (typeof url === "string") router.push(url as never);
    };
    // CI smoke tests set this with `xcrun simctl spawn <udid> defaults write foundation.quranandmore.app qamSmokeRoute /azan`.
    if (Platform.OS === "ios") {
      try { const r = Settings.get("qamSmokeRoute"); if (typeof r === "string" && r.startsWith("/")) setTimeout(() => router.push(r as never), 400); } catch { /* no defaults */ }
    }
    Notifications.getLastNotificationResponseAsync().then((r) => { if (r) open(r); }).catch(() => undefined);
    const sub = Notifications.addNotificationResponseReceivedListener(open);
    return () => sub.remove();
  }, [locale]);
  return null;
}

function ThemedStack() {
  const { tokens, scheme } = useTheme();
  return (
    <>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerTitleAlign: "center",
          headerStyle: { backgroundColor: tokens.card },
          headerTintColor: tokens.ink,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: tokens.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="read/[chapterId]" options={{ title: "" }} />
        <Stack.Screen name="player" options={{ title: "" }} />
        <Stack.Screen name="mushaf" options={{ title: "" }} />
        <Stack.Screen name="family" options={{ title: "" }} />
        <Stack.Screen name="search" options={{ title: "" }} />
        <Stack.Screen name="study/[verseKey]" options={{ title: "" }} />
        <Stack.Screen name="lessons" options={{ title: "" }} />
        <Stack.Screen name="play" options={{ title: "" }} />
        <Stack.Screen name="hifz" options={{ title: "" }} />
        <Stack.Screen name="ask" options={{ title: "" }} />
        <Stack.Screen name="story" options={{ title: "", headerShown: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <LocaleProvider>
    <ThemeProvider>
    <AzanBoot />
    <FamilyProvider>
      <ThemedStack />
    </FamilyProvider>
    </ThemeProvider>
    </LocaleProvider>
  );
}
