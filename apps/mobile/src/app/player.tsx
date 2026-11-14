import AsyncStorage from "@react-native-async-storage/async-storage";
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { Stack, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { ActivityIndicator, BackHandler, FlatList, ImageBackground, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View, useWindowDimensions } from "react-native";

import {
  NO_TRANSLATION, PLAYBACK_RATES, isBookmarked, notesFor, PLAYER_STORAGE_KEYS, STATIONS, TEXT_SIZE_SCALE, currentSegment, decideAtSegmentEnd, initialPlayerState,
  locateInAyah, locateInChapter, nextSurahNumber, playerReducer, WALLPAPERS, WALLPAPER_STORAGE_KEY, wallpaperById, wallpaperForSurah,
  type PlayerPanel, type Wallpaper, type WallpaperMode, type PlayerReciter, type PlayerState, type PlayerSurah, type PlayerTranslation, type PlayerWord, type RepeatMode, type Station, type TextSize,
} from "@qam/core";

import { useFamily, useProgressTicker } from "@/lib/family";
import { useI18n } from "@/lib/i18n";
import { fetchPlayerSurah, fetchReciters, fetchSurahs, fetchTafsir, fetchTafsirs, fetchTranslations, type TafsirResource } from "@/lib/player-api";
import { LanguagePicker, usePalette } from "@/lib/ui";

type SidePanel = Exclude<PlayerPanel, null> | "wallpaper" | "notes" | null;


const load = async <V,>(key: string, fallback: V): Promise<V> => { try { const raw = await AsyncStorage.getItem(key); return raw ? (JSON.parse(raw) as V) : fallback; } catch { return fallback; } };
const save = (key: string, value: unknown) => AsyncStorage.setItem(key, JSON.stringify(value)).catch(() => undefined);

export default function PlayerScreen() {
  const { surah: surahParam } = useLocalSearchParams<{ surah?: string }>();
  const { m, locale, isAr: ar, num: digits } = useI18n();
  const T = m.player;
  const DEFAULT_TAFSIR = ar ? "926" : "169";
  const dark = usePalette().dark;
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
  const family = useFamily();
  const [noteDraft, setNoteDraft] = useState("");
  const [view, setView] = useState<"focus" | "list">("focus");
  const [wallpaperMode, setWallpaperMode] = useState<WallpaperMode>("auto-nature");
  const [fixedWallpaper, setFixedWallpaper] = useState<string>("n-mountain-lake");
  const [tafsirs, setTafsirs] = useState<TafsirResource[]>([]);
  const [tafsirChoice, setTafsirChoice] = useState<string | null>(null);
  /* The side panel splits the screen with the player (right column in landscape, bottom half in portrait); never an overlay. */
  const [panel, setPanel] = useState<SidePanel>(null);
  const togglePanel = (p: Exclude<SidePanel, null>) => setPanel((cur) => (cur === p ? null : p));
  const panelRef = useRef<SidePanel>(null);
  panelRef.current = panel;
  const { width, height } = useWindowDimensions();
  const landscape = width > height;
  /* With the header hidden (landscape) keep the controls clear of the Dynamic Island, notch and rounded corners. */
  const insets = useSafeAreaInsets();
  const panelW = landscape ? Math.min(440, Math.round(width * 0.42)) : width;
  const panelH = Math.round(height * 0.46);
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => { if (panelRef.current) { setPanel(null); return true; } return false; });
    return () => sub.remove();
  }, []);

  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);
  const segment = currentSegment(state);
  useProgressTicker(segment?.ayah?.key ?? null, null, state.isPlaying && !!family.profile);

  useEffect(() => { setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true, interruptionMode: "doNotMix" }).catch(() => undefined); }, []);

  /* bootstrap */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [s, r, tr, tf] = await Promise.all([fetchSurahs(locale), fetchReciters("unspecified"), fetchTranslations(), fetchTafsirs().catch(() => [] as TafsirResource[])]);
        if (cancelled) return;
        setSurahs(s); setReciters(r); setTranslations(tr); setTafsirs(tf);
        setView(await load<"focus" | "list">("qam.player.view", "focus"));
        const wp = await load<{ mode: WallpaperMode; fixed: string } | null>(WALLPAPER_STORAGE_KEY, null);
        if (wp) { setWallpaperMode(wp.mode); setFixedWallpaper(wp.fixed); }
        setTafsirChoice(await load<string | null>("qam.player.tafsir", null));
        const savedReciter = await load<string | null>(PLAYER_STORAGE_KEYS.reciter, null);
        const reciter = r.find((x) => x.id === savedReciter) ?? r.find((x) => x.chapterReciterId === 7) ?? r[0];
        if (reciter) dispatch({ type: "reciter", reciter });
        const savedTr = await load<string | null>(PLAYER_STORAGE_KEYS.translation, null);
        const langName = new Intl.DisplayNames(["en"], { type: "language" }).of(locale.split("-")[0])?.toLowerCase();
        const defaultTr = tr.find((x) => x.languageName?.toLowerCase() === langName) ?? tr.find((x) => x.id === "85") ?? tr[0] ?? NO_TRANSLATION;
        dispatch({ type: "translation", translation: savedTr === "none" ? NO_TRANSLATION : savedTr ? (tr.find((x) => x.id === savedTr) ?? defaultTr) : defaultTr });
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
    save("qam.player.view", view);
    save(WALLPAPER_STORAGE_KEY, { mode: wallpaperMode, fixed: fixedWallpaper });
    save("qam.player.tafsir", tafsirChoice);
  }, [hydrated, state.reciter, state.translation, state.textSize, state.autoAdvance, state.motion, state.resume, view, wallpaperMode, fixedWallpaper, tafsirChoice]);

  const wallpaper: Wallpaper = useMemo(() => {
    const n = state.surah?.number ?? 1;
    if (wallpaperMode === "fixed") return wallpaperById(fixedWallpaper) ?? wallpaperForSurah(n, "nature");
    if (wallpaperMode === "plain") return wallpaperById(dark ? "p-night" : "p-paper") ?? WALLPAPERS[0];
    return wallpaperForSurah(n, wallpaperMode === "auto-art" ? "art" : wallpaperMode === "auto-live" ? "live" : "nature");
  }, [wallpaperMode, fixedWallpaper, state.surah?.number, dark]);
  const focus = view === "focus";
  const fc = focus ? (wallpaper.tone === "light" ? { ...c, ink: "#f7f5ee", muted: "rgba(247,245,238,0.8)", card: "rgba(10,16,14,0.5)", line: "rgba(255,255,255,0.2)" } : { ...c, ink: "#15201b", muted: "rgba(21,32,27,0.7)", card: "rgba(255,253,247,0.65)", line: "rgba(21,32,27,0.14)" }) : c;

  /* load segments */
  const loadKey = `${state.surah?.number ?? 0}|${state.reciter?.id ?? 0}|${state.translation.id}`;
  useEffect(() => {
    if (!state.surah || !state.reciter) return;
    let cancelled = false;
    const surah = state.surah;
    if (stateRef.current.status !== "loading") dispatch({ type: "open", surah, index: stateRef.current.index, play: stateRef.current.isPlaying });
    fetchPlayerSurah(surah.number, state.reciter, state.translation.apiId)
      .then((p) => !cancelled && dispatch({ type: "loaded", segments: p.segments, chapterAudio: p.chapterAudio }))
      .catch((e: Error & { status?: number }) => !cancelled && dispatch({ type: "failed", status: e.status && e.status < 500 ? "unavailable" : "network_error" }));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadKey]);

  const gapless = state.engine === "gapless" && !!state.chapterAudio;
  const desiredSrc = gapless ? state.chapterAudio?.url ?? null : segment?.audioUrl ?? null;
  const srcRef = useRef<string | null>(null);
  const seekFromTimeRef = useRef(false);
  const lastSeekIndexRef = useRef(-1);

  /* audio follows (source, index, isPlaying, rate) */
  useEffect(() => {
    if (!desiredSrc) return;
    if (srcRef.current !== desiredSrc) { srcRef.current = desiredSrc; lastSeekIndexRef.current = -1; player.replace({ uri: desiredSrc }); }
    player.setPlaybackRate(state.playbackRate);
    if (gapless && segment?.fromMs !== null && segment?.fromMs !== undefined && lastSeekIndexRef.current !== state.index) {
      if (!seekFromTimeRef.current) player.seekTo(segment.fromMs / 1000);
      seekFromTimeRef.current = false;
      lastSeekIndexRef.current = state.index;
    }
    if (state.isPlaying) player.play(); else player.pause();
  }, [desiredSrc, state.isPlaying, state.index, state.playbackRate, gapless, player, segment]);

  const openSurahNumber = useCallback((n: number, play: boolean) => { const s = surahs.find((x) => x.number === n); if (s) dispatch({ type: "open", surah: s, index: 0, play }); }, [surahs]);

  const finishSurah = useCallback(() => {
    const s = stateRef.current;
    if (station && s.surah) {
      const i = station.surahs.indexOf(s.surah.number);
      const next = station.surahs[i + 1] ?? (station.loop ? station.surahs[0] : undefined);
      if (next) return openSurahNumber(next, true);
    }
    if (s.autoAdvance && s.surah) return openSurahNumber(nextSurahNumber(s.surah.number), true);
    dispatch({ type: "ended" });
  }, [openSurahNumber, station]);

  const onSegmentEnd = useCallback(() => {
    const s = stateRef.current;
    const d = decideAtSegmentEnd(s);
    if (d.action === "replay") {
      dispatch({ type: "repeatConsumed" });
      const seg = s.segments[s.index];
      player.seekTo(s.engine === "gapless" && seg?.fromMs !== null ? (seg?.fromMs ?? 0) / 1000 : 0);
      player.play();
    } else if (d.action === "seek") dispatch({ type: "seek", index: d.index });
    else finishSurah();
  }, [finishSurah, player]);

  /* time tracking: word highlight and ayah boundaries (gapless) */
  const boundaryRef = useRef("");
  useEffect(() => {
    const s = stateRef.current;
    const ms = (status.currentTime ?? 0) * 1000;
    if (!s.segments.length || !status.playing) return;
    if (s.engine === "gapless" && !s.chapterAudio?.hasTimestamps) return; // archive file: no ayah tracking
    if (s.engine === "gapless") {
      const seg = s.segments[s.index];
      if (seg && seg.toMs !== null && ms >= seg.toMs - 60) {
        const key = `${s.surah?.number}-${s.index}-${s.repeatRemaining}`;
        if (boundaryRef.current !== key) { boundaryRef.current = key; seekFromTimeRef.current = true; onSegmentEnd(); }
        return;
      }
      const loc = locateInChapter(s.segments, ms);
      if (loc.index !== s.index) { seekFromTimeRef.current = true; dispatch({ type: "seek", index: loc.index }); }
      if (loc.wordPosition !== s.wordPosition) dispatch({ type: "word", position: loc.wordPosition });
    } else {
      const seg = s.segments[s.index];
      if (seg) { const w = locateInAyah(seg, ms); if (w !== s.wordPosition) dispatch({ type: "word", position: w }); }
    }
  }, [status.currentTime, status.playing, onSegmentEnd]);

  /* per-ayah engine: advance when the file finishes; gapless: surah finished */
  const finishedRef = useRef(false);
  useEffect(() => {
    if (!status.didJustFinish) { finishedRef.current = false; return; }
    if (finishedRef.current) return;
    finishedRef.current = true;
    if (stateRef.current.engine === "gapless") finishSurah(); else onSegmentEnd();
  }, [status.didJustFinish, finishSurah, onSegmentEnd]);

  /* sleep timer */
  useEffect(() => {
    if (!state.sleepUntil) return;
    const id = setInterval(() => { if (Date.now() >= (stateRef.current.sleepUntil ?? 0)) { dispatch({ type: "pause" }); dispatch({ type: "sleep", minutes: null }); } }, 1000);
    return () => clearInterval(id);
  }, [state.sleepUntil]);

  /* auto-scroll */
  useEffect(() => {
    if (!state.motion || !state.segments.length) return;
    try { listRef.current?.scrollToIndex({ index: state.index, viewPosition: 0.3, animated: true }); } catch { /* not measured yet */ }
  }, [state.index, state.motion, state.segments.length]);

  /* tafsir */
  useEffect(() => {
    if (panel !== "tafsir" || !segment?.ayah || state.tafsir?.key === segment.key) return;
    let cancelled = false;
    dispatch({ type: "tafsirLoading" });
    fetchTafsir(tafsirChoice ?? DEFAULT_TAFSIR, segment.ayah.key).then((r) => !cancelled && dispatch({ type: "tafsir", key: segment.key, text: r?.text ?? null })).catch(() => !cancelled && dispatch({ type: "tafsir", key: segment.key, text: null }));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panel, segment, state.tafsir?.key, tafsirChoice]);

  const scale = TEXT_SIZE_SCALE[state.textSize];
  const filteredSurahs = useMemo(() => { const q = query.trim().toLowerCase(); return q ? surahs.filter((s) => s.arabicName.includes(q) || s.latinName.toLowerCase().includes(q) || String(s.number) === q) : surahs; }, [surahs, query]);
  const segFrom = gapless ? (segment?.fromMs ?? 0) / 1000 : 0;
  const segTo = gapless ? (segment?.toMs ?? status.duration * 1000) / 1000 : status.duration;
  const progress = segTo > segFrom ? Math.min(1, Math.max(0, ((status.currentTime ?? 0) - segFrom) / (segTo - segFrom))) : 0;
  const panelTitle: Record<Exclude<SidePanel, null>, string> = { surahs: T.surahs, reciter: T.reciter, translation: T.translation, tafsir: T.tafsir, settings: T.settings, wallpaper: T.wallpaper, notes: `${T.notes} · ${segment?.ayah?.key ?? ""}` };

  return (
    <View style={[st.root, { backgroundColor: c.bg }, landscape ? { paddingTop: insets.top, paddingLeft: insets.left, paddingRight: insets.right } : null]}>
      <Stack.Screen options={{ title: state.surah ? `${ar ? "سورة" : "Surah"} ${state.surah.arabicName}` : T.title, headerShown: !landscape }} />
      {focus ? (wallpaper.kind === "nature" && wallpaper.url
        ? <ImageBackground source={{ uri: wallpaper.url.replace("w=1920", "w=1280") }} style={StyleSheet.absoluteFill} resizeMode="cover"><View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.3)" }]} /></ImageBackground>
        : <View style={[StyleSheet.absoluteFill, { backgroundColor: wallpaper.colors?.[0] ?? c.bg }]}><View style={[StyleSheet.absoluteFill, { backgroundColor: wallpaper.colors?.[1] ?? "transparent", opacity: 0.35, transform: [{ rotate: "12deg" }, { scale: 1.6 }], top: "40%" }]} /></View>)
        : null}

      <View style={[st.chips, landscape && { paddingVertical: 4 }]}>
        {([["surahs", "☰"], ["reciter", "🎙"], ["translation", "🌐"], ["tafsir", "📖"], ["settings", "⚙"]] as const).map(([p, icon]) => (
          <Pressable key={p} onPress={() => togglePanel(p)} style={[st.chip, { borderColor: fc.line, backgroundColor: panel === p ? c.accent : fc.card }]} accessibilityRole="button">
            <Text style={{ color: panel === p ? "#fff" : fc.ink, fontSize: 13 }}>{icon}{landscape || width < 400 ? "" : ` ${panelTitle[p]}`}</Text>
          </Pressable>
        ))}
        <Pressable onPress={() => togglePanel("wallpaper")} style={[st.chip, { borderColor: fc.line, backgroundColor: panel === "wallpaper" ? c.accent : fc.card }]} accessibilityRole="button"><Text style={{ color: panel === "wallpaper" ? "#fff" : fc.ink, fontSize: 13 }}>🖼{landscape || width < 400 ? "" : ` ${T.wallpaper}`}</Text></Pressable>
        <Pressable onPress={() => setView(focus ? "list" : "focus")} style={[st.chip, { borderColor: fc.line, backgroundColor: fc.card }]} accessibilityRole="button" accessibilityLabel={focus ? T.listView : T.focusView}><Text style={{ color: fc.ink, fontSize: 13 }}>{focus ? "☷" : "▣"}</Text></Pressable>
      </View>

      <View style={{ flex: 1, flexDirection: landscape ? "row" : "column" }}>
        <View style={{ flex: 1, minHeight: 0, minWidth: 0 }}>
      {state.status === "network_error" ? (
        <View style={[st.center, { padding: 24 }]}>
          <Text style={{ color: "#b91c1c", textAlign: "center", marginBottom: 12 }}>{T.offline}</Text>
          <Pressable style={[st.chip, { borderColor: c.line, backgroundColor: c.card }]} onPress={() => state.surah && dispatch({ type: "open", surah: state.surah, index: state.index })}><Text style={{ color: c.ink }}>{T.retry}</Text></Pressable>
        </View>
      ) : state.status === "loading" && !state.segments.length ? (
        <View style={st.center}><ActivityIndicator size="large" color={c.accent} /></View>
      ) : focus && segment ? (
        <ScrollView contentContainerStyle={[st.focusCenter, { paddingBottom: landscape ? 96 : 190, paddingHorizontal: landscape ? 24 : 16 }]}>
          <View style={[st.plate, { backgroundColor: wallpaper.tone === "light" ? "rgba(8,14,12,0.4)" : "rgba(255,253,247,0.6)", borderColor: fc.line, padding: landscape ? 12 : 20, gap: landscape ? 6 : 12 }]}>
            <Text accessibilityLanguage="ar" style={[st.arabic, { color: fc.ink, textAlign: "center", fontSize: (landscape ? 24 : width > 700 ? 44 : 32) * scale, lineHeight: (landscape ? 42 : width > 700 ? 80 : 60) * scale }]}>
              {segment.words.length
                ? segment.words.map((w: PlayerWord) => (
                    <Text key={w.position} onPress={() => { const timing = segment.wordTimings.find(([pos]) => pos === w.position); dispatch({ type: "play" }); if (gapless && timing) { player.seekTo(timing[1] / 1000); lastSeekIndexRef.current = state.index; } }} style={state.wordPosition === w.position ? { backgroundColor: c.accent, color: "#fff", borderRadius: 8 } : undefined}>{w.text} </Text>
                  ))
                : segment.arabic}
              {segment.ayah ? <Text style={{ color: c.accent, fontSize: 18 * scale }}> ﴿{digits(segment.ayah.number)}﴾</Text> : null}
            </Text>
            {segment.translation ? <Text style={{ color: fc.muted, textAlign: "center", fontSize: (landscape ? 13 : 16) * scale, lineHeight: (landscape ? 19 : 25) * scale }}>{segment.translation}</Text> : null}
            <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 14 }}>
              <Text style={{ color: fc.muted, fontSize: 12 }}>{segment.ayah ? `${T.ayah} ${digits(segment.ayah.number)} ${T.of} ${digits(state.surah?.verseCount ?? 0)}` : T.basmala}</Text>
              {segment.ayah ? (<>
                <Pressable onPress={() => family.profile ? family.dispatch({ type: "bookmark/toggle", verseKey: segment.ayah!.key }) : undefined}><Text style={{ color: c.accent, fontSize: 12 }}>🔖 {isBookmarked(family.state, segment.ayah.key) ? T.bookmarked : T.bookmark}</Text></Pressable>
                <Pressable onPress={() => setPanel("tafsir")}><Text style={{ color: c.accent, fontSize: 12 }}>📖 {T.tafsir}</Text></Pressable>
                <Pressable onPress={() => setPanel("notes")}><Text style={{ color: c.accent, fontSize: 12 }}>📝 {T.notes}</Text></Pressable>
                <Pressable onPress={() => dispatch({ type: "repeat", settings: { mode: state.repeat.mode === "ayah" ? "off" : "ayah", count: 3 } })}><Text style={{ color: c.accent, fontSize: 12 }}>↻ {T.repeatAyahShort}{state.repeat.mode === "ayah" ? " ✓" : ""}</Text></Pressable>
              </>) : null}
            </View>
          </View>
          {!landscape && state.segments[state.index + 1] ? <Text numberOfLines={1} accessibilityLanguage="ar" style={[st.arabic, { color: fc.muted, opacity: 0.7, fontSize: 16, marginTop: 14, textAlign: "center" }]}>{T.nextUp}: {state.segments[state.index + 1].arabic}</Text> : null}
        </ScrollView>
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
                  {item.words.length
                    ? item.words.map((w: PlayerWord) => (
                        <Text key={w.position} style={active && state.wordPosition === w.position ? { backgroundColor: c.accent, color: "#fff", borderRadius: 6 } : undefined}>{w.text} </Text>
                      ))
                    : item.arabic}
                  {item.ayah ? <Text style={{ color: c.accent, fontSize: 16 * scale }}> ﴿{digits(item.ayah.number)}﴾</Text> : null}
                </Text>
                {item.translation ? <Text style={{ color: c.muted, fontSize: 15 * scale, lineHeight: 23 * scale }}>{item.translation}</Text> : null}
                <View style={st.segMeta}>
                  <Text style={{ color: c.muted, fontSize: 12 }}>{item.ayah ? `${T.ayah} ${digits(item.ayah.number)} / ${digits(state.surah?.verseCount ?? 0)}` : T.basmala}</Text>
                  {item.ayah ? (
                    <View style={{ flexDirection: "row", gap: 14 }}>
                      <Pressable onPress={() => family.profile ? family.dispatch({ type: "bookmark/toggle", verseKey: item.ayah!.key }) : undefined}><Text style={{ color: c.accent, fontSize: 13 }}>🔖 {isBookmarked(family.state, item.ayah.key) ? T.bookmarked : T.bookmark}</Text></Pressable>
                      <Pressable onPress={() => { dispatch({ type: "seek", index }); setPanel("notes"); }}><Text style={{ color: c.accent, fontSize: 13 }}>📝 {T.notes}</Text></Pressable>
                      <Pressable onPress={() => { dispatch({ type: "seek", index }); setPanel("tafsir"); }}><Text style={{ color: c.accent, fontSize: 13 }}>{T.tafsir}</Text></Pressable>
                    </View>
                  ) : null}
                </View>
              </Pressable>
            );
          }}
        />
      )}

      {/* controls */}
      <View style={[st.controls, { backgroundColor: focus ? (wallpaper.tone === "light" ? "rgba(10,16,14,0.72)" : "rgba(255,253,247,0.85)") : c.card, borderColor: fc.line }, landscape && { padding: 6, gap: 4, bottom: 8 }]}>
        {landscape ? null : <View style={st.row}>
          <Text style={{ color: fc.muted, fontSize: 12 }} numberOfLines={1}>{segment?.ayah ? `${state.surah?.arabicName} · ${T.ayah} ${digits(segment.ayah.number)}` : segment ? T.basmala : ""}</Text>
          <Text style={{ color: fc.muted, fontSize: 12 }} numberOfLines={1}>{state.reciter ? `${T.listenWith} ${ar ? state.reciter.arabicName : state.reciter.latinName} · ${gapless ? (state.chapterAudio?.hasTimestamps ? T.gapless : T.noSync) : T.perAyah}` : ""}</Text>
        </View>}
        <View style={[st.progress, { backgroundColor: fc.line }]}><View style={{ width: `${Math.round(progress * 100)}%`, height: 4, backgroundColor: c.accent }} /></View>
        <View style={st.buttons}>
          <Btn label="↺" onPress={() => { dispatch({ type: "seek", index: 0 }); dispatch({ type: "play" }); }} c={fc} small={landscape} />
          <Btn label={ar ? "⏭" : "⏮"} onPress={() => dispatch({ type: "prev" })} c={fc} small={landscape} />
          <Btn label={state.isPlaying ? "❚❚" : "▶"} big onPress={() => dispatch({ type: "toggle" })} c={fc} small={landscape} />
          <Btn label={ar ? "⏮" : "⏭"} onPress={() => dispatch({ type: "next" })} c={fc} small={landscape} />
          <Btn label="»" onPress={() => state.surah && openSurahNumber(nextSurahNumber(state.surah.number), state.isPlaying)} c={fc} small={landscape} />
        </View>
      </View>

        </View>

        {panel ? (
          <View style={[st.sidePanel, { backgroundColor: c.card, borderColor: c.line }, landscape ? { width: panelW, borderStartWidth: 1 } : { height: panelH, borderTopWidth: 1 }]} accessibilityLabel={panelTitle[panel]}>
            <View style={[st.row, { paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderColor: c.line }]}>
              <Text style={{ color: c.ink, fontWeight: "700", fontSize: 16, flex: 1 }} numberOfLines={1}>{panelTitle[panel]}</Text>
              <Pressable onPress={() => setPanel(null)} hitSlop={10} accessibilityRole="button"><Text style={{ color: c.accent, fontWeight: "600" }}>{T.close}</Text></Pressable>
            </View>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 12, gap: 8 }} keyboardShouldPersistTaps="handled">
              {panel === "wallpaper" ? (<>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
              {([["auto-nature", `🌿 ${T.autoNature}`], ["auto-art", `✦ ${T.autoArt}`], ["auto-live", `✨ ${T.autoLive}`], ["plain", `▭ ${T.plainBg}`]] as [WallpaperMode, string][]).map(([m, label]) => (
                <Pressable key={m} onPress={() => setWallpaperMode(m)} style={[st.chip, { borderColor: c.line, backgroundColor: wallpaperMode === m ? c.accent : "transparent" }]}><Text style={{ color: wallpaperMode === m ? "#fff" : c.ink, fontSize: 13 }}>{label}</Text></Pressable>
              ))}
            </View>
            <Text style={{ color: c.muted, fontSize: 12 }}>{T.fixedBg}</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {WALLPAPERS.filter((w) => w.kind !== "plain").map((w) => (
                <Pressable key={w.id} onPress={() => { setFixedWallpaper(w.id); setWallpaperMode("fixed"); }} style={{ width: (Math.min(panelW, 600) - 24 - 8) / 2, aspectRatio: 1.6, borderRadius: 12, overflow: "hidden", borderWidth: 2, borderColor: wallpaperMode === "fixed" && fixedWallpaper === w.id ? c.accent : "transparent", backgroundColor: w.colors?.[0] ?? "#222" }}>
                  {w.kind === "nature" && w.url ? <ImageBackground source={{ uri: w.url.replace("w=1920", "w=400") }} style={{ flex: 1 }} resizeMode="cover" /> : <View style={{ flex: 1 }} />}
                  <Text numberOfLines={1} style={{ position: "absolute", bottom: 0, left: 0, right: 0, color: "#fff", fontSize: 11, padding: 4, backgroundColor: "rgba(0,0,0,0.5)" }}>{w.title[ar ? "ar" : "en"]}</Text>
                </Pressable>
              ))}
            </View>
              </>) : null}
              {panel === "notes" ? (<>
                {!family.profile ? <Text style={{ color: c.muted }}>{T.noProfile}</Text> : (
            <>
              <TextInput value={noteDraft} onChangeText={setNoteDraft} placeholder={T.noteHint} placeholderTextColor={c.muted} multiline style={[st.input, { color: c.ink, borderColor: c.line, minHeight: 90 }]} />
              <Pressable onPress={() => { if (segment?.ayah && noteDraft.trim()) { family.dispatch({ type: "note/save", verseKey: segment.ayah.key, body: noteDraft }); setNoteDraft(""); } }} style={[st.chip, { borderColor: c.accent, backgroundColor: c.accent, alignSelf: "flex-start" }]}><Text style={{ color: "#fff" }}>{T.saveNote}</Text></Pressable>
              <View style={{ gap: 8 }}>
                {segment?.ayah ? notesFor(family.state, family.profile.id).filter((n) => n.verseKey === segment.ayah!.key).map((n) => (
                  <View key={n.id} style={[st.listRow, { borderColor: c.line }]}><Text style={{ color: c.ink }}>{n.body}</Text><Pressable onPress={() => family.dispatch({ type: "note/remove", id: n.id })}><Text style={{ color: "#b91c1c", fontSize: 12 }}>✕</Text></Pressable></View>
                )) : null}
              </View>
            </>
          )}
              </>) : null}

            {panel === "surahs" && (<>
              <TextInput value={query} onChangeText={setQuery} placeholder={T.search} placeholderTextColor={c.muted} style={[st.input, { color: c.ink, borderColor: c.line }]} />
              <Text style={{ color: c.muted, fontSize: 12 }}>{T.surahs}</Text>
              {filteredSurahs.map((s) => <Row key={s.number} c={c} active={state.surah?.number === s.number} title={`${digits(s.number)}. ${s.arabicName}`} sub={`${s.latinName} · ${s.verseCount}`} onPress={() => { setStation(null); openSurahNumber(s.number, true); }} />)}
            </>)}
            {panel === "reciter" && reciters.map((r) => <Row key={r.id} c={c} active={state.reciter?.id === r.id} title={ar ? r.arabicName : r.latinName} sub={`${r.riwayah}${r.style ? ` · ${r.style}` : ""} · ${(r.source && r.source !== "qf") ? T.noSync : r.chapterReciterId ? T.gapless : T.perAyah}`} onPress={() => dispatch({ type: "reciter", reciter: r })} />)}
            {panel === "translation" && (<>
              <Row c={c} active={state.translation.id === "none"} title={T.none} onPress={() => dispatch({ type: "translation", translation: NO_TRANSLATION })} />
              {translations.map((tr) => <Row key={tr.id} c={c} active={state.translation.id === tr.id} title={tr.label} sub={tr.languageName} onPress={() => dispatch({ type: "translation", translation: tr })} />)}
            </>)}
            {panel === "tafsir" && tafsirs.length ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                {tafsirs.map((tf) => { const id = String(tf.id); const on = (tafsirChoice ?? DEFAULT_TAFSIR) === id; return (
                  <Pressable key={id} onPress={() => { setTafsirChoice(id); dispatch({ type: "tafsir", key: "", text: null }); }} style={[st.chip, { borderColor: c.line, backgroundColor: on ? c.accent : "transparent" }]}><Text style={{ color: on ? "#fff" : c.ink, fontSize: 12 }}>{tf.name} · {tf.language}</Text></Pressable>
                ); })}
              </ScrollView>
            ) : null}
            {panel === "tafsir" && (!segment?.ayah ? <Text style={{ color: c.muted }}>{T.basmalaNote}</Text>
              : state.tafsirLoading ? <ActivityIndicator color={c.accent} />
              : state.tafsir?.key === segment.key && state.tafsir.text ? (<>
                <Text accessibilityLanguage="ar" style={[st.arabic, { color: c.ink, fontSize: 22, lineHeight: 40 }]}>{segment.arabic}</Text>
                <Text style={{ color: c.ink, lineHeight: 28, fontSize: 16, textAlign: ar ? "right" : "left", writingDirection: ar ? "rtl" : "ltr" }}>{state.tafsir.text}</Text>
              </>) : <Text style={{ color: c.muted }}>{T.tafsir} {T.unavailable}</Text>)}
            {panel === "settings" && (<>
              <View style={[st.setting, { borderColor: c.line, flexWrap: "wrap" }]}>
                <Text style={{ color: c.ink }}>{T.repeat}</Text>
                <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
                  {([["off", T.repeatOff], ["ayah", T.repeatAyah], ["range", T.repeatRange], ["surah", T.repeatSurah]] as [RepeatMode, string][]).map(([m, label]) => (
                    <Pressable key={m} onPress={() => dispatch({ type: "repeat", settings: { mode: m, count: m === "off" ? 1 : state.repeat.count === 1 ? 3 : state.repeat.count, ...(m === "range" ? { from: state.index, to: Math.min(state.index + 4, state.segments.length - 1) } : {}) } })} style={[st.chip, { borderColor: c.line, backgroundColor: state.repeat.mode === m ? c.accent : "transparent" }]}><Text style={{ color: state.repeat.mode === m ? "#fff" : c.ink, fontSize: 13 }}>{label}</Text></Pressable>
                  ))}
                </View>
              </View>
              {state.repeat.mode !== "off" ? (
                <View style={[st.setting, { borderColor: c.line }]}>
                  <Text style={{ color: c.ink }}>{T.times}</Text>
                  <View style={{ flexDirection: "row", gap: 6 }}>
                    {[1, 2, 3, 5, 10, Infinity].map((n) => <Pressable key={n} onPress={() => dispatch({ type: "repeat", settings: { count: n } })} style={[st.chip, { borderColor: c.line, backgroundColor: state.repeat.count === n ? c.accent : "transparent" }]}><Text style={{ color: state.repeat.count === n ? "#fff" : c.ink, fontSize: 13 }}>{n === Infinity ? "∞" : digits(n)}</Text></Pressable>)}
                  </View>
                </View>
              ) : null}
              <View style={[st.setting, { borderColor: c.line }]}>
                <Text style={{ color: c.ink }}>{T.speed}</Text>
                <View style={{ flexDirection: "row", gap: 6 }}>
                  {PLAYBACK_RATES.map((r) => <Pressable key={r} onPress={() => dispatch({ type: "rate", rate: r })} style={[st.chip, { borderColor: c.line, backgroundColor: state.playbackRate === r ? c.accent : "transparent" }]}><Text style={{ color: state.playbackRate === r ? "#fff" : c.ink, fontSize: 13 }}>{r}×</Text></Pressable>)}
                </View>
              </View>
              <View style={[st.setting, { borderColor: c.line }]}>
                <Text style={{ color: c.ink }}>{T.sleep}</Text>
                <View style={{ flexDirection: "row", gap: 6 }}>
                  <Pressable onPress={() => dispatch({ type: "sleep", minutes: null })} style={[st.chip, { borderColor: c.line, backgroundColor: !state.sleepUntil ? c.accent : "transparent" }]}><Text style={{ color: !state.sleepUntil ? "#fff" : c.ink, fontSize: 13 }}>{T.off}</Text></Pressable>
                  {[10, 20, 30, 60].map((m) => <Pressable key={m} onPress={() => dispatch({ type: "sleep", minutes: m })} style={[st.chip, { borderColor: c.line }]}><Text style={{ color: c.ink, fontSize: 13 }}>{digits(m)}</Text></Pressable>)}
                </View>
              </View>
              <View style={[st.setting, { borderColor: c.line }]}>
                <Text style={{ color: c.ink }}>{T.textSize}</Text>
                <View style={{ flexDirection: "row", gap: 6 }}>
                  {(["small", "medium", "large"] as TextSize[]).map((sz) => <Pressable key={sz} onPress={() => dispatch({ type: "textSize", size: sz })} style={[st.chip, { borderColor: c.line, backgroundColor: state.textSize === sz ? c.accent : "transparent" }]}><Text style={{ color: state.textSize === sz ? "#fff" : c.ink, fontSize: 13 }}>{T[sz]}</Text></Pressable>)}
                </View>
              </View>
              <View style={[st.setting, { borderColor: c.line }]}><Text style={{ color: c.ink, flex: 1 }}>{T.language}</Text><LanguagePicker /></View>
              <View style={[st.setting, { borderColor: c.line }]}><Text style={{ color: c.ink, flex: 1 }}>{T.autoAdvance}</Text><Switch value={state.autoAdvance} onValueChange={(v) => dispatch({ type: "autoAdvance", value: v })} /></View>
              <View style={[st.setting, { borderColor: c.line }]}><Text style={{ color: c.ink, flex: 1 }}>{T.motion}</Text><Switch value={state.motion} onValueChange={(v) => dispatch({ type: "motion", value: v })} /></View>
            </>)}
            </ScrollView>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const Btn = ({ label, onPress, big, small, c }: { label: string; onPress: () => void; big?: boolean; small?: boolean; c: { accent: string; ink: string; line: string } }) => (
  <Pressable onPress={onPress} accessibilityRole="button" style={[st.btn, big && st.btnBig, small && (big ? st.btnBigSmall : st.btnSmall), { borderColor: big ? c.accent : c.line, backgroundColor: big ? c.accent : "transparent" }]}>
    <Text style={{ color: big ? "#fff" : c.ink, fontSize: small ? (big ? 18 : 14) : big ? 24 : 18 }}>{label}</Text>
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
  btnSmall: { width: 36, height: 36, borderRadius: 18 },
  btnBigSmall: { width: 44, height: 44, borderRadius: 22 },
  focusCenter: { flexGrow: 1, justifyContent: "center", alignItems: "center", paddingTop: 8 },
  plate: { borderRadius: 26, borderWidth: 1, width: "100%", maxWidth: 900 },
  sidePanel: { minHeight: 0, minWidth: 0, overflow: "hidden" },
  input: { borderWidth: 1, borderRadius: 12, padding: 10, fontSize: 15 },
  listRow: { borderWidth: 1, borderRadius: 14, padding: 12 },
  setting: { borderWidth: 1, borderRadius: 14, padding: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
});
