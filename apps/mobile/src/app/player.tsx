import AsyncStorage from "@react-native-async-storage/async-storage";
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View, useColorScheme } from "react-native";

import {
  NO_TRANSLATION, PLAYER_STORAGE_KEYS, STATIONS, TEXT_SIZE_SCALE, currentSegment, initialPlayerState, isLastSegment,
  nextSurahNumber, playerReducer, resolveLocale,
  type PlayerPanel, type PlayerReciter, type PlayerState, type PlayerSurah, type PlayerTranslation, type Station, type TextSize,
} from "@qam/core";

import { fetchPlayerSurah, fetchReciters, fetchSurahs, fetchTafsir, fetchTranslations } from "@/lib/player-api";

const locale = resolveLocale(Intl.DateTimeFormat().resolvedOptions().locale);
const ar = locale === "ar";
const T = ar
  ? { surahs: "السور", reciter: "القارئ", translation: "الترجمة", tafsir: "التفسير", settings: "الإعدادات", stations: "الإذاعة", none: "النص العربي وحده", textSize: "حجم النص", autoAdvance: "الانتقال التلقائي إلى السورة التالية", motion: "تمرير تلقائي", small: "صغير", medium: "متوسط", large: "كبير", ayah: "الآية", basmala: "البسملة", basmalaNote: "البسملة ليست آية من هذه السورة، ولا تفسير لها هنا.", loading: "جارٍ التحميل…", offline: "تعذّر الاتصال بخدمة المحتوى. تحقق من اتصالك ثم أعد المحاولة.", retry: "إعادة المحاولة", close: "إغلاق", search: "بحث عن سورة…", listenWith: "بصوت", unavailable: "غير متاح", title: "القرآن الكريم" }
  : { surahs: "Surahs", reciter: "Reciter", translation: "Translation", tafsir: "Tafsir", settings: "Settings", stations: "Radio", none: "Arabic text only", textSize: "Text size", autoAdvance: "Auto-advance to next surah", motion: "Auto-scroll", small: "Small", medium: "Medium", large: "Large", ayah: "Ayah", basmala: "Basmala", basmalaNote: "The Basmala is not an ayah of this surah, so there is no tafsir here.", loading: "Loading…", offline: "Could not reach the content service. Check your connection and try again.", retry: "Try again", close: "Close", search: "Search a surah…", listenWith: "Recited by", unavailable: "not available", title: "The Noble Quran" };
const DEFAULT_TAFSIR = ar ? "926" : "169";
const digits = (n: number) => (ar ? n.toLocaleString("ar-EG", { useGrouping: false }) : String(n));

const load = async <V,>(key: string, fallback: V): Promise<V> => { try { const raw = await AsyncStorage.getItem(key); return raw ? (JSON.parse(raw) as V) : fallback; } catch { return fallback; } };
const save = (key: string, value: unknown) => AsyncStorage.setItem(key, JSON.stringify(value)).catch(() => undefined);

export default function PlayerScreen() {
  const { surah: surahParam } = useLocalSearchParams<{ surah?: string }>();
  const dark = useColorScheme() === "dark";
  const c = dark ? { bg: "#0d1512", card: "#13201b", ink: "#e9efea", muted: "#9fb0a7", line: "rgba(233,239,234,0.12)", accent: "#1d9e75" } : { bg: "#f6f3ea", card: "#fffdf7", ink: "#15201b", muted: "#5d6a63", line: "rgba(21,32,27,0.1)", accent: "#1d9e75" };

  const [state, dispatch] = useReducer(playerReducer, undefined, () => initialPlayerState());
  const stateRef = useRef<PlayerState>(state); stateRef.current = state;
  const [surahs, setSurahs] = useState<PlayerSurah[]>([]);
  const [reciters, setReciters] = useState<PlayerReciter[]>([]);
  const [translations, setTranslations] = useState<PlayerTranslation[]>([]);
  const [station, setStation] = useState<Station | null>(null);
  const [query, setQuery] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const listRef = useRef<FlatList>(null);

  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);
  const segment = currentSegment(state);

  useEffect(() => { setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true, interruptionMode: "doNotMix" }).catch(() => undefined); }, []);

  /* bootstrap */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [s, r, tr] = await Promise.all([fetchSurahs(locale), fetchReciters("unspecified"), fetchTranslations()]);
        if (cancelled) return;
        setSurahs(s); setReciters(r); setTranslations(tr);
        const savedReciter = await load<number | null>(PLAYER_STORAGE_KEYS.reciter, null);
        const reciter = r.find((x) => x.id === savedReciter) ?? r.find((x) => x.id === 7) ?? r[0];
        if (reciter) dispatch({ type: "reciter", reciter });
        const savedTr = await load<string | null>(PLAYER_STORAGE_KEYS.translation, null);
        dispatch({ type: "translation", translation: savedTr === "none" ? NO_TRANSLATION : tr.find((x) => x.id === savedTr) ?? NO_TRANSLATION });
        dispatch({ type: "textSize", size: await load<TextSize>(PLAYER_STORAGE_KEYS.textSize, "medium") });
        dispatch({ type: "autoAdvance", value: await load<boolean>(PLAYER_STORAGE_KEYS.autoAdvance, true) });
        dispatch({ type: "motion", value: await load<boolean>(PLAYER_STORAGE_KEYS.motion, true) });
        const resume = await load<{ surahNumber: number; segment: number } | null>(PLAYER_STORAGE_KEYS.resume, null);
        const wanted = surahParam ? Number(surahParam) : resume?.surahNumber;
        const first = s.find((x) => x.number === wanted) ?? s[0];
        if (first) dispatch({ type: "open", surah: first, index: surahParam ? 0 : resume?.segment ?? 0, play: false });
      } catch { dispatch({ type: "failed", status: "network_error" }); }
      setHydrated(true);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* persist */
  useEffect(() => {
    if (!hydrated) return;
    if (state.reciter) save(PLAYER_STORAGE_KEYS.reciter, state.reciter.id);
    save(PLAYER_STORAGE_KEYS.translation, state.translation.id);
    save(PLAYER_STORAGE_KEYS.textSize, state.textSize);
    save(PLAYER_STORAGE_KEYS.autoAdvance, state.autoAdvance);
    save(PLAYER_STORAGE_KEYS.motion, state.motion);
    if (state.resume) save(PLAYER_STORAGE_KEYS.resume, state.resume);
  }, [hydrated, state.reciter, state.translation, state.textSize, state.autoAdvance, state.motion, state.resume]);

  /* load segments */
  const loadKey = `${state.surah?.number ?? 0}|${state.reciter?.id ?? 0}|${state.translation.id}`;
  useEffect(() => {
    if (!state.surah || !state.reciter) return;
    let cancelled = false;
    const surah = state.surah;
    if (stateRef.current.status !== "loading") dispatch({ type: "open", surah, index: stateRef.current.index, play: stateRef.current.isPlaying });
    fetchPlayerSurah(surah.number, state.reciter.id, state.translation.apiId)
      .then((p) => !cancelled && dispatch({ type: "loaded", segments: p.segments }))
      .catch((e: Error & { status?: number }) => !cancelled && dispatch({ type: "failed", status: e.status && e.status < 500 ? "unavailable" : "network_error" }));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadKey]);

  /* audio follows segment + isPlaying */
  const srcRef = useRef<string | null>(null);
  useEffect(() => {
    if (!segment?.audioUrl) return;
    if (srcRef.current !== segment.audioUrl) { srcRef.current = segment.audioUrl; player.replace({ uri: segment.audioUrl }); }
    if (state.isPlaying) player.play(); else player.pause();
  }, [segment?.audioUrl, state.isPlaying, player, segment]);

  const openSurahNumber = useCallback((n: number, play: boolean) => { const s = surahs.find((x) => x.number === n); if (s) dispatch({ type: "open", surah: s, index: 0, play }); }, [surahs]);

  /* advance on finish */
  const finishedRef = useRef(false);
  useEffect(() => {
    if (!status.didJustFinish) { finishedRef.current = false; return; }
    if (finishedRef.current) return;
    finishedRef.current = true;
    const s = stateRef.current;
    if (!isLastSegment(s)) return dispatch({ type: "next" });
    if (station && s.surah) {
      const i = station.surahs.indexOf(s.surah.number);
      const next = station.surahs[i + 1] ?? (station.loop ? station.surahs[0] : undefined);
      if (next) return openSurahNumber(next, true);
    }
    if (s.autoAdvance && s.surah) return openSurahNumber(nextSurahNumber(s.surah.number), true);
    dispatch({ type: "ended" });
  }, [status.didJustFinish, station, openSurahNumber]);

  /* auto-scroll */
  useEffect(() => {
    if (!state.motion || !state.segments.length) return;
    try { listRef.current?.scrollToIndex({ index: state.index, viewPosition: 0.3, animated: true }); } catch { /* not measured yet */ }
  }, [state.index, state.motion, state.segments.length]);

  /* tafsir */
  useEffect(() => {
    if (state.panel !== "tafsir" || !segment?.ayah || state.tafsir?.key === segment.key) return;
    let cancelled = false;
    dispatch({ type: "tafsirLoading" });
    fetchTafsir(DEFAULT_TAFSIR, segment.ayah.key).then((r) => !cancelled && dispatch({ type: "tafsir", key: segment.key, text: r?.text ?? null })).catch(() => !cancelled && dispatch({ type: "tafsir", key: segment.key, text: null }));
    return () => { cancelled = true; };
  }, [state.panel, segment, state.tafsir?.key]);

  const scale = TEXT_SIZE_SCALE[state.textSize];
  const filteredSurahs = useMemo(() => { const q = query.trim().toLowerCase(); return q ? surahs.filter((s) => s.arabicName.includes(q) || s.latinName.toLowerCase().includes(q) || String(s.number) === q) : surahs; }, [surahs, query]);
  const progress = status.duration ? status.currentTime / status.duration : 0;
  const panelTitle: Record<Exclude<PlayerPanel, null>, string> = { surahs: T.surahs, reciter: T.reciter, translation: T.translation, tafsir: T.tafsir, settings: T.settings };

  return (
    <View style={[st.root, { backgroundColor: c.bg }]}>
      <Stack.Screen options={{ title: state.surah ? `${ar ? "سورة" : "Surah"} ${state.surah.arabicName}` : T.title }} />

      <View style={st.chips}>
        {(["surahs", "reciter", "translation", "tafsir", "settings"] as const).map((p) => (
          <Pressable key={p} onPress={() => dispatch({ type: "panel", panel: p })} style={[st.chip, { borderColor: c.line, backgroundColor: state.panel === p ? c.accent : c.card }]} accessibilityRole="button">
            <Text style={{ color: state.panel === p ? "#fff" : c.ink, fontSize: 13 }}>{panelTitle[p]}</Text>
          </Pressable>
        ))}
      </View>

      {state.status === "network_error" ? (
        <View style={[st.center, { padding: 24 }]}>
          <Text style={{ color: "#b91c1c", textAlign: "center", marginBottom: 12 }}>{T.offline}</Text>
          <Pressable style={[st.chip, { borderColor: c.line, backgroundColor: c.card }]} onPress={() => state.surah && dispatch({ type: "open", surah: state.surah, index: state.index })}><Text style={{ color: c.ink }}>{T.retry}</Text></Pressable>
        </View>
      ) : state.status === "loading" && !state.segments.length ? (
        <View style={st.center}><ActivityIndicator size="large" color={c.accent} /></View>
      ) : (
        <FlatList
          ref={listRef}
          data={state.segments}
          keyExtractor={(s) => s.key}
          contentContainerStyle={{ padding: 14, gap: 10, paddingBottom: 190 }}
          onScrollToIndexFailed={() => undefined}
          renderItem={({ item, index }) => {
            const active = index === state.index;
            return (
              <Pressable onPress={() => { dispatch({ type: "seek", index }); dispatch({ type: "play" }); }} style={[st.seg, { backgroundColor: c.card, borderColor: active ? c.accent : c.line, borderWidth: active ? 2 : 1 }]}>
                <Text accessibilityLanguage="ar" style={[st.arabic, { color: c.ink, fontSize: 26 * scale, lineHeight: 50 * scale, textAlign: item.ayah ? "right" : "center" }]}>
                  {item.arabic}{item.ayah ? <Text style={{ color: c.accent, fontSize: 16 * scale }}> ﴿{digits(item.ayah.number)}﴾</Text> : null}
                </Text>
                {item.translation ? <Text style={{ color: c.muted, fontSize: 15 * scale, lineHeight: 23 * scale }}>{item.translation}</Text> : null}
                <View style={st.segMeta}>
                  <Text style={{ color: c.muted, fontSize: 12 }}>{item.ayah ? `${T.ayah} ${digits(item.ayah.number)} / ${digits(state.surah?.verseCount ?? 0)}` : T.basmala}</Text>
                  {item.ayah ? <Pressable onPress={() => { dispatch({ type: "seek", index }); if (state.panel !== "tafsir") dispatch({ type: "panel", panel: "tafsir" }); }}><Text style={{ color: c.accent, fontSize: 13 }}>{T.tafsir}</Text></Pressable> : null}
                </View>
              </Pressable>
            );
          }}
        />
      )}

      {/* controls */}
      <View style={[st.controls, { backgroundColor: c.card, borderColor: c.line }]}>
        <View style={st.row}>
          <Text style={{ color: c.muted, fontSize: 12 }} numberOfLines={1}>{segment?.ayah ? `${state.surah?.arabicName} · ${T.ayah} ${digits(segment.ayah.number)}` : segment ? T.basmala : ""}</Text>
          <Text style={{ color: c.muted, fontSize: 12 }} numberOfLines={1}>{state.reciter ? `${T.listenWith} ${ar ? state.reciter.arabicName : state.reciter.latinName}` : ""}</Text>
        </View>
        <View style={[st.progress, { backgroundColor: c.line }]}><View style={{ width: `${Math.round(progress * 100)}%`, height: 4, backgroundColor: c.accent }} /></View>
        <View style={st.buttons}>
          <Btn label="↺" onPress={() => { dispatch({ type: "seek", index: 0 }); dispatch({ type: "play" }); }} c={c} />
          <Btn label={ar ? "⏭" : "⏮"} onPress={() => dispatch({ type: "prev" })} c={c} />
          <Btn label={state.isPlaying ? "❚❚" : "▶"} big onPress={() => dispatch({ type: "toggle" })} c={c} />
          <Btn label={ar ? "⏮" : "⏭"} onPress={() => dispatch({ type: "next" })} c={c} />
          <Btn label="»" onPress={() => state.surah && openSurahNumber(nextSurahNumber(state.surah.number), state.isPlaying)} c={c} />
        </View>
      </View>

      {/* panel */}
      <Modal visible={state.panel !== null} animationType="slide" transparent onRequestClose={() => dispatch({ type: "panel", panel: state.panel })}>
        <Pressable style={st.backdrop} onPress={() => dispatch({ type: "panel", panel: state.panel })} />
        <View style={[st.sheet, { backgroundColor: c.card }]}>
          <View style={[st.row, { padding: 16, borderBottomWidth: 1, borderColor: c.line }]}>
            <Text style={{ color: c.ink, fontWeight: "700", fontSize: 16 }}>{state.panel ? panelTitle[state.panel] : ""}</Text>
            <Pressable onPress={() => dispatch({ type: "panel", panel: state.panel })}><Text style={{ color: c.accent }}>{T.close}</Text></Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: 12, gap: 8 }}>
            {state.panel === "surahs" && (<>
              <TextInput value={query} onChangeText={setQuery} placeholder={T.search} placeholderTextColor={c.muted} style={[st.input, { color: c.ink, borderColor: c.line }]} />
              <Text style={{ color: c.muted, fontSize: 12 }}>{T.stations}</Text>
              {STATIONS.map((s) => <Row key={s.id} c={c} active={station?.id === s.id} title={s.title[ar ? "ar" : "en"]} sub={s.subtitle[ar ? "ar" : "en"]} onPress={() => { setStation(s); openSurahNumber(s.surahs[0], true); dispatch({ type: "panel", panel: "surahs" }); }} />)}
              <Text style={{ color: c.muted, fontSize: 12 }}>{T.surahs}</Text>
              {filteredSurahs.map((s) => <Row key={s.number} c={c} active={state.surah?.number === s.number} title={`${digits(s.number)}. ${s.arabicName}`} sub={`${s.latinName} · ${s.verseCount}`} onPress={() => { setStation(null); openSurahNumber(s.number, true); }} />)}
            </>)}
            {state.panel === "reciter" && reciters.map((r) => <Row key={r.id} c={c} active={state.reciter?.id === r.id} title={ar ? r.arabicName : r.latinName} sub={r.riwayah} onPress={() => dispatch({ type: "reciter", reciter: r })} />)}
            {state.panel === "translation" && (<>
              <Row c={c} active={state.translation.id === "none"} title={T.none} onPress={() => dispatch({ type: "translation", translation: NO_TRANSLATION })} />
              {translations.map((tr) => <Row key={tr.id} c={c} active={state.translation.id === tr.id} title={tr.label} sub={tr.languageName} onPress={() => dispatch({ type: "translation", translation: tr })} />)}
            </>)}
            {state.panel === "tafsir" && (!segment?.ayah ? <Text style={{ color: c.muted }}>{T.basmalaNote}</Text>
              : state.tafsirLoading ? <ActivityIndicator color={c.accent} />
              : state.tafsir?.key === segment.key && state.tafsir.text ? (<>
                <Text accessibilityLanguage="ar" style={[st.arabic, { color: c.ink, fontSize: 22, lineHeight: 40 }]}>{segment.arabic}</Text>
                <Text style={{ color: c.ink, lineHeight: 28, fontSize: 16, textAlign: ar ? "right" : "left", writingDirection: ar ? "rtl" : "ltr" }}>{state.tafsir.text}</Text>
              </>) : <Text style={{ color: c.muted }}>{T.tafsir} {T.unavailable}</Text>)}
            {state.panel === "settings" && (<>
              <View style={[st.setting, { borderColor: c.line }]}>
                <Text style={{ color: c.ink }}>{T.textSize}</Text>
                <View style={{ flexDirection: "row", gap: 6 }}>
                  {(["small", "medium", "large"] as TextSize[]).map((sz) => <Pressable key={sz} onPress={() => dispatch({ type: "textSize", size: sz })} style={[st.chip, { borderColor: c.line, backgroundColor: state.textSize === sz ? c.accent : "transparent" }]}><Text style={{ color: state.textSize === sz ? "#fff" : c.ink, fontSize: 13 }}>{T[sz]}</Text></Pressable>)}
                </View>
              </View>
              <View style={[st.setting, { borderColor: c.line }]}><Text style={{ color: c.ink, flex: 1 }}>{T.autoAdvance}</Text><Switch value={state.autoAdvance} onValueChange={(v) => dispatch({ type: "autoAdvance", value: v })} /></View>
              <View style={[st.setting, { borderColor: c.line }]}><Text style={{ color: c.ink, flex: 1 }}>{T.motion}</Text><Switch value={state.motion} onValueChange={(v) => dispatch({ type: "motion", value: v })} /></View>
            </>)}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const Btn = ({ label, onPress, big, c }: { label: string; onPress: () => void; big?: boolean; c: { accent: string; ink: string; line: string } }) => (
  <Pressable onPress={onPress} accessibilityRole="button" style={[st.btn, big && st.btnBig, { borderColor: big ? c.accent : c.line, backgroundColor: big ? c.accent : "transparent" }]}>
    <Text style={{ color: big ? "#fff" : c.ink, fontSize: big ? 24 : 18 }}>{label}</Text>
  </Pressable>
);

const Row = ({ title, sub, active, onPress, c }: { title: string; sub?: string; active?: boolean; onPress: () => void; c: { accent: string; ink: string; muted: string; line: string } }) => (
  <Pressable onPress={onPress} style={[st.listRow, { borderColor: active ? c.accent : c.line, backgroundColor: active ? "rgba(29,158,117,0.12)" : "transparent" }]}>
    <Text style={{ color: c.ink, fontSize: 16 }}>{title}</Text>
    {sub ? <Text style={{ color: c.muted, fontSize: 12, marginTop: 2 }}>{sub}</Text> : null}
  </Pressable>
);

const st = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6, paddingHorizontal: 12, paddingVertical: 8 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  seg: { borderRadius: 18, padding: 16, gap: 8 },
  arabic: { writingDirection: "rtl", fontWeight: "500" },
  segMeta: { flexDirection: "row", justifyContent: "space-between" },
  controls: { position: "absolute", left: 12, right: 12, bottom: 16, borderRadius: 22, borderWidth: 1, padding: 12, gap: 8, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 20, elevation: 8 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 },
  progress: { height: 4, borderRadius: 2, overflow: "hidden" },
  buttons: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 12 },
  btn: { width: 46, height: 46, borderRadius: 23, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  btnBig: { width: 62, height: 62, borderRadius: 31 },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)" },
  sheet: { maxHeight: "75%", borderTopLeftRadius: 22, borderTopRightRadius: 22 },
  input: { borderWidth: 1, borderRadius: 12, padding: 10, fontSize: 15 },
  listRow: { borderWidth: 1, borderRadius: 14, padding: 12 },
  setting: { borderWidth: 1, borderRadius: 14, padding: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
});
