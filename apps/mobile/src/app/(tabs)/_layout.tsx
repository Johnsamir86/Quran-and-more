import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform } from "react-native";

import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";

type IconName = keyof typeof Ionicons.glyphMap;
const ICONS: Record<string, [IconName, IconName]> = {
  index: ["home-outline", "home"],
  quran: ["book-outline", "book"],
  learn: ["school-outline", "school"],
  azan: ["moon-outline", "moon"],
  me: ["person-circle-outline", "person-circle"],
};

/**
 * Five top-level destinations, the same on iOS and Android:
 * Home (today), Quran (read / listen / search), Learn (study, lessons, hifz, play, ask), Azan, Me (profile and settings).
 */
export default function TabsLayout() {
  const { m } = useI18n();
  const { tokens } = useTheme();
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: true,
        headerTitleAlign: "center",
        headerStyle: { backgroundColor: tokens.card },
        headerTintColor: tokens.ink,
        headerShadowVisible: false,
        tabBarActiveTintColor: tokens.accent,
        tabBarInactiveTintColor: tokens.muted,
        tabBarStyle: { backgroundColor: tokens.card, borderTopColor: tokens.line, height: Platform.OS === "ios" ? 84 : 64, paddingTop: 6 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        tabBarIcon: ({ color, focused, size }) => {
          const [off, on] = ICONS[route.name] ?? ICONS.index;
          return <Ionicons name={focused ? on : off} size={size} color={typeof color === "string" ? color : tokens.muted} />;
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: m.nav.home }} />
      <Tabs.Screen name="quran" options={{ title: m.nav.quran }} />
      <Tabs.Screen name="learn" options={{ title: m.nav.learn }} />
      <Tabs.Screen name="azan" options={{ title: m.nav.azan }} />
      <Tabs.Screen name="me" options={{ title: m.nav.me }} />
    </Tabs>
  );
}
