import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { useFonts } from "expo-font";
import * as ImagePicker from "expo-image-picker";
import { Link, Stack, router, useLocalSearchParams } from "expo-router";
import * as Sharing from "expo-sharing";
import { StatusBar } from "expo-status-bar";
import { VideoView, useVideoPlayer } from "expo-video";
import * as WebBrowser from "expo-web-browser";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Image, ImageBackground, Modal, Pressable, ScrollView, Share, Text, TextInput, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { captureRef } from "react-native-view-shot";

import { NATURE_WALLPAPERS, VIDEO_WALLPAPERS, hashString, languageNameForLocale, muezzinById, wallpaperById, wallpaperForSurah, type PlayerReciter, type PrayerName } from "@qam/core";

import { API_BASE_URL } from "@/lib/api";
import { loadAzanSettings } from "@/lib/azan";
import { useFamily } from "@/lib/family";
import { useI18n } from "@/lib/i18n";
import { fetchPlayerSurah, fetchReciters, fetchTafsirs } from "@/lib/player-api";
import { fetchAyahOfDay, fetchChapterRows, fetchTafsirText, type AyahOfDay, type ChapterRow } from "@/lib/study-api";
import { SourcesBadge } from "@/lib/ui";

const SLIDES = 4;
const PREFS_KEY = "qam.story.prefs.v1";
type Font = "naskh" | "amiri" | "scheherazade";
type Bg = { kind: "nature"; id: string } | { kind: "video"; id: string } | { kind: "solid"; id: string } | { kind: "photo"; uri: string };
interface VerseRow { verseKey: string; verseNumber: number; text: { uthmani: string }; translations: { text: string }[] }
interface Prefs { font: Font; size: number; bg: Bg | null; dim: number; tone: "auto" | "light" | "dark"; reciter: string | null; rate: number }
const DEFAULT_PREFS: Prefs = { font: "naskh", size: 1, bg: null, dim: 0.3, tone: "auto", reciter: null, rate: 1 };
const SOLIDS: { id: string; color: string; tone: "light" | "dark" }[] = [
  { id: "emerald", color: "#14805f", tone: "light" }, { id: "navy", color: "#121a33", tone: "light" }, { id: "ink", color: "#1d2a25", tone: "light" },
  { id: "terracotta", color: "#b4552f", tone: "light" }, { id: "parchment", color: "#efe6d2", tone: "dark" }, { id: "sand", color: "#f7e9dc", tone: "dark" },
];
const FONT_FAMILY: Record<Font, string | undefined> = { naskh: undefined, amiri: "Amiri", scheherazade: "ScheherazadeNew" };

/**
 * Ayah of the day as a full-screen story: background, ayah, meaning, tafsir, reflection.
 * Customise sheet: Arabic font, size, background (nature, colour, own photo), dim, text colour,
 * reciter and speed. Share renders the story view to an image for the system share sheet
 * (Instagram, WhatsApp, X, …); sound effects exist on the web app only.
 */
export default function StoryScreen() {
  const { m, locale, isAr, isRtl } = useI18n();
  const t = m.story;
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<{ prayer?: string; azan?: string; surah?: string; from?: string; to?: string }>();
  const prayer = params.prayer as PrayerName | undefined;
  // Ayah range: /story?surah=2&from=255&to=257 shows each ayah as its own page.
  const rangeSurah = Number(params.surah) || null;
  const rangeFrom = Math.max(1, Number(params.from) || 1);
  const rangeTo = Math.max(rangeFrom, Number(params.to) || rangeFrom);
  const range = rangeSurah ? { surah: Math.min(114, Math.max(1, rangeSurah)), from: rangeFrom, to: rangeTo } : null;
  const { profile, dispatch } = useFamily();
  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);
  const [fontsLoaded] = useFonts({ Amiri: require("../../assets/fonts/Amiri-Regular.ttf"), ScheherazadeNew: require("../../assets/fonts/ScheherazadeNew-Regular.ttf") });

  const [ayah, setAyah] = useState<AyahOfDay | null>(null);
  const [pages, setPages] = useState<AyahOfDay[]>([]);
  const [chapter, setChapter] = useState<ChapterRow | null>(null);
  const [chapters, setChapters] = useState<ChapterRow[]>([]);
  const [pick, setPick] = useState<{ surah: number; from: number; to: number }>({ surah: range?.surah ?? 1, from: range?.from ?? 1, to: range?.to ?? 1 });
  const [tafsir, setTafsir] = useState<{ name: string; text: string } | null>(null);
  const [slide, setSlide] = useState(0);
  const [note, setNote] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [azanOn, setAzanOn] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [sheet, setSheet] = useState<"none" | "edit" | "range">("none");
  const [reciters, setReciters] = useState<PlayerReciter[]>([]);
  const [voice, setVoice] = useState<"idle" | "loading" | "azan" | "ayah">("idle");
  const [capturing, setCapturing] = useState(false);
  const shotRef = useRef<React.ElementRef<typeof View>>(null);
  const started = useRef(false);

  useEffect(() => { AsyncStorage.getItem(PREFS_KEY).then((raw) => { if (raw) setPrefs({ ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<Prefs>) }); }).catch(() => undefined); }, []);
  const update = useCallback((patch: Partial<Prefs>) => setPrefs((p) => { const next = { ...p, ...patch }; AsyncStorage.setItem(PREFS_KEY, JSON.stringify(next)).catch(() => undefined); return next; }), []);

  const load = useCallback(async (random = false) => {
    setAyah(null); setPages([]); setTafsir(null); setSlide(0);
    if (range && !random) {
      const res = await fetch(`${API_BASE_URL}/api/public/v1/verses/${range.surah}?${isAr ? "" : "translations=85&"}perPage=300`);
      const rows = ((await res.json()) as { verses: VerseRow[] }).verses.filter((v) => v.verseNumber >= range.from && v.verseNumber <= range.to);
      const list: AyahOfDay[] = rows.map((v) => ({ day: "", verseKey: v.verseKey, text: v.text.uthmani, translation: v.translations[0]?.text?.replace(/<[^>]+>/g, "").trim() ?? null, juz: null }));
      setPages(list); setAyah(list[0] ?? null);
      return;
    }
    const res = await fetch(`${API_BASE_URL}/api/public/v1/ayah/today?language=${locale}${random ? "&random=1" : ""}`);
    setAyah((await res.json()) as AyahOfDay);
  }, [locale, isAr, range?.surah, range?.from, range?.to]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { void load(); }, [load]);
  const slides = pages.length ? pages.length + 1 : SLIDES;
  useEffect(() => { if (pages.length) setAyah(pages[Math.min(slide, pages.length - 1)] ?? null); }, [slide, pages]);
  useEffect(() => { if (sheet !== "range" || chapters.length) return; fetchChapterRows(locale).then(setChapters).catch(() => undefined); }, [sheet, chapters.length, locale]);

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
    loadAzanSettings().then((s) => { player.replace({ uri: muezzinById(s.muezzin).url }); player.play(); setAzanOn(true); setVoice("azan"); }).catch(() => undefined);
    return () => { player.pause(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.azan]);
  useEffect(() => { if (status.didJustFinish) setVoice("idle"); }, [status.didJustFinish]);
  useEffect(() => { if (sheet === "edit" && !reciters.length) fetchReciters(profile?.gender ?? "unspecified").then((l) => setReciters(l.filter((r) => r.recitationId !== null))).catch(() => undefined); }, [sheet, reciters.length, profile?.gender]);

  const surah = ayah ? Number(ayah.verseKey.split(":")[0]) : 1;
  const natureDefault = useMemo(() => { const base = wallpaperForSurah(surah, "nature"); const shift = ayah ? hashString(ayah.day) % NATURE_WALLPAPERS.length : 0; return (NATURE_WALLPAPERS[(NATURE_WALLPAPERS.indexOf(base) + shift) % NATURE_WALLPAPERS.length] ?? base).id; }, [surah, ayah]);
  const bg = useMemo(() => {
    if (prefs.bg?.kind === "video") { const w = VIDEO_WALLPAPERS.find((x) => x.id === (prefs.bg as { id: string }).id) ?? VIDEO_WALLPAPERS[0]; return { uri: w.url, video: w.video, color: undefined as string | undefined, tone: "light" as const, credit: w.credit }; }
    if (!prefs.bg || prefs.bg.kind === "nature") { const w = wallpaperById(prefs.bg?.id ?? natureDefault) ?? NATURE_WALLPAPERS[0]; return { uri: w.url, color: undefined as string | undefined, tone: (w.tone === "dark" ? "dark" : "light") as "light" | "dark", credit: w.credit }; }
    if (prefs.bg.kind === "solid") { const s = SOLIDS.find((x) => x.id === (prefs.bg as { id: string }).id) ?? SOLIDS[0]; return { uri: undefined, video: undefined, color: s.color, tone: s.tone, credit: undefined }; }
    return { uri: prefs.bg.uri, video: undefined, color: undefined, tone: "light" as const, credit: undefined };
  }, [prefs.bg, natureDefault]);
  const bgPlayer = useVideoPlayer(bg.video ?? null, (p) => { p.loop = true; p.muted = true; p.play(); });
  useEffect(() => { if (bg.video) { bgPlayer.loop = true; bgPlayer.muted = true; bgPlayer.play(); } }, [bg.video, bgPlayer]);
  const tone = prefs.tone === "auto" ? bg.tone : prefs.tone;
  const light = tone === "dark"; // dark text on light ground
  const ink = light ? "#15201b" : "#ffffff";
  const chipBg = light ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.4)";
  const fontFamily = fontsLoaded ? FONT_FAMILY[prefs.font] : undefined;
  const arSize = Math.min(34, width / 12) * prefs.size;

  const next = () => setSlide((s) => Math.min(slides - 1, s + 1));
  const prev = () => setSlide((s) => Math.max(0, s - 1));
  const flash = (x: string) => { setToast(x); setTimeout(() => setToast(null), 2200); };
  const studyUrl = ayah ? `${API_BASE_URL}/study/${ayah.verseKey}` : API_BASE_URL;
  const shareText = ayah ? `${ayah.text}\n${ayah.translation?.replace(/<[^>]+>/g, "") ?? ""}\n(${ayah.verseKey}) · ${t.shareText}` : t.shareText;

  const shareImage = async () => {
    if (!shotRef.current) return;
    setCapturing(true);
    try {
      await new Promise((r) => setTimeout(r, 120));
      const uri = await captureRef(shotRef.current as never, { format: "png", quality: 1, result: "tmpfile" });
      setCapturing(false);
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: "image/png", dialogTitle: t.shareTitle, UTI: "public.png" });
      else await Share.share({ message: `${shareText}\n${studyUrl}` });
    } catch { setCapturing(false); flash(m.common.unavailable); }
  };
  const shareLink = () => Share.share({ message: `${shareText}\n${studyUrl}` }).catch(() => undefined);
  /** The video studio runs in the web app (one renderer for every platform); opened in the in-app browser so the share sheet is native. */
  const shareVideo = () => {
    if (!ayah) return;
    const [s, a] = ayah.verseKey.split(":");
    const bgId = prefs.bg && prefs.bg.kind !== "photo" ? prefs.bg.id : "";
    const q = `surah=${range?.surah ?? s}&from=${range?.from ?? a}&to=${range?.to ?? a}${bgId ? `&bg=${bgId}` : ""}${prefs.reciter ? `&reciter=${prefs.reciter}` : ""}&font=${prefs.font}&size=${prefs.size}&dim=${prefs.dim}&tone=${prefs.tone}&embed=1`;
    WebBrowser.openBrowserAsync(`${API_BASE_URL}/story/video?${q}`, { presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN }).catch(() => flash(m.common.unavailable));
  };
  const applyRange = () => { const c = chapters.find((x) => x.id === pick.surah); const max = c?.versesCount ?? 286; const from = Math.min(max, Math.max(1, pick.from)); const to = Math.min(max, Math.max(from, pick.to)); setSheet("none"); router.push({ pathname: "/story", params: { surah: String(pick.surah), from: String(from), to: String(to) } } as never); };
  const saveNote = () => {
    if (!ayah || !note.trim()) return;
    if (!profile) { flash(m.common.noProfile); return; }
    dispatch({ type: "note/save", verseKey: ayah.verseKey, body: note.trim() });
    setNote(""); flash(t.noteSaved);
  };
  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.85, allowsEditing: true, aspect: [9, 16] });
    if (!res.canceled && res.assets[0]) update({ bg: { kind: "photo", uri: res.assets[0].uri }, tone: "auto" });
  };
  const playAyah = async () => {
    if (!ayah) return;
    if (voice === "ayah") { player.pause(); setVoice("idle"); return; }
    const list = reciters.length ? reciters : (await fetchReciters(profile?.gender ?? "unspecified").catch(() => [])).filter((r) => r.recitationId !== null);
    if (!reciters.length) setReciters(list);
    const chosen = list.find((r) => r.id === prefs.reciter) ?? list[0];
    if (!chosen) return;
    setVoice("loading");
    try {
      const p = await fetchPlayerSurah(surah, { chapterReciterId: null, recitationId: chosen.recitationId }, null);
      const seg = p.segments.find((s) => s.key === ayah.verseKey);
      if (!seg?.audioUrl) { setVoice("idle"); flash(m.common.unavailable); return; }
      player.replace({ uri: seg.audioUrl }); player.setPlaybackRate(prefs.rate); player.play(); setVoice("ayah"); setAzanOn(false);
    } catch { setVoice("idle"); flash(m.common.unavailable); }
  };

  const hour = new Date().getHours();
  const greeting = prayer && m.azan.prayers[prayer] ? `${t.forPrayer} ${m.azan.prayers[prayer]}` : hour < 12 ? t.goodMorning : t.goodEvening;
  const [sNum, aNum] = (ayah?.verseKey ?? "1:1").split(":");
  const chip = (label: string, onPress: () => void, key?: string, primary = false) => (
    <Pressable key={key ?? label} onPress={onPress} style={{ backgroundColor: primary ? "#14805f" : chipBg, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9, borderWidth: 1, borderColor: primary ? "#14805f" : light ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.3)" }}>
      <Text style={{ color: primary ? "#fff" : ink, fontSize: 13 }}>{label}</Text>
    </Pressable>
  );
  const kicker = (txt: string) => <Text style={{ color: ink, textAlign: "center", letterSpacing: 2, textTransform: "uppercase", fontSize: 12 }}>{txt}</Text>;
  const Opt = ({ label, on, onPress, style }: { label: string; on: boolean; onPress: () => void; style?: object }) => (
    <Pressable onPress={onPress} style={[{ borderWidth: 1, borderColor: on ? "#14805f" : "rgba(0,0,0,0.15)", backgroundColor: on ? "#14805f" : "#f0ece1", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 }, style]}><Text style={{ color: on ? "#fff" : "#15201b", fontSize: 13 }}>{label}</Text></Pressable>
  );

  return (
    <View ref={shotRef} collapsable={false} style={{ flex: 1, backgroundColor: bg.color ?? "#0b1228" }}>
      {bg.video ? <VideoView player={bgPlayer} style={{ position: "absolute", inset: 0 }} contentFit="cover" nativeControls={false} /> : null}
      <ImageBackground source={bg.uri && !bg.video ? { uri: bg.uri } : undefined} style={{ flex: 1 }} resizeMode="cover">
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar style={light ? "dark" : "light"} />
        <View style={{ flex: 1, backgroundColor: light ? `rgba(255,255,255,${prefs.dim})` : `rgba(0,0,0,${prefs.dim})`, paddingTop: insets.top + 10, paddingBottom: insets.bottom + 10 }}>
          {!capturing ? (
            <View style={{ paddingHorizontal: 16, gap: 10 }}>
              <View style={{ flexDirection: "row", gap: 5 }}>{Array.from({ length: slides }).map((_, i) => <View key={i} style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: i <= slide ? ink : light ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.35)" }} />)}</View>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <Text style={{ color: ink, fontSize: 13, flex: 1 }} numberOfLines={1}>✨ {range ? `${chapter ? (isAr ? chapter.nameArabic : chapter.nameSimple) : t.ayahRange} ${range.surah}:${range.from}${range.to !== range.from ? `-${range.to}` : ""}` : `${t.title} · ${greeting}`}</Text>
                {chip(`🎨 ${t.customise}`, () => setSheet("edit"))}
                <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: chipBg, alignItems: "center", justifyContent: "center" }}><Text style={{ color: ink, fontSize: 16 }}>✕</Text></Pressable>
              </View>
              {azanOn ? <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "rgba(29,158,117,0.9)", borderRadius: 14, padding: 10 }}><Text style={{ color: "#fff" }}>🕌 {m.azan.title}</Text>{chip(`⏹ ${m.azan.stop}`, () => { player.pause(); setAzanOn(false); setVoice("idle"); })}</View> : null}
            </View>
          ) : <View style={{ paddingHorizontal: 16 }}>{kicker(`${chapter ? (isAr ? chapter.nameArabic : chapter.nameSimple) : ""} · ${ayah?.verseKey ?? ""}`)}</View>}

          <View style={{ flex: 1 }}>
            <View style={{ position: "absolute", inset: 0, flexDirection: "row" }}>
              <Pressable style={{ flex: 1 }} onPress={isRtl ? next : prev} />
              <Pressable style={{ flex: 1 }} onPress={isRtl ? prev : next} />
            </View>
            <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 22, paddingVertical: 16, gap: 16 }} pointerEvents={slide === 3 ? "auto" : "box-none"}>
              {!ayah ? <Text style={{ color: ink, textAlign: "center" }}>{m.common.loading}</Text> : null}
              {ayah && pages.length && slide < pages.length && !capturing ? (<>
                {kicker(`${chapter ? `${isAr ? chapter.nameArabic : chapter.nameSimple} · ` : ""}${m.common.ayah} ${aNum}`)}
                <Text style={{ color: ink, textAlign: "center", fontSize: arSize, lineHeight: arSize * 1.9, writingDirection: "rtl", fontFamily }}>{ayah.text}</Text>
                {ayah.translation ? <Text style={{ color: ink, textAlign: "center", fontSize: 17, lineHeight: 27, opacity: 0.92 }}>{ayah.translation}</Text> : null}
                {slide === 0 ? <Text style={{ color: ink, textAlign: "center", opacity: 0.75, fontSize: 12 }}>{t.tapHint}</Text> : null}
              </>) : null}
              {ayah && pages.length && slide === pages.length && !capturing ? (<>
                {kicker(t.reflect)}
                <Text style={{ color: ink, textAlign: "center", fontSize: 18, lineHeight: 28 }}>{t.reflectPrompt}</Text>
                <TextInput value={note} onChangeText={setNote} placeholder={m.player.noteHint} placeholderTextColor={light ? "#555" : "#ddd"} multiline style={{ minHeight: 110, borderRadius: 16, borderWidth: 1, borderColor: light ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.4)", backgroundColor: light ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.3)", color: ink, padding: 12 }} />
                <View style={{ alignItems: "center" }}>{chip(`📝 ${t.saveNote}`, saveNote)}</View>
              </>) : null}
              {ayah && ((slide === 0 && !pages.length) || capturing) ? (<>
                {!capturing ? kicker(`${chapter ? `${isAr ? chapter.nameArabic : chapter.nameSimple} · ` : ""}${m.common.ayah} ${aNum}`) : null}
                <Text style={{ color: ink, textAlign: "center", fontSize: arSize, lineHeight: arSize * 1.9, writingDirection: "rtl", fontFamily, textShadowColor: light ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.35)", textShadowRadius: 12 }}>{ayah.text}</Text>
                {capturing && ayah.translation ? <Text style={{ color: ink, textAlign: "center", fontSize: 16, lineHeight: 25, opacity: 0.9 }}>{ayah.translation.replace(/<[^>]+>/g, "")}</Text> : null}
                {!capturing ? <Text style={{ color: ink, textAlign: "center", opacity: 0.75, fontSize: 12 }}>{t.tapHint}</Text> : null}
              </>) : null}
              {ayah && !pages.length && slide === 1 && !capturing ? (<>
                {kicker(`${chapter?.translatedName ?? ""} ${sNum}:${aNum}`)}
                <Text style={{ color: ink, textAlign: "center", fontSize: 22 * prefs.size, lineHeight: 40 * prefs.size, writingDirection: "rtl", opacity: 0.9, fontFamily }}>{ayah.text}</Text>
                <Text style={{ color: ink, textAlign: "center", fontSize: 18, lineHeight: 29 }}>{ayah.translation?.replace(/<[^>]+>/g, "") ?? m.common.unavailable}</Text>
              </>) : null}
              {ayah && !pages.length && slide === 2 && !capturing ? (<>
                {kicker(`${t.tafsir}${tafsir ? ` · ${tafsir.name}` : ""}`)}
                <View style={{ backgroundColor: chipBg, borderRadius: 16, padding: 14 }}><Text style={{ color: ink, fontSize: 16, lineHeight: 26 }}>{tafsir ? (tafsir.text.length > 900 ? `${tafsir.text.slice(0, 900)}…` : tafsir.text) : m.common.loading}</Text></View>
              </>) : null}
              {ayah && !pages.length && slide === 3 && !capturing ? (<>
                {kicker(t.reflect)}
                <Text style={{ color: ink, textAlign: "center", fontSize: 18, lineHeight: 28 }}>{t.reflectPrompt}</Text>
                <TextInput value={note} onChangeText={setNote} placeholder={m.player.noteHint} placeholderTextColor={light ? "#555" : "#ddd"} multiline style={{ minHeight: 110, borderRadius: 16, borderWidth: 1, borderColor: light ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.4)", backgroundColor: chipBg, color: ink, padding: 12, fontSize: 16, textAlignVertical: "top" }} />
                <View style={{ alignItems: "center" }}>{chip(`📝 ${t.saveNote}`, saveNote)}</View>
              </>) : null}
            </ScrollView>
          </View>

          {capturing ? (
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingBottom: 8 }}>
              <Image source={require("../../assets/images/icon.png")} style={{ width: 28, height: 28, borderRadius: 7 }} />
              <Text style={{ color: ink, fontWeight: "700" }}>{m.common.appName}</Text>
              <Text style={{ color: ink, opacity: 0.8, fontSize: 12 }}>quran-and-more.netlify.app</Text>
            </View>
          ) : (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center", paddingHorizontal: 16 }}>
              {chip(voice === "ayah" ? `⏹ ${m.azan.stop}` : voice === "loading" ? m.common.loading : `▶ ${t.playAyah}`, playAyah)}
              {ayah ? <Link href={{ pathname: "/study/[verseKey]", params: { verseKey: ayah.verseKey } } as never} asChild>{chip(`📖 ${t.openStudy}`, () => undefined)}</Link> : null}
              {chip(`🎬 ${t.shareVideo}`, shareVideo, "sharevideo", true)}
              {chip(`📤 ${t.shareImage}`, shareImage, "shareimg")}
              {chip(`📑 ${t.chooseAyahs}`, () => { setPick({ surah: range?.surah ?? surah, from: range?.from ?? Number(aNum), to: range?.to ?? Number(aNum) }); setSheet("range"); }, "range")}
              {chip(`🔗 ${t.share}`, shareLink, "sharelink")}
              {chip(`🖼 ${t.wallpaper}`, () => { const ids = NATURE_WALLPAPERS.map((w) => w.id); const cur = prefs.bg?.kind === "nature" ? prefs.bg.id : natureDefault; update({ bg: { kind: "nature", id: ids[(ids.indexOf(cur) + 1) % ids.length] }, tone: "auto" }); })}
              {chip(`🔀 ${t.nextAyah}`, () => load(true))}
              <Link href="/azan" asChild>{chip(`🕌 ${m.nav.azan}`, () => undefined)}</Link>
              <SourcesBadge compact />
              {toast ? <Text style={{ color: ink, width: "100%", textAlign: "center", fontSize: 12 }}>{toast}</Text> : null}
            </View>
          )}
        </View>
      </ImageBackground>

      <Modal visible={sheet === "range"} transparent animationType="slide" onRequestClose={() => setSheet("none")}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" }} onPress={() => setSheet("none")}>
          <View style={{ backgroundColor: "#fffdf7", borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 16, paddingBottom: insets.bottom + 16, maxHeight: "82%", gap: 12 }} onStartShouldSetResponder={() => true}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontWeight: "700", fontSize: 16, color: "#15201b" }}>📑 {t.chooseAyahs}</Text>
              <Pressable onPress={() => setSheet("none")} style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: "#f0ece1", alignItems: "center", justifyContent: "center" }}><Text>✕</Text></Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {chapters.map((c) => <Opt key={c.id} label={`${c.id}. ${isAr ? c.nameArabic : c.nameSimple}`} on={pick.surah === c.id} onPress={() => setPick({ surah: c.id, from: 1, to: 1 })} />)}
            </ScrollView>
            <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
              <Text style={{ color: "#55625b" }}>{t.fromAyah}</Text>
              <TextInput keyboardType="number-pad" value={String(pick.from)} onChangeText={(v) => setPick((p) => ({ ...p, from: Number(v) || 1 }))} style={{ width: 72, borderWidth: 1, borderColor: "rgba(0,0,0,0.15)", borderRadius: 10, padding: 8, textAlign: "center", color: "#15201b" }} />
              <Text style={{ color: "#55625b" }}>{t.toAyah}</Text>
              <TextInput keyboardType="number-pad" value={String(pick.to)} onChangeText={(v) => setPick((p) => ({ ...p, to: Number(v) || p.from }))} style={{ width: 72, borderWidth: 1, borderColor: "rgba(0,0,0,0.15)", borderRadius: 10, padding: 8, textAlign: "center", color: "#15201b" }} />
              <Text style={{ color: "#55625b", fontSize: 12 }}>/ {chapters.find((c) => c.id === pick.surah)?.versesCount ?? ""}</Text>
            </View>
            <View style={{ flexDirection: "row" }}><Opt label={t.apply} on onPress={applyRange} /></View>
            <Text style={{ color: "#55625b", fontSize: 12 }}>{t.videoHint}</Text>
          </View>
        </Pressable>
      </Modal>

      <Modal visible={sheet === "edit"} transparent animationType="slide" onRequestClose={() => setSheet("none")}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" }} onPress={() => setSheet("none")}>
          <View style={{ backgroundColor: "#fffdf7", borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 16, paddingBottom: insets.bottom + 16, maxHeight: "82%" }} onStartShouldSetResponder={() => true}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <Text style={{ fontWeight: "700", fontSize: 16, color: "#15201b" }}>🎨 {t.customise}</Text>
              <Pressable onPress={() => setSheet("none")} style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: "#f0ece1", alignItems: "center", justifyContent: "center" }}><Text>✕</Text></Pressable>
            </View>
            <ScrollView contentContainerStyle={{ gap: 14 }}>
              <View style={{ gap: 8 }}>
                <Text style={{ fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: "#55625b" }}>{t.font}</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {(["naskh", "amiri", "scheherazade"] as Font[]).map((f) => <Opt key={f} label={`${f === "naskh" ? "Naskh" : f === "amiri" ? "Amiri" : "Scheherazade"} · بسم الله`} on={prefs.font === f} onPress={() => update({ font: f })} />)}
                </View>
              </View>
              <View style={{ gap: 8 }}>
                <Text style={{ fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: "#55625b" }}>{t.size}</Text>
                <View style={{ flexDirection: "row", gap: 8 }}>{[0.8, 1, 1.2, 1.4].map((s) => <Opt key={s} label={`${Math.round(s * 100)}%`} on={prefs.size === s} onPress={() => update({ size: s })} />)}</View>
              </View>
              <View style={{ gap: 8 }}>
                <Text style={{ fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: "#55625b" }}>{t.background}</Text>
                <Text style={{ fontSize: 11, color: "#55625b" }}>▶ {t.moving}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {VIDEO_WALLPAPERS.map((w) => { const on = prefs.bg?.kind === "video" && prefs.bg.id === w.id; return <Pressable key={w.id} onPress={() => update({ bg: { kind: "video", id: w.id }, tone: "auto" })} style={{ width: 72, height: 108, borderRadius: 12, overflow: "hidden", borderWidth: 2, borderColor: on ? "#14805f" : "transparent" }}><ImageBackground source={{ uri: w.url }} style={{ flex: 1, justifyContent: "flex-end" }}><Text style={{ color: "#fff", fontSize: 10, padding: 4, backgroundColor: "rgba(0,0,0,0.45)" }} numberOfLines={1}>▶ {isAr ? w.title.ar : w.title.en}</Text></ImageBackground></Pressable>; })}
                </ScrollView>
                <Text style={{ fontSize: 11, color: "#55625b" }}>{t.nature}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {NATURE_WALLPAPERS.map((w) => { const on = (prefs.bg?.kind === "nature" ? prefs.bg.id : prefs.bg ? "" : natureDefault) === w.id; return <Pressable key={w.id} onPress={() => update({ bg: { kind: "nature", id: w.id }, tone: "auto" })}><Image source={{ uri: w.url?.replace("w=1920", "w=320") }} style={{ width: 64, height: 100, borderRadius: 12, borderWidth: 2, borderColor: on ? "#14805f" : "transparent" }} /></Pressable>; })}
                </ScrollView>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                  {SOLIDS.map((s) => <Pressable key={s.id} onPress={() => update({ bg: { kind: "solid", id: s.id }, tone: "auto" })} style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: s.color, borderWidth: 2, borderColor: prefs.bg?.kind === "solid" && prefs.bg.id === s.id ? "#14805f" : "rgba(0,0,0,0.1)" }} />)}
                  <Opt label={`📷 ${t.upload}`} on={prefs.bg?.kind === "photo"} onPress={pickPhoto} />
                </View>
                <Text style={{ fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: "#55625b" }}>{t.dim}</Text>
                <View style={{ flexDirection: "row", gap: 8 }}>{[0, 0.15, 0.3, 0.45, 0.6].map((d) => <Opt key={d} label={`${Math.round(d * 100)}%`} on={prefs.dim === d} onPress={() => update({ dim: d })} />)}</View>
              </View>
              <View style={{ gap: 8 }}>
                <Text style={{ fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: "#55625b" }}>{t.textColor}</Text>
                <View style={{ flexDirection: "row", gap: 8 }}>{(["auto", "light", "dark"] as const).map((x) => <Opt key={x} label={x === "auto" ? t.auto : x === "light" ? t.light : t.dark} on={prefs.tone === x} onPress={() => update({ tone: x })} />)}</View>
              </View>
              <View style={{ gap: 8 }}>
                <Text style={{ fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: "#55625b" }}>{t.voice}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {reciters.map((r) => <Opt key={r.id} label={isAr ? r.arabicName : r.latinName} on={(prefs.reciter ?? reciters[0]?.id) === r.id} onPress={() => update({ reciter: r.id })} />)}
                </ScrollView>
                <View style={{ flexDirection: "row", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <Opt label={voice === "ayah" ? `⏹ ${m.azan.stop}` : `▶ ${t.playAyah}`} on onPress={playAyah} />
                  {[0.85, 1, 1.15].map((r) => <Opt key={r} label={`${r}×`} on={prefs.rate === r} onPress={() => { update({ rate: r }); player.setPlaybackRate(r); }} />)}
                </View>
                <Text style={{ color: "#55625b", fontSize: 12 }}>{t.effectsWebOnly}</Text>
              </View>
              <View style={{ flexDirection: "row" }}><Opt label={`↺ ${t.reset}`} on={false} onPress={() => update({ ...DEFAULT_PREFS })} /></View>
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
