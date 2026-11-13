import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Font from "expo-font";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, useColorScheme, useWindowDimensions } from "react-native";

import { DEFAULT_MUSHAF_LAYOUT, MUSHAF_LAYOUTS, mushafLayoutById, type MushafPage, type MushafWord } from "@qam/core";

import { API_BASE_URL } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
const loaded = new Set<string>();
const ensureFont = async (family: string, url: string) => {
  if (loaded.has(family)) return;
  await Font.loadAsync({ [family]: { uri: url } });
  loaded.add(family);
};
const fetchPage = async (page: number, layout: string): Promise<MushafPage> => {
  const res = await fetch(`${API_BASE_URL}/api/public/v1/mushaf/page/${page}?layout=${layout}`);
  if (!res.ok) throw new Error(`page ${page} failed (${res.status})`);
  return (await res.json()) as MushafPage;
};

export default function MushafScreen() {
  const router = useRouter();
  const { m, isAr: ar, num: digits, isRtl } = useI18n();
  const t = m.mushaf;
  const params = useLocalSearchParams<{ page?: string; layout?: string }>();
  const dark = useColorScheme() === "dark";
  const { width } = useWindowDimensions();
  const c = dark ? { bg: "#0d1512", paper: "#15211c", ink: "#ece9dd", muted: "#9fb0a7", line: "rgba(236,233,221,0.14)", accent: "#1d9e75" } : { bg: "#f6f3ea", paper: "#fffdf6", ink: "#15201b", muted: "#5d6a63", line: "rgba(21,32,27,0.12)", accent: "#1d9e75" };
  const [layoutId, setLayoutId] = useState(params.layout ?? DEFAULT_MUSHAF_LAYOUT);
  const [page, setPage] = useState(Number(params.page) || 1);
  const [data, setData] = useState<MushafPage | null>(null);
  const [fontReady, setFontReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<MushafWord | null>(null);
  const [pickLayout, setPickLayout] = useState(false);
  const layout = mushafLayoutById(layoutId);
  const cache = useRef(new Map<string, MushafPage>());

  useEffect(() => { (async () => { try { const l = await AsyncStorage.getItem("qam.mushaf.layout"); const p = await AsyncStorage.getItem("qam.mushaf.page"); if (!params.layout && l) setLayoutId(l); if (!params.page && p) setPage(Number(p) || 1); } catch { /* ignore */ } })(); }, [params.layout, params.page]);
  useEffect(() => { AsyncStorage.multiSet([["qam.mushaf.layout", layoutId], ["qam.mushaf.page", String(page)]]).catch(() => undefined); }, [layoutId, page]);

  useEffect(() => {
    let cancelled = false;
    setError(null); setFontReady(false);
    (async () => {
      try {
        const key = `${layoutId}:${page}`;
        const d = cache.current.get(key) ?? (await fetchPage(page, layoutId));
        cache.current.set(key, d);
        if (cancelled) return;
        setData(d);
        await ensureFont(d.fontFamily, d.fontUrl).catch(() => undefined);
        if (!cancelled) setFontReady(true);
        for (const n of [page + 1, page - 1]) if (n >= 1 && n <= layout.pages && !cache.current.has(`${layoutId}:${n}`)) fetchPage(n, layoutId).then((pd) => { cache.current.set(`${layoutId}:${n}`, pd); ensureFont(pd.fontFamily, pd.fontUrl).catch(() => undefined); }).catch(() => undefined);
      } catch (e) { if (!cancelled) setError((e as Error).message); }
    })();
    return () => { cancelled = true; };
  }, [page, layoutId, layout.pages]);

  const go = useCallback((n: number) => { if (n >= 1 && n <= layout.pages) { setSelected(null); setPage(n); } }, [layout.pages]);
  const paperW = Math.min(width - 24, 620);
  const fontSize = paperW * (layout.glyph === "textIndopak" ? 0.040 : 0.046);
  const family = fontReady && data ? data.fontFamily : undefined;
  const showText = !fontReady || layout.fontKind === "static-font";
  const lines = useMemo(() => data?.lines ?? [], [data]);
  const lastLine = lines.filter((l) => l.words.length).map((l) => l.number).pop();

  return (
    <View style={[st.root, { backgroundColor: c.bg }]}>
      <Stack.Screen options={{ title: data?.surahs.map((s) => `${t.surah} ${s.nameArabic}`).join(" · ") || t.title }} />
      <View style={st.topRow}>
        <Pressable onPress={() => setPickLayout((v) => !v)} style={[st.chip, { borderColor: c.line, backgroundColor: c.paper }]}><Text style={{ color: c.ink, fontSize: 13 }}>{layout.label[ar ? "ar" : "en"]} ▾</Text></Pressable>
        <Pressable onPress={() => router.push({ pathname: "/player", params: { surah: String(data?.surahs[0]?.number ?? 1) } })} style={[st.chip, { borderColor: c.line, backgroundColor: c.paper }]}><Text style={{ color: c.ink, fontSize: 13 }}>▶ {t.player}</Text></Pressable>
      </View>
      {pickLayout ? (
        <View style={[st.picker, { backgroundColor: c.paper, borderColor: c.line }]}>
          {MUSHAF_LAYOUTS.map((l) => <Pressable key={l.id} onPress={() => { setLayoutId(l.id); setPage((p) => Math.min(p, l.pages)); setPickLayout(false); }} style={[st.pickRow, { borderColor: l.id === layoutId ? c.accent : c.line }]}><Text style={{ color: c.ink }}>{l.label[ar ? "ar" : "en"]}</Text></Pressable>)}
        </View>
      ) : null}

      <ScrollView contentContainerStyle={{ alignItems: "center", padding: 12, paddingBottom: 120 }}>
        {error ? (
          <View style={st.center}><Text style={{ color: c.muted }}>{error}</Text><Pressable onPress={() => go(page)} style={[st.chip, { borderColor: c.line, marginTop: 10 }]}><Text style={{ color: c.ink }}>{t.tryAgain}</Text></Pressable></View>
        ) : !data ? <ActivityIndicator size="large" color={c.accent} style={{ marginTop: 60 }} /> : (
          <View style={[st.paper, { width: paperW, height: paperW * 1.52, backgroundColor: c.paper, borderColor: c.line, paddingHorizontal: paperW * 0.055, paddingVertical: paperW * 0.045 }]}>
            {lines.map((line) => {
              if (line.kind === "surah-header") { const s = data.surahs.find((x) => x.number === line.surahNumber); return <View key={line.number} style={[st.line, st.headerLine, { borderColor: c.accent }]}><Text style={{ color: c.accent, fontWeight: "700", fontSize: paperW * 0.034 }}>{t.surah} {s?.nameArabic ?? line.surahNumber}</Text></View>; }
              if (line.kind === "basmala") return <View key={line.number} style={[st.line, { justifyContent: "center" }]}><Text style={{ color: c.ink, fontSize: paperW * 0.044, writingDirection: "rtl" }}>بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ</Text></View>;
              const centered = line.number === lastLine && line.words.length < 4;
              return (
                <View key={line.number} style={[st.line, centered && { justifyContent: "center", gap: 6 }]}>
                  {line.words.map((w) => (
                    <Pressable key={`${w.verseKey}-${w.position}`} onPress={() => setSelected(selected?.verseKey === w.verseKey && selected.position === w.position ? null : w)} style={selected?.verseKey === w.verseKey ? { backgroundColor: "rgba(29,158,117,0.22)", borderRadius: 4 } : undefined}>
                      <Text style={{ color: c.ink, fontSize, fontFamily: family, opacity: fontReady ? 1 : 0.4, writingDirection: "rtl" }}>{showText ? w.text : w.glyph}</Text>
                    </Pressable>
                  ))}
                </View>
              );
            })}
            <Text style={[st.pageNum, { color: c.muted }]}>{digits(page)}</Text>
          </View>
        )}
      </ScrollView>

      <View style={[st.bottom, { backgroundColor: c.paper, borderColor: c.line }]}>
        {selected ? (
          <View style={[st.tip, { borderColor: c.accent }]}>
            <Text style={{ color: c.ink, fontSize: 18, writingDirection: "rtl" }}>{selected.text}</Text>
            <Text style={{ color: c.muted, fontSize: 12 }}>{selected.verseKey}</Text>
            <Pressable onPress={() => { const [s, a] = selected.verseKey.split(":"); router.push({ pathname: "/player", params: { surah: s, ayah: a } }); }} style={[st.chip, { borderColor: c.accent }]}><Text style={{ color: c.accent, fontSize: 13 }}>▶ {t.listenFromHere}</Text></Pressable>
          </View>
        ) : null}
        <View style={st.navRow}>
          <Pressable onPress={() => go(page - 1)} disabled={page <= 1} style={[st.chip, { borderColor: c.line, opacity: page <= 1 ? 0.4 : 1 }]}><Text style={{ color: c.ink }}>{isRtl ? `${t.prev} ›` : `‹ ${t.prev}`}</Text></Pressable>
          <Text style={{ color: c.muted, fontSize: 12 }}>{`${t.page} ${digits(page)} / ${digits(layout.pages)}`}</Text>
          <Pressable onPress={() => go(page + 1)} disabled={page >= layout.pages} style={[st.chip, { borderColor: c.line, opacity: page >= layout.pages ? 0.4 : 1 }]}><Text style={{ color: c.ink }}>{isRtl ? `‹ ${t.next}` : `${t.next} ›`}</Text></Pressable>
        </View>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },
  topRow: { flexDirection: "row", justifyContent: "space-between", padding: 10, gap: 8 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  picker: { marginHorizontal: 10, borderWidth: 1, borderRadius: 14, padding: 8, gap: 6 },
  pickRow: { borderWidth: 1, borderRadius: 10, padding: 10 },
  center: { alignItems: "center", marginTop: 60 },
  paper: { borderWidth: 1, borderRadius: 12, justifyContent: "space-between" },
  line: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" },
  headerLine: { justifyContent: "center", borderWidth: 1, borderRadius: 10, marginHorizontal: 8 },
  pageNum: { position: "absolute", bottom: 6, left: 0, right: 0, textAlign: "center", fontSize: 12 },
  bottom: { position: "absolute", left: 12, right: 12, bottom: 16, borderWidth: 1, borderRadius: 18, padding: 10, gap: 8 },
  tip: { borderWidth: 1, borderRadius: 12, padding: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" },
  navRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
});
