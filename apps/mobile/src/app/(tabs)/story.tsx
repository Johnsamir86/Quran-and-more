import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { useFonts } from "expo-font";
import * as ImagePicker from "expo-image-picker";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import * as Sharing from "expo-sharing";
import { StatusBar } from "expo-status-bar";
import { VideoView, useVideoPlayer } from "expo-video";
import * as WebBrowser from "expo-web-browser";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Image, ImageBackground, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Share, Text, TextInput, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { captureRef } from "react-native-view-shot";

import { NATURE_WALLPAPERS, VIDEO_WALLPAPERS, languageNameForLocale, wallpaperById, wallpaperForSurah, type PlayerReciter, STORY_TEXT_COLORS, isLightColor } from "@qam/core";

import { API_BASE_URL } from "@/lib/api";
import { useFamily } from "@/lib/family";
import { useI18n } from "@/lib/i18n";
import { PlusGate } from "@/lib/plus";
import { fetchPlayerSurah, fetchReciters, fetchTafsirs } from "@/lib/player-api";
import { fetchAyahOfDay, fetchChapterRows, fetchTafsirText, type AyahOfDay, type ChapterRow } from "@/lib/study-api";

const SLIDES = 4;
const PREFS_KEY = "qam.story.prefs.v1";
/** Bumped when the defaults change: 2 = moving backgrounds are the default, so an older saved still photo is dropped once. */
const PREFS_VERSION = 2;
type Font = "naskh" | "amiri" | "scheherazade";
type Bg = { kind: "nature"; id: string } | { kind: "video"; id: string } | { kind: "solid"; id: string } | { kind: "photo"; uri: string };
interface VerseRow { verseKey: string; verseNumber: number; text: { uthmani: string }; translations: { text: string }[] }
interface Prefs { v: number; font: Font; size: number; bg: Bg | null; dim: number; tone: "auto" | "light" | "dark"; color: string | null; reciter: string | null; rate: number; muted: boolean }
interface Range { surah: number; from: number; to: number }
const DEFAULT_PREFS: Prefs = { v: PREFS_VERSION, font: "naskh", size: 1, bg: null, dim: 0.3, tone: "auto", color: null, reciter: null, rate: 1, muted: false };
const SOLIDS: { id: string; color: string; tone: "light" | "dark" }[] = [
  { id: "emerald", color: "#14805f", tone: "light" }, { id: "navy", color: "#121a33", tone: "light" }, { id: "ink", color: "#1d2a25", tone: "light" },
  { id: "terracotta", color: "#b4552f", tone: "light" }, { id: "parchment", color: "#efe6d2", tone: "dark" }, { id: "sand", color: "#f7e9dc", tone: "dark" },
];
const FONT_FAMILY: Record<Font, string | undefined> = { naskh: undefined, amiri: "Amiri", scheherazade: "ScheherazadeNew" };

/**
 * Ayah of the day as a full-screen story: background, ayah, meaning, tafsir, reflection.
 * The screen stands alone: it links to no other part of the app, and the azan plays on the Azan screen, not here. The ayah recites itself (mute in the action bar),
 * and a chosen range of ayahs plays through, one page per ayah, advancing as each recitation ends.
 * Actions sit in one row of icons with a label under each. Moving backgrounds are the default.
 * Customise sheet: Arabic font, size, background (moving, nature, colour, own photo), dim, text colour,
 * reciter and speed. Share renders the story view to an image for the system share sheet
 * (Instagram, WhatsApp, X, …); sound effects exist on the web app only.
 */
function StoryScreen() {
  const { m, locale, isAr, isRtl } = useI18n();
  const t = m.story;
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<{ surah?: string; from?: string; to?: string }>();
  // Ayah range: each ayah is its own page. Held in state so choosing a range never depends on navigation;
  // a link such as /story?surah=2&from=255&to=257 only seeds it.
  const [range, setRange] = useState<Range | null>(null);
  useEffect(() => {
    const s = Number(params.surah) || 0;
    if (!s) return;
    const from = Math.max(1, Number(params.from) || 1);
    setRange({ surah: Math.min(114, Math.max(1, s)), from, to: Math.max(from, Number(params.to) || from) });
  }, [params.surah, params.from, params.to]);
  const { profile, dispatch } = useFamily();
  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);
  const [fontsLoaded] = useFonts({ Amiri: require("../../../assets/fonts/Amiri-Regular.ttf"), ScheherazadeNew: require("../../../assets/fonts/ScheherazadeNew-Regular.ttf") });

  const [ayah, setAyah] = useState<AyahOfDay | null>(null);
  const [pages, setPages] = useState<AyahOfDay[]>([]);
  const [chapter, setChapter] = useState<ChapterRow | null>(null);
  const [chapters, setChapters] = useState<ChapterRow[]>([]);
  const [pick, setPick] = useState<Range>({ surah: 1, from: 1, to: 1 });
  const [tafsir, setTafsir] = useState<{ name: string; text: string } | null>(null);
  const [slide, setSlide] = useState(0);
  const [note, setNote] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [sheet, setSheet] = useState<"none" | "edit" | "range">("none");
  const [reciters, setReciters] = useState<PlayerReciter[]>([]);
  const [voice, setVoice] = useState<"idle" | "loading" | "ayah">("idle");
  const [capturing, setCapturing] = useState(false);
  const shotRef = useRef<React.ElementRef<typeof View>>(null);
  const playedKey = useRef<string | null>(null);
  const playToken = useRef(0);
  const loadToken = useRef(0);
  const [shuffle, setShuffle] = useState(0);
  const audioCache = useRef<{ key: string; urls: Map<string, string> } | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(PREFS_KEY).then((raw) => {
      if (!raw) return;
      const saved = JSON.parse(raw) as Partial<Prefs>;
      const stale = (saved.v ?? 1) < PREFS_VERSION;
      setPrefs({ ...DEFAULT_PREFS, ...saved, v: PREFS_VERSION, bg: stale && saved.bg?.kind === "nature" ? null : saved.bg ?? null });
    }).catch(() => undefined);
  }, []);
  const update = useCallback((patch: Partial<Prefs>) => setPrefs((p) => { const next = { ...p, ...patch }; AsyncStorage.setItem(PREFS_KEY, JSON.stringify(next)).catch(() => undefined); return next; }), []);

  const load = useCallback(async () => {
    const random = shuffle > 0;
    const token = ++loadToken.current;
    setAyah(null); setPages([]); setTafsir(null); setSlide(0); playedKey.current = null;
    if (range && !random) {
      const res = await fetch(`${API_BASE_URL}/api/public/v1/verses/${range.surah}?${isAr ? "" : "translations=85&"}perPage=300`);
      if (!res.ok) throw new Error(`verses ${res.status}`);
      const rows = ((await res.json()) as { verses: VerseRow[] }).verses.filter((v) => v.verseNumber >= range.from && v.verseNumber <= range.to);
      const list: AyahOfDay[] = rows.map((v) => ({ day: "", verseKey: v.verseKey, text: v.text.uthmani, translation: v.translations[0]?.text?.replace(/<[^>]+>/g, "").trim() ?? null, juz: null }));
      if (token !== loadToken.current) return;
      setPages(list); setAyah(list[0] ?? null);
      return;
    }
    const res = await fetch(`${API_BASE_URL}/api/public/v1/ayah/today?language=${locale}${random ? "&random=1" : ""}`);
    const today = (await res.json()) as AyahOfDay;
    if (token === loadToken.current) setAyah(today);
  }, [locale, isAr, shuffle, range?.surah, range?.from, range?.to]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load().catch(() => { setToast(m.common.unavailable); setTimeout(() => setToast(null), 2200); }); }, [load]); // eslint-disable-line react-hooks/exhaustive-deps
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

  /* When an ayah of a range finishes, turn to the next one; its recitation starts from the effect below. */
  useEffect(() => {
    if (!status.didJustFinish) return;
    if (voice === "ayah" && pages.length && slide < pages.length - 1) setSlide(slide + 1);
    setVoice("idle");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status.didJustFinish]);
  /* The story recites itself: every ayah that comes on screen is recited once. */
  useEffect(() => {
    if (!ayah || playedKey.current === ayah.verseKey) return;
    playedKey.current = ayah.verseKey;
    const target = ayah.verseKey;
    const id = setTimeout(() => { void playAyah(target); }, 350);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ayah?.verseKey]);
  useEffect(() => { player.muted = prefs.muted; }, [player, prefs.muted]);
  /* Leaving the tab stops the recitation (a range would otherwise keep turning pages unseen); coming back resumes the ayah on screen. */
  const current = useRef<string | null>(null);
  current.current = ayah?.verseKey ?? null;
  const leftWhilePlaying = useRef(false);
  useFocusEffect(useCallback(() => {
    if (leftWhilePlaying.current && current.current) { leftWhilePlaying.current = false; void playAyah(current.current); }
    return () => { playToken.current += 1; leftWhilePlaying.current = true; player.pause(); setVoice("idle"); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player]));
  useEffect(() => { if (sheet === "edit" && !reciters.length) fetchReciters(profile?.gender ?? "unspecified").then((l) => setReciters(l.filter((r) => r.recitationId !== null))).catch(() => undefined); }, [sheet, reciters.length, profile?.gender]);

  const surah = ayah ? Number(ayah.verseKey.split(":")[0]) : 1;
  /* Nothing chosen: a moving background that suits the surah. */
  const videoDefault = useMemo(() => wallpaperForSurah(surah, "video").id, [surah]);
  const bg = useMemo(() => {
    if (!prefs.bg || prefs.bg.kind === "video") { const id = prefs.bg?.kind === "video" ? prefs.bg.id : videoDefault; const w = VIDEO_WALLPAPERS.find((x) => x.id === id) ?? VIDEO_WALLPAPERS[0]; return { uri: w.url, video: w.video, color: undefined as string | undefined, tone: "light" as const, credit: w.credit }; }
    if (prefs.bg.kind === "nature") { const w = wallpaperById(prefs.bg.id) ?? NATURE_WALLPAPERS[0]; return { uri: w.url, video: undefined, color: undefined as string | undefined, tone: (w.tone === "dark" ? "dark" : "light") as "light" | "dark", credit: w.credit }; }
    if (prefs.bg.kind === "solid") { const s = SOLIDS.find((x) => x.id === (prefs.bg as { id: string }).id) ?? SOLIDS[0]; return { uri: undefined, video: undefined, color: s.color, tone: s.tone, credit: undefined }; }
    return { uri: prefs.bg.uri, video: undefined, color: undefined, tone: "light" as const, credit: undefined };
  }, [prefs.bg, videoDefault]);
  const bgPlayer = useVideoPlayer(bg.video ?? null, (p) => { p.loop = true; p.muted = true; p.play(); });
  useEffect(() => { if (bg.video) { bgPlayer.loop = true; bgPlayer.muted = true; bgPlayer.play(); } }, [bg.video, bgPlayer]);
  const tone = prefs.tone === "auto" ? bg.tone : prefs.tone;
  const ink = prefs.color ?? (tone === "dark" ? "#15201b" : "#ffffff");
  const light = !isLightColor(ink); // dark text: lighten the ground and shadows
  // Menus read against the background, whatever colour the ayah text has.
  const onLightBg = bg.tone === "dark";
  const chipBg = onLightBg ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.45)";
  const chipInk = onLightBg ? "#15201b" : "#ffffff";
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
  /** The video studio runs in the web app (one renderer for every platform); opened in the in-app browser so the share sheet is native. */
  const shareVideo = () => {
    if (!ayah) return;
    const [s, a] = ayah.verseKey.split(":");
    const bgId = prefs.bg && prefs.bg.kind !== "photo" ? prefs.bg.id : "";
    const q = `surah=${range?.surah ?? s}&from=${range?.from ?? a}&to=${range?.to ?? a}${bgId ? `&bg=${bgId}` : ""}${prefs.reciter ? `&reciter=${prefs.reciter}` : ""}&font=${prefs.font}&size=${prefs.size}&dim=${prefs.dim}&tone=${prefs.tone}${prefs.color ? `&color=${prefs.color.replace("#", "")}` : ""}&embed=1&auto=1`;
    WebBrowser.openBrowserAsync(`${API_BASE_URL}/story/video?${q}`, { presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN }).catch(() => flash(m.common.unavailable));
  };
  const applyRange = () => { Keyboard.dismiss(); const c = chapters.find((x) => x.id === pick.surah); const max = c?.versesCount ?? 286; const from = Math.min(max, Math.max(1, pick.from)); const to = Math.min(max, Math.max(from, pick.to)); setSheet("none"); setShuffle(0); setRange({ surah: pick.surah, from, to }); };
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
  /** Recite one ayah. Only the latest request plays, so paging quickly never starts an earlier ayah late. */
  const playAyah = async (verseKey: string, reciterId: string | null = prefs.reciter) => {
    const token = ++playToken.current;
    const chapterId = Number(verseKey.split(":")[0]);
    setVoice("loading");
    try {
      const list = reciters.length ? reciters : (await fetchReciters(profile?.gender ?? "unspecified").catch(() => [])).filter((r) => r.recitationId !== null);
      if (!reciters.length) setReciters(list);
      const chosen = list.find((r) => r.id === reciterId) ?? list[0];
      if (!chosen) { if (token === playToken.current) setVoice("idle"); return; }
      const cacheKey = `${chapterId}|${chosen.id}`;
      if (audioCache.current?.key !== cacheKey) {
        const p = await fetchPlayerSurah(chapterId, { chapterReciterId: null, recitationId: chosen.recitationId }, null);
        audioCache.current = { key: cacheKey, urls: new Map(p.segments.flatMap((s) => (s.audioUrl ? [[s.key, s.audioUrl] as [string, string]] : []))) };
      }
      if (token !== playToken.current) return;
      const url = audioCache.current.urls.get(verseKey);
      if (!url) { setVoice("idle"); flash(m.common.unavailable); return; }
      player.replace({ uri: url }); player.setPlaybackRate(prefs.rate); player.muted = prefs.muted; player.play(); setVoice("ayah");
    } catch { if (token === playToken.current) { setVoice("idle"); flash(m.common.unavailable); } }
  };
  const nextBackground = () => {
    const ids = VIDEO_WALLPAPERS.map((w) => w.id);
    const cur = prefs.bg?.kind === "video" ? prefs.bg.id : videoDefault;
    update({ bg: { kind: "video", id: ids[(ids.indexOf(cur) + 1) % ids.length] }, tone: "auto" });
  };
  const openRange = () => { const [s, a] = (ayah?.verseKey ?? "1:1").split(":").map(Number); setPick(range ?? { surah: s, from: a, to: a }); setSheet("range"); };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? t.goodMorning : t.goodEvening;
  const [sNum, aNum] = (ayah?.verseKey ?? "1:1").split(":");
  const chip = (label: string, onPress: () => void, key?: string, primary = false) => (
    <Pressable key={key ?? label} onPress={onPress} style={{ backgroundColor: primary ? "#14805f" : chipBg, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9, borderWidth: 1, borderColor: primary ? "#14805f" : onLightBg ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.3)" }}>
      <Text style={{ color: primary ? "#fff" : chipInk, fontSize: 13 }}>{label}</Text>
    </Pressable>
  );
  /** One action: a round icon with its name under it. */
  const action = (icon: keyof typeof Ionicons.glyphMap, label: string, onPress: () => void, opts: { primary?: boolean; key?: string } = {}) => (
    <Pressable key={opts.key ?? icon} onPress={onPress} accessibilityRole="button" accessibilityLabel={label} hitSlop={4} style={{ width: 64, alignItems: "center", gap: 5 }}>
      <View style={{ width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center", backgroundColor: opts.primary ? "#14805f" : chipBg, borderWidth: 1, borderColor: opts.primary ? "#14805f" : onLightBg ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.3)" }}>
        <Ionicons name={icon} size={21} color={opts.primary ? "#ffffff" : chipInk} />
      </View>
      <Text numberOfLines={2} style={{ color: ink, fontSize: 10.5, lineHeight: 13, textAlign: "center", textShadowColor: light ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)", textShadowRadius: 4 }}>{label}</Text>
    </Pressable>
  );
  const kicker = (txt: string) => <Text style={{ color: ink, textAlign: "center", letterSpacing: 2, textTransform: "uppercase", fontSize: 12 }}>{txt}</Text>;
  const Opt = ({ label, on, onPress, style }: { label: string; on: boolean; onPress: () => void; style?: object }) => (
    <Pressable onPress={onPress} style={[{ borderWidth: 1, borderColor: on ? "#14805f" : "rgba(0,0,0,0.15)", backgroundColor: on ? "#14805f" : "#f0ece1", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 }, style]}><Text style={{ color: on ? "#fff" : "#15201b", fontSize: 13 }}>{label}</Text></Pressable>
  );

  return (
    <View ref={shotRef} collapsable={false} style={{ flex: 1, backgroundColor: bg.color ?? "#0b1228" }}>
      {bg.video && !capturing ? <VideoView player={bgPlayer} style={{ position: "absolute", inset: 0 }} contentFit="cover" nativeControls={false} /> : null}
      {/* The video layer is not part of a view capture, so the poster frame stands in for it while sharing as an image. */}
      <ImageBackground source={bg.uri && (!bg.video || capturing) ? { uri: bg.uri } : undefined} style={{ flex: 1 }} resizeMode="cover">
        <StatusBar style={light ? "dark" : "light"} />
        <View style={{ flex: 1, backgroundColor: light ? `rgba(255,255,255,${prefs.dim})` : `rgba(0,0,0,${prefs.dim})`, paddingTop: insets.top + 10, paddingBottom: insets.bottom + 10 }}>
          {!capturing ? (
            <View style={{ paddingHorizontal: 16, gap: 10 }}>
              <View style={{ flexDirection: "row", gap: 5 }}>{Array.from({ length: slides }).map((_, i) => <View key={i} style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: i <= slide ? ink : light ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.35)" }} />)}</View>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <Text style={{ color: ink, fontSize: 13, flex: 1 }} numberOfLines={1}>✨ {range ? `${chapter ? (isAr ? chapter.nameArabic : chapter.nameSimple) : t.ayahRange} ${range.surah}:${range.from}${range.to !== range.from ? `-${range.to}` : ""}` : `${t.title} · ${greeting}`}</Text>
                <Pressable onPress={() => router.replace("/" as never)} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: chipBg, alignItems: "center", justifyContent: "center" }}><Text style={{ color: ink, fontSize: 16 }}>✕</Text></Pressable>
              </View>
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
              <Image source={require("../../../assets/images/icon.png")} style={{ width: 28, height: 28, borderRadius: 7 }} />
              <Text style={{ color: ink, fontWeight: "700" }}>{m.common.appName}</Text>
            </View>
          ) : (
            <View style={{ gap: 6 }}>
              {toast ? <Text style={{ color: ink, textAlign: "center", fontSize: 12 }}>{toast}</Text> : null}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, justifyContent: "center", gap: 6, paddingHorizontal: 12 }}>
                {action(prefs.muted ? "volume-mute" : "volume-high", t.voice, () => update({ muted: !prefs.muted }), { key: "sound" })}
                {action("list", t.ayahRange, openRange)}
                {action("color-palette", t.customise, () => setSheet("edit"))}
                {action("film", t.background, nextBackground)}
                {action("videocam", t.shareVideo, shareVideo, { primary: true })}
                {action("image", t.shareImage, shareImage)}
                {action("shuffle", t.nextAyah, () => { setRange(null); setShuffle((n) => n + 1); })}
              </ScrollView>
            </View>
          )}
        </View>
      </ImageBackground>

      <Modal visible={sheet === "range"} transparent animationType="slide" onRequestClose={() => setSheet("none")}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" }} onPress={() => { Keyboard.dismiss(); setSheet("none"); }}>
          <View style={{ backgroundColor: "#fffdf7", borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 16, paddingBottom: insets.bottom + 16, maxHeight: "82%", gap: 12 }} onStartShouldSetResponder={() => true}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontWeight: "700", fontSize: 16, color: "#15201b" }}>📑 {t.chooseAyahs}</Text>
              <Pressable onPress={() => setSheet("none")} style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: "#f0ece1", alignItems: "center", justifyContent: "center" }}><Text>✕</Text></Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {chapters.map((c) => <Opt key={c.id} label={`${c.id}. ${isAr ? c.nameArabic : c.nameSimple}`} on={pick.surah === c.id} onPress={() => setPick({ surah: c.id, from: 1, to: 1 })} />)}
            </ScrollView>
            {(["from", "to"] as const).map((field) => {
              const max = chapters.find((c) => c.id === pick.surah)?.versesCount ?? 286;
              const value = pick[field];
              const set = (n: number) => setPick((p) => { const v = Math.min(max, Math.max(1, n || 1)); return field === "from" ? { ...p, from: v, to: Math.max(v, p.to) } : { ...p, to: Math.max(p.from, v) }; });
              const Step = ({ label, d }: { label: string; d: number }) => <Pressable onPress={() => set(value + d)} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#f0ece1", alignItems: "center", justifyContent: "center" }}><Text style={{ fontSize: 18, color: "#15201b" }}>{label}</Text></Pressable>;
              return (
                <View key={field} style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
                  <Text style={{ color: "#55625b", width: 78 }}>{field === "from" ? t.fromAyah : t.toAyah}</Text>
                  <Step label="−" d={-1} />
                  <TextInput keyboardType="numbers-and-punctuation" returnKeyType="done" blurOnSubmit onSubmitEditing={Keyboard.dismiss} value={String(value)} onChangeText={(v) => set(Number(v.replace(/[^0-9]/g, "")))} selectTextOnFocus style={{ width: 70, borderWidth: 1, borderColor: "rgba(0,0,0,0.15)", borderRadius: 10, padding: 8, textAlign: "center", color: "#15201b", fontSize: 16 }} />
                  <Step label="+" d={1} />
                  <Text style={{ color: "#55625b", fontSize: 12 }}>/ {max}</Text>
                </View>
              );
            })}
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Opt label={t.apply} on onPress={applyRange} />
              <Opt label={m.common.close} on={false} onPress={() => { Keyboard.dismiss(); setSheet("none"); }} />
            </View>
            <Text style={{ color: "#55625b", fontSize: 12 }}>{t.videoHint}</Text>
          </View>
        </Pressable>
        </KeyboardAvoidingView>
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
                  {VIDEO_WALLPAPERS.map((w) => { const on = (prefs.bg ? (prefs.bg.kind === "video" ? prefs.bg.id : "") : videoDefault) === w.id; return <Pressable key={w.id} onPress={() => update({ bg: { kind: "video", id: w.id }, tone: "auto" })} style={{ width: 72, height: 108, borderRadius: 12, overflow: "hidden", borderWidth: 2, borderColor: on ? "#14805f" : "transparent" }}><ImageBackground source={{ uri: w.url }} style={{ flex: 1, justifyContent: "flex-end" }}><Text style={{ color: "#fff", fontSize: 10, padding: 4, backgroundColor: "rgba(0,0,0,0.45)" }} numberOfLines={1}>▶ {isAr ? w.title.ar : w.title.en}</Text></ImageBackground></Pressable>; })}
                </ScrollView>
                <Text style={{ fontSize: 11, color: "#55625b" }}>{t.nature}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {NATURE_WALLPAPERS.map((w) => { const on = prefs.bg?.kind === "nature" && prefs.bg.id === w.id; return <Pressable key={w.id} onPress={() => update({ bg: { kind: "nature", id: w.id }, tone: "auto" })}><Image source={{ uri: w.url?.replace("w=1920", "w=320") }} style={{ width: 64, height: 100, borderRadius: 12, borderWidth: 2, borderColor: on ? "#14805f" : "transparent" }} /></Pressable>; })}
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
                <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  <Opt label={t.auto} on={prefs.color === null} onPress={() => update({ color: null, tone: "auto" })} />
                  {STORY_TEXT_COLORS.map((c) => <Pressable key={c.id} accessibilityRole="radio" accessibilityLabel={c.id} onPress={() => update({ color: c.hex, tone: "auto" })} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: c.hex, borderWidth: 3, borderColor: prefs.color === c.hex ? "#14805f" : "rgba(0,0,0,0.12)" }} />)}
                </View>
              </View>
              <View style={{ gap: 8 }}>
                <Text style={{ fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: "#55625b" }}>{t.voice}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {reciters.map((r) => <Opt key={r.id} label={isAr ? r.arabicName : r.latinName} on={(prefs.reciter ?? reciters[0]?.id) === r.id} onPress={() => { update({ reciter: r.id }); if (ayah) void playAyah(ayah.verseKey, r.id); }} />)}
                </ScrollView>
                <View style={{ flexDirection: "row", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
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

export default function StoryScreenGated() {
  return <PlusGate feature="story"><StoryScreen /></PlusGate>;
}
