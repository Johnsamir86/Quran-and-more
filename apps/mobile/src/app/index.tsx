import { Link } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { resolveLocale } from "@qam/core";

import { fetchChapters, type ChapterSummary } from "@/lib/api";

const locale = resolveLocale(Intl.DateTimeFormat().resolvedOptions().locale);

export default function ChapterListScreen() {
  const [chapters, setChapters] = useState<ChapterSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchChapters(locale)
      .then((r) => setChapters(r.chapters))
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error) return <View style={styles.center}><Text style={styles.error}>{error}</Text></View>;
  if (!chapters) return <View style={styles.center}><ActivityIndicator size="large" /></View>;

  return (
    <FlatList
      data={chapters}
      keyExtractor={(c) => String(c.id)}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <Link href={{ pathname: "/read/[chapterId]", params: { chapterId: String(item.id) } }} asChild>
          <Pressable style={styles.row} accessibilityRole="button" accessibilityLabel={`Open surah ${item.nameSimple}`}>
            <View style={styles.badge}><Text style={styles.badgeText}>{item.id}</Text></View>
            <View style={styles.rowBody}>
              <Text style={styles.name}>{item.nameSimple}</Text>
              <Text style={styles.meta}>{item.translatedName} · {item.versesCount} ayahs · {item.revelationPlace}</Text>
            </View>
            <Text style={styles.arabic}>{item.nameArabic}</Text>
          </Pressable>
        </Link>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  error: { color: "#b91c1c", textAlign: "center" },
  list: { padding: 12, gap: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, backgroundColor: "rgba(85,213,255,0.08)" },
  badge: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: "#55d5ff" },
  badgeText: { fontWeight: "700", color: "#020617" },
  rowBody: { flex: 1 },
  name: { fontSize: 17, fontWeight: "600" },
  meta: { fontSize: 12, opacity: 0.7, marginTop: 2 },
  arabic: { fontSize: 22, fontWeight: "600", writingDirection: "rtl" },
});
