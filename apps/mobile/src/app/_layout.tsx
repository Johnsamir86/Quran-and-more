import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { I18nManager, useColorScheme } from "react-native";

import { resolveLocale, localeDir } from "@qam/core";

import { FamilyProvider } from "@/lib/family";
import { LocaleProvider } from "@/lib/i18n";

const deviceLocale = resolveLocale(Intl.DateTimeFormat().resolvedOptions().locale);
if (localeDir(deviceLocale) === "rtl" && !I18nManager.isRTL) {
  I18nManager.allowRTL(true);
}

export default function RootLayout() {
  const scheme = useColorScheme();
  return (
    <LocaleProvider>
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
