import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";

import { fetchReader, type ReaderPayload } from "@/lib/api";

export default function ReaderScreen() {
  const { chapterId } = useLocalSearchParams<{ chapterId: string }>();
  const [data, setData] = useState<ReaderPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!chapterId) return;
    fetchReader(chapterId).then(setData).catch((e: Error) => setError(e.message));
  }, [chapterId]);

  if (error) return <View style={styles.center}><Text style={styles.error}>{error}</Text></View>;
  if (!data) return <View style={styles.center}><ActivityIndicator size="large" /></View>;

  return (
    <>
      <Stack.Screen options={{ title: `${data.chapter.nameSimple} · ${data.chapter.nameArabic}` }} />
      <FlatList
        data={data.verses}
        keyExtractor={(v) => v.verseKey}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          data.chapter.id !== 1 && data.chapter.id !== 9 ? (
            <Text style={styles.basmala}>بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ</Text>
          ) : undefined
        }
        renderItem={({ item }) => (
          <View style={styles.verse}>
            <Text style={styles.arabic} accessibilityLanguage="ar">
              {item.arabicText} <Text style={styles.marker}>﴿{item.verseNumber}﴾</Text>
            </Text>
            {item.translationText ? <Text style={styles.translation}>{item.translationText}</Text> : null}
          </View>
        )}
      />
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  error: { color: "#b91c1c", textAlign: "center" },
  list: { padding: 16, gap: 18 },
  basmala: { fontSize: 28, textAlign: "center", marginBottom: 12, writingDirection: "rtl" },
  verse: { gap: 8, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(127,127,127,0.4)" },
  arabic: { fontSize: 28, lineHeight: 52, textAlign: "right", writingDirection: "rtl" },
  marker: { fontSize: 18, color: "#55d5ff" },
  translation: { fontSize: 16, lineHeight: 24, opacity: 0.85 },
});
