import { Link, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, TextInput, View } from "react-native";

import { search, type SearchResult } from "@/lib/study-api";
import { Arabic, Button, Card, Chip, ErrorBox, H1, Kicker, Loading, Muted, Pill, Row, Screen, StudyNav, isAr, locale, num, usePalette } from "@/lib/ui";

const T = isAr
  ? { title: "بحث في القرآن", hint: "كلمة، عبارة، أو مفتاح آية مثل 2:255", go: "ابحث", quick: "سريع", advanced: "متقدّم", results: "نتيجة", none: "لا نتائج", nav: "انتقال", page: "صفحة", more: "المزيد", source: "المصدر" }
  : { title: "Search the Quran", hint: "A word, a phrase, or an ayah key like 2:255", go: "Search", quick: "Quick", advanced: "Advanced", results: "results", none: "No results", nav: "Jump to", page: "page", more: "More", source: "source" };

export default function SearchScreen() {
  const c = usePalette();
  const { q: initial } = useLocalSearchParams<{ q?: string }>();
  const [q, setQ] = useState(initial ?? "");
  const [mode, setMode] = useState<"quick" | "advanced">("quick");
  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (page = 1, append = false) => {
    const query = q.trim(); if (!query) return;
    setLoading(true); setError(null);
    try {
      const r = await search(query, locale, mode, page);
      setResult((prev) => (append && prev ? { ...r, verses: [...prev.verses, ...r.verses] } : r));
    } catch (e) { setError((e as Error).message); } finally { setLoading(false); }
  };
  useEffect(() => { if (initial) void run(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [initial]);

  return (
    <Screen>
      <Stack.Screen options={{ title: T.title }} />
      <StudyNav current="search" />
      <Card>
        <Kicker>Quran Foundation Search API</Kicker>
        <H1>{T.title}</H1>
        <TextInput value={q} onChangeText={setQ} placeholder={T.hint} placeholderTextColor={c.muted} returnKeyType="search" onSubmitEditing={() => run()} style={{ borderWidth: 1, borderColor: c.line, borderRadius: 14, padding: 12, color: c.ink, backgroundColor: c.card, fontSize: 16 }} />
        <Row style={{ justifyContent: "space-between" }}>
          <Row><Chip label={T.quick} active={mode === "quick"} onPress={() => setMode("quick")} /><Chip label={T.advanced} active={mode === "advanced"} onPress={() => setMode("advanced")} /></Row>
          <Button label={T.go} onPress={() => run()} disabled={loading || !q.trim()} />
        </Row>
      </Card>
      {loading && !result ? <Loading /> : null}
      {error ? <ErrorBox message={error} /> : null}
      {result ? (
        <>
          {result.navigation.length ? (
            <Card>
              <Kicker>{T.nav}</Kicker>
              <Row>{result.navigation.map((n) => (
                <Link key={`${n.type}:${n.key}`} href={navHref(n) as never} asChild><Chip label={`${n.label}`} /></Link>
              ))}</Row>
            </Card>
          ) : null}
          <Row style={{ justifyContent: "space-between" }}><Pill>{num(result.pagination.total)} {T.results}</Pill><Muted>{T.source}: {result.source === "qf" ? "Quran Foundation" : "Quran.com v4"}</Muted></Row>
          {result.verses.length === 0 && result.navigation.length === 0 ? <Muted>{T.none}</Muted> : null}
          {result.verses.map((v) => (
            <Link key={v.verseKey} href={{ pathname: "/study/[verseKey]", params: { verseKey: v.verseKey } } as never} asChild>
              <Pressable>
                <Card>
                  <Row style={{ justifyContent: "space-between" }}><Pill>{v.verseKey}</Pill>{v.translationName ? <Muted>{v.translationName}</Muted> : null}</Row>
                  <Arabic size={24}>{v.text}</Arabic>
                  {v.translation ? <Muted>{v.translation}</Muted> : null}
                </Card>
              </Pressable>
            </Link>
          ))}
          {result.pagination.nextPage ? <Button label={loading ? "…" : T.more} ghost disabled={loading} onPress={() => run(result.pagination.nextPage ?? 1, true)} /> : null}
          <View style={{ height: 20 }} />
        </>
      ) : null}
    </Screen>
  );
}

const navHref = (n: { type: string; key: string }) => {
  if (n.type === "ayah") return { pathname: "/study/[verseKey]", params: { verseKey: n.key } };
  if (n.type === "surah") return { pathname: "/player", params: { surah: n.key } };
  if (n.type === "page") return { pathname: "/mushaf", params: { page: n.key } };
  if (n.type === "juz") return { pathname: "/mushaf", params: { juz: n.key } };
  return { pathname: "/search", params: { q: n.key } };
};
