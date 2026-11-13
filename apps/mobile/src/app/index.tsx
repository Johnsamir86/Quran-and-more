import { Link } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { fetchChapters, type ChapterSummary } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { LanguagePicker } from "@/lib/ui";

export default function ChapterListScreen() {
  const { m, locale } = useI18n();
  const [chapters, setChapters] = useState<ChapterSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchChapters(locale)
      .then((r) => setChapters(r.chapters))
      .catch((e: Error) => setError(e.message));
  }, [locale]);

  if (error) return <View style={styles.center}><Text style={styles.error}>{error}</Text></View>;
  if (!chapters) return <View style={styles.center}><ActivityIndicator size="large" /></View>;

  return (
    <FlatList
      data={chapters}
      keyExtractor={(c) => String(c.id)}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: "row", justifyContent: "flex-end" }}><LanguagePicker /></View>
          <Link href="/player" asChild>
            <Pressable style={[styles.row, { backgroundColor: "#1d9e75" }]} accessibilityRole="button">
              <Text style={[styles.name, { color: "#fff" }]}>▶ {m.home.tiles.player.title}: {m.home.tiles.player.sub}</Text>
            </Pressable>
          </Link>
          <Link href="/family" asChild>
            <Pressable style={[styles.row, { backgroundColor: "rgba(29,158,117,0.15)" }]} accessibilityRole="button">
              <Text style={styles.name}>👨‍👩‍👧 {m.home.tiles.family.title}: {m.home.tiles.family.sub}</Text>
            </Pressable>
          </Link>
          <Link href="/mushaf" asChild>
            <Pressable style={[styles.row, { backgroundColor: "#15201b" }]} accessibilityRole="button">
              <Text style={[styles.name, { color: "#fff" }]}>📖 {m.home.tiles.mushaf.title}: {m.home.tiles.mushaf.sub}</Text>
            </Pressable>
          </Link>
          <View style={styles.grid}>
            {([
              ["/search", "🔎", m.nav.search],
              ["/learn", "🎓", m.nav.learn],
              ["/play", "🎮", m.nav.play],
              ["/hifz", "🧠", m.nav.hifz],
              ["/ask", "💬", m.nav.ask],
              ["/azan", "🕌", m.nav.azan],
              ["/story", "✨", m.nav.story],
            ] as const).map(([href, icon, label]) => (
              <Link key={href} href={href} asChild>
                <Pressable style={styles.tile} accessibilityRole="button"><Text style={styles.tileIcon}>{icon}</Text><Text style={styles.tileLabel}>{label}</Text></Pressable>
              </Link>
            ))}
          </View>
        </View>
      }
      renderItem={({ item }) => (
        <Link href={{ pathname: "/read/[chapterId]", params: { chapterId: String(item.id) } }} asChild>
          <Pressable style={styles.row} accessibilityRole="button" accessibilityLabel={`Open surah ${item.nameSimple}`}>
            <View style={styles.badge}><Text style={styles.badgeText}>{item.id}</Text></View>
            <View style={styles.rowBody}>
              <Text style={styles.name}>{item.nameSimple}</Text>
              <Text style={styles.meta}>{item.translatedName} · {item.versesCount} {m.common.ayat} · {item.revelationPlace}</Text>
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
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tile: { flexGrow: 1, minWidth: "30%", alignItems: "center", padding: 12, borderRadius: 14, backgroundColor: "rgba(29,158,117,0.1)", gap: 4 },
  tileIcon: { fontSize: 24 },
  tileLabel: { fontWeight: "600" },
});
