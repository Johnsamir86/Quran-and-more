import { useAudioPlayer } from "expo-audio";
import { Link, Stack, router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { ImageBackground, Pressable, ScrollView, Share, Text, TextInput, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { NATURE_WALLPAPERS, hashString, languageNameForLocale, muezzinById, wallpaperForSurah, type PrayerName } from "@qam/core";

import { loadAzanSettings } from "@/lib/azan";
import { useFamily } from "@/lib/family";
import { useI18n } from "@/lib/i18n";
import { fetchTafsirText, fetchChapterRows, fetchAyahOfDay, type AyahOfDay, type ChapterRow } from "@/lib/study-api";
import { fetchTafsirs } from "@/lib/player-api";
import { API_BASE_URL } from "@/lib/api";

const SLIDES = 4;

/** Ayah of the day as a full-screen story: wallpaper, ayah, meaning, tafsir, reflection. */
export default function StoryScreen() {
  const { m, locale, isAr, isRtl } = useI18n();
  const t = m.story;
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<{ prayer?: string; azan?: string }>();
  const prayer = params.prayer as PrayerName | undefined;
  const { profile, dispatch } = useFamily();
  const player = useAudioPlayer(null);

  const [ayah, setAyah] = useState<AyahOfDay | null>(null);
  const [chapter, setChapter] = useState<ChapterRow | null>(null);
  const [tafsir, setTafsir] = useState<{ name: string; text: string } | null>(null);
  const [slide, setSlide] = useState(0);
  const [wpIndex, setWpIndex] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [azanOn, setAzanOn] = useState(false);
  const started = useRef(false);

  const load = useCallback(async (random = false) => {
    setAyah(null); setTafsir(null); setSlide(0);
    const res = await fetch(`${API_BASE_URL}/api/public/v1/ayah/today?language=${locale}${random ? "&random=1" : ""}`);
    setAyah((await res.json()) as AyahOfDay);
  }, [locale]);
  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (!ayah) return;
    const s = Number(ayah.verseKey.split(":")[0]);
    fetchChapterRows(locale).then((rows) => setChapter(rows.find((r) => r.id === s) ?? null)).catch(() => undefined);
    (async () => {
      try {
        const list = await fetchTafsirs();
        const lang = languageNameForLocale(locale);
        const pick = list.find((x) => x.language.toLowerCase() === lang) ?? list.find((x) => x.id === (isAr ? 926 : 169)) ?? list.find((x) => x.language.toLowerCase() === "english") ?? list[0];
        if (!pick) return;
        const got = await fetchTafsirText(pick.id, ayah.verseKey);
        if (got?.text) setTafsir({ name: got.name || pick.name, text: got.text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() });
      } catch { /* optional */ }
    })();
  }, [ayah, locale, isAr]);

  useEffect(() => {
    if (params.azan !== "1" || started.current) return;
    started.current = true;
    loadAzanSettings().then((s) => { player.replace({ uri: muezzinById(s.muezzin).url }); player.play(); setAzanOn(true); }).catch(() => undefined);
    return () => { player.pause(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.azan]);

  const surah = ayah ? Number(ayah.verseKey.split(":")[0]) : 1;
  const wallpaper = useMemo(() => {
    if (wpIndex !== null) return NATURE_WALLPAPERS[wpIndex % NATURE_WALLPAPERS.length];
    const base = wallpaperForSurah(surah, "nature");
    const shift = ayah ? hashString(ayah.day) % NATURE_WALLPAPERS.length : 0;
    return NATURE_WALLPAPERS[(NATURE_WALLPAPERS.indexOf(base) + shift) % NATURE_WALLPAPERS.length] ?? base;
  }, [surah, wpIndex, ayah]);
  const light = wallpaper.tone === "dark"; // dark-toned image → dark text
  const ink = light ? "#15201b" : "#ffffff";
  const chipBg = light ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.4)";

  const next = () => setSlide((s) => Math.min(SLIDES - 1, s + 1));
  const prev = () => setSlide((s) => Math.max(0, s - 1));
  const flash = (x: string) => { setToast(x); setTimeout(() => setToast(null), 1800); };
  const share = () => { if (ayah) Share.share({ message: `${ayah.text}\n${ayah.translation ?? ""}\n(${ayah.verseKey})\n${API_BASE_URL}/study/${ayah.verseKey}` }).catch(() => undefined); };
  const saveNote = () => {
    if (!ayah || !note.trim()) return;
    if (!profile) { flash(m.common.noProfile); return; }
    dispatch({ type: "note/save", verseKey: ayah.verseKey, body: note.trim() });
    setNote(""); flash(t.noteSaved);
  };

  const hour = new Date().getHours();
  const greeting = prayer && m.azan.prayers[prayer] ? `${t.forPrayer} ${m.azan.prayers[prayer]}` : hour < 12 ? t.goodMorning : t.goodEvening;
  const [sNum, aNum] = (ayah?.verseKey ?? "1:1").split(":");
  const chip = (label: string, onPress: () => void, key?: string) => (
    <Pressable key={key ?? label} onPress={onPress} style={{ backgroundColor: chipBg, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9, borderWidth: 1, borderColor: light ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.3)" }}>
      <Text style={{ color: ink, fontSize: 13 }}>{label}</Text>
    </Pressable>
  );

  return (
    <ImageBackground source={wallpaper.url ? { uri: wallpaper.url } : undefined} style={{ flex: 1, backgroundColor: "#0b1228" }} resizeMode="cover">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style={light ? "dark" : "light"} />
      <View style={{ flex: 1, backgroundColor: light ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.3)", paddingTop: insets.top + 10, paddingBottom: insets.bottom + 10 }}>
        <View style={{ paddingHorizontal: 16, gap: 10 }}>
          <View style={{ flexDirection: "row", gap: 5 }}>
            {Array.from({ length: SLIDES }).map((_, i) => <View key={i} style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: i <= slide ? ink : light ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.35)" }} />)}
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ color: ink, fontSize: 13 }}>✨ {t.title} · {greeting}</Text>
            <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: chipBg, alignItems: "center", justifyContent: "center" }}><Text style={{ color: ink, fontSize: 16 }}>✕</Text></Pressable>
          </View>
          {azanOn ? <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "rgba(29,158,117,0.9)", borderRadius: 14, padding: 10 }}><Text style={{ color: "#fff" }}>🕌 {m.azan.title}</Text>{chip(`⏹ ${m.azan.stop}`, () => { player.pause(); setAzanOn(false); })}</View> : null}
        </View>

        <View style={{ flex: 1 }}>
          <View style={{ position: "absolute", inset: 0, flexDirection: "row" }}>
            <Pressable style={{ flex: 1 }} onPress={isRtl ? next : prev} />
            <Pressable style={{ flex: 1 }} onPress={isRtl ? prev : next} />
          </View>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 22, paddingVertical: 16, gap: 16 }} pointerEvents={slide === 3 ? "auto" : "box-none"}>
            {!ayah ? <Text style={{ color: ink, textAlign: "center" }}>{m.common.loading}</Text> : null}
            {ayah && slide === 0 ? (
              <>
                <Text style={{ color: ink, textAlign: "center", letterSpacing: 2, textTransform: "uppercase", fontSize: 12 }}>{chapter ? `${isAr ? chapter.nameArabic : chapter.nameSimple} · ` : ""}{m.common.ayah} {aNum}</Text>
                <Text style={{ color: ink, textAlign: "center", fontSize: Math.min(34, width / 12), lineHeight: Math.min(34, width / 12) * 1.9, writingDirection: "rtl" }}>{ayah.text}</Text>
                <Text style={{ color: ink, textAlign: "center", opacity: 0.75, fontSize: 12 }}>{t.tapHint}</Text>
              </>
            ) : null}
            {ayah && slide === 1 ? (
              <>
                <Text style={{ color: ink, textAlign: "center", letterSpacing: 2, textTransform: "uppercase", fontSize: 12 }}>{chapter?.translatedName ?? ""} {sNum}:{aNum}</Text>
                <Text style={{ color: ink, textAlign: "center", fontSize: 22, lineHeight: 40, writingDirection: "rtl", opacity: 0.9 }}>{ayah.text}</Text>
                <Text style={{ color: ink, textAlign: "center", fontSize: 18, lineHeight: 29 }}>{ayah.translation?.replace(/<[^>]+>/g, "") ?? m.common.unavailable}</Text>
              </>
            ) : null}
            {ayah && slide === 2 ? (
              <>
                <Text style={{ color: ink, textAlign: "center", letterSpacing: 2, textTransform: "uppercase", fontSize: 12 }}>{t.tafsir}{tafsir ? ` · ${tafsir.name}` : ""}</Text>
                <View style={{ backgroundColor: chipBg, borderRadius: 16, padding: 14 }}><Text style={{ color: ink, fontSize: 16, lineHeight: 26 }}>{tafsir ? (tafsir.text.length > 900 ? `${tafsir.text.slice(0, 900)}…` : tafsir.text) : m.common.loading}</Text></View>
              </>
            ) : null}
            {ayah && slide === 3 ? (
              <>
                <Text style={{ color: ink, textAlign: "center", letterSpacing: 2, textTransform: "uppercase", fontSize: 12 }}>{t.reflect}</Text>
                <Text style={{ color: ink, textAlign: "center", fontSize: 18, lineHeight: 28 }}>{t.reflectPrompt}</Text>
                <TextInput value={note} onChangeText={setNote} placeholder={m.player.noteHint} placeholderTextColor={light ? "#555" : "#ddd"} multiline style={{ minHeight: 110, borderRadius: 16, borderWidth: 1, borderColor: light ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.4)", backgroundColor: chipBg, color: ink, padding: 12, fontSize: 16, textAlignVertical: "top" }} />
                <View style={{ alignItems: "center" }}>{chip(`📝 ${t.saveNote}`, saveNote)}</View>
              </>
            ) : null}
          </ScrollView>
        </View>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center", paddingHorizontal: 16 }}>
          {ayah ? <Link href={{ pathname: "/player", params: { surah: sNum, ayah: aNum } } as never} asChild>{chip(`▶ ${t.listen}`, () => undefined)}</Link> : null}
          {ayah ? <Link href={{ pathname: "/study/[verseKey]", params: { verseKey: ayah.verseKey } } as never} asChild>{chip(`📖 ${t.openStudy}`, () => undefined)}</Link> : null}
          {chip(`↗ ${t.share}`, share)}
          {chip(`🖼 ${t.wallpaper}`, () => setWpIndex((i) => ((i ?? NATURE_WALLPAPERS.indexOf(wallpaper)) + 1) % NATURE_WALLPAPERS.length))}
          {chip(`🔀 ${t.nextAyah}`, () => load(true))}
          <Link href="/azan" asChild>{chip(`🕌 ${m.nav.azan}`, () => undefined)}</Link>
          {toast ? <Text style={{ color: ink, width: "100%", textAlign: "center", fontSize: 12 }}>{toast}</Text> : null}
        </View>
      </View>
    </ImageBackground>
  );
}
