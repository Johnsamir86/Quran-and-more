import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from "react-native";

import { fetchChapters, type ChapterSummary } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { Body, Chip, Muted, Row, useLayout, usePalette } from "@/lib/ui";

type Mode = "read" | "listen";

/** Quran tab: every surah, opened in the mushaf (read) or the player (listen); search and page jump on top. */
export default function QuranScreen() {
  const c = usePalette();
  const layout = useLayout();
  const { m, locale, isAr } = useI18n();
  const [chapters, setChapters] = useState<ChapterSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("listen");
  const [q, setQ] = useState("");
  useEffect(() => { fetchChapters(locale).then((r) => setChapters(r.chapters)).catch((e: Error) => setError(e.message)); }, [locale]);
  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!chapters) return [];
    if (!needle) return chapters;
    return chapters.filter((ch) => ch.nameSimple.toLowerCase().includes(needle) || ch.nameArabic.includes(needle) || ch.translatedName.toLowerCase().includes(needle) || String(ch.id) === needle);
  }, [chapters, q]);

  if (error) return <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}><Text style={{ color: c.bad }}>{error}</Text></View>;
  if (!chapters) return <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}><ActivityIndicator size="large" color={c.accent} /></View>;

  const href = (id: number) => (mode === "listen" ? { pathname: "/player", params: { surah: String(id) } } : { pathname: "/mushaf", params: { surah: String(id) } }) as never;

  return (
    <FlatList
      data={list}
      keyExtractor={(ch) => String(ch.id)}
      style={{ backgroundColor: c.bg }}
      contentContainerStyle={[{ padding: 12, gap: 8, paddingBottom: 40 }, layout.maxContentWidth ? { width: "100%", maxWidth: layout.maxContentWidth, alignSelf: "center" } : null]}
      ListHeaderComponent={
        <View style={{ gap: 10, paddingBottom: 6 }}>
          <Row>
            <Chip label={`▶ ${m.player.play}`} active={mode === "listen"} onPress={() => setMode("listen")} />
            <Chip label={`📖 ${m.nav.mushaf}`} active={mode === "read"} onPress={() => setMode("read")} />
            <Link href="/search" asChild><Chip label={`🔎 ${m.nav.search}`} /></Link>
          </Row>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: c.line, borderRadius: c.radius.pill, paddingHorizontal: 12, backgroundColor: c.card }}>
            <Ionicons name="search-outline" size={18} color={c.muted} />
            <TextInput value={q} onChangeText={setQ} placeholder={m.player.search} placeholderTextColor={c.muted} style={{ flex: 1, paddingVertical: 10, color: c.ink, fontSize: 16 }} />
          </View>
        </View>
      }
      renderItem={({ item }) => (
        <Link href={href(item.id)} asChild>
          <Pressable accessibilityRole="button" accessibilityLabel={`${item.nameSimple}`} style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: c.radius.md, backgroundColor: pressed ? c.surface : c.card, borderWidth: 1, borderColor: c.line })}>
            <View style={{ width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: c.accentSoft }}><Text style={{ fontWeight: "700", color: c.accent }}>{item.id}</Text></View>
            <View style={{ flex: 1 }}>
              <Body style={{ fontWeight: "600" }}>{isAr ? item.nameArabic : item.nameSimple}</Body>
              <Muted>{item.translatedName} · {item.versesCount} {m.common.ayat}</Muted>
            </View>
            <Text style={{ color: c.ink, fontSize: 22, fontWeight: "600", writingDirection: "rtl" }}>{item.nameArabic}</Text>
          </Pressable>
        </Link>
      )}
    />
  );
}
