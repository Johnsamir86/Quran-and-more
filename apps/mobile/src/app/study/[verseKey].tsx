import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAudioPlayer } from "expo-audio";
import { Link, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, Share, View } from "react-native";

import { useFamily } from "@/lib/family";
import { fetchStudy, fetchTafsirText, type StudyBundle } from "@/lib/study-api";
import { Arabic, Body, Card, Chip, ErrorBox, H2, Kicker, Loading, Muted, Pill, Row, Screen, StudyNav, isAr, locale, num, usePalette } from "@/lib/ui";

const T = isAr
  ? { words: "كلمة بكلمة", translations: "الترجمات", tafsir: "التفسير", info: "عن السورة", hadith: "أحاديث متعلقة", reflections: "تدبّرات", unavailable: "متاح بعد تفعيل حساب الإنتاج", empty: "لا يوجد", prev: "السابقة", next: "التالية", listen: "استمع", share: "مشاركة", bookmark: "علامة", bookmarked: "محفوظة", juz: "جزء", page: "صفحة", hizb: "حزب", sajdah: "سجدة", occurrences: "ابحث عن الكلمة", pick: "اختر تفسيرًا" }
  : { words: "Word by word", translations: "Translations", tafsir: "Tafsir", info: "About the surah", hadith: "Related hadith", reflections: "Reflections", unavailable: "available once the production account is enabled", empty: "none", prev: "Previous", next: "Next", listen: "Listen", share: "Share", bookmark: "Bookmark", bookmarked: "Saved", juz: "Juz", page: "Page", hizb: "Hizb", sajdah: "Sajdah", occurrences: "Find this word", pick: "Choose a tafsir" };
const TAFSIR_KEY = "qam.study.tafsir";

export default function StudyScreen() {
  const { verseKey } = useLocalSearchParams<{ verseKey: string }>();
  const c = usePalette();
  const family = useFamily();
  const [bundle, setBundle] = useState<StudyBundle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tafsirId, setTafsirId] = useState<number | null>(null);
  const [tafsir, setTafsir] = useState<{ name: string; text: string } | null | "loading">(null);
  const [selectedWord, setSelectedWord] = useState<number | null>(null);
  const player = useAudioPlayer(null);

  useEffect(() => { AsyncStorage.getItem(TAFSIR_KEY).then((v) => { if (v) setTafsirId(Number(v)); }).catch(() => undefined); }, []);
  useEffect(() => {
    if (!verseKey) return;
    setBundle(null); setError(null); setSelectedWord(null);
    fetchStudy(verseKey, locale).then(setBundle).catch((e: Error) => setError(e.message));
  }, [verseKey]);
  const activeTafsir = tafsirId ?? bundle?.defaultTafsirs[0] ?? null;
  useEffect(() => {
    if (!bundle || !activeTafsir) return;
    setTafsir("loading");
    fetchTafsirText(activeTafsir, bundle.verseKey).then((t) => setTafsir(t)).catch(() => setTafsir(null));
  }, [bundle, activeTafsir]);

  const play = (url: string | null) => { if (!url) return; player.replace({ uri: url }); player.play(); };
  const bookmarked = !!family.profile && !!bundle && family.state.bookmarks?.some((b) => b.profileId === family.profile?.id && b.verseKey === bundle.verseKey);

  if (error) return <Screen><ErrorBox message={error} /></Screen>;
  if (!bundle) return <Screen><Loading /></Screen>;
  const title = `${isAr ? bundle.chapter.arabicName : bundle.chapter.latinName} · ${num(bundle.verse)}`;
  return (
    <Screen>
      <Stack.Screen options={{ title }} />
      <StudyNav current="study" />
      <Card>
        <Row style={{ justifyContent: "space-between" }}>
          <Pill>{bundle.verseKey}</Pill>
          <Row>{bundle.juz ? <Muted>{T.juz} {num(bundle.juz)}</Muted> : null}{bundle.page ? <Muted>· {T.page} {num(bundle.page)}</Muted> : null}{bundle.sajdah ? <Pill>{T.sajdah}</Pill> : null}</Row>
        </Row>
        <Arabic size={30} center>{bundle.text}</Arabic>
        <Row style={{ justifyContent: "center" }}>
          <Link href={{ pathname: "/player", params: { surah: String(bundle.chapter.number), ayah: String(bundle.verse) } } as never} asChild><Chip label={`▶ ${T.listen}`} /></Link>
          <Chip label={`↗ ${T.share}`} onPress={() => Share.share({ message: `${bundle.text}\n\n${bundle.translations[0]?.text ?? ""}\n\nhttps://quran-and-more.netlify.app/v/${bundle.verseKey}` }).catch(() => undefined)} />
          {family.profile ? <Chip label={bookmarked ? `★ ${T.bookmarked}` : `☆ ${T.bookmark}`} active={bookmarked} onPress={() => family.dispatch({ type: "bookmark/toggle", verseKey: bundle.verseKey })} /> : null}
        </Row>
        <Row style={{ justifyContent: "space-between" }}>
          {bundle.prev ? <Link href={{ pathname: "/study/[verseKey]", params: { verseKey: bundle.prev } } as never} asChild><Chip label={`‹ ${T.prev}`} /></Link> : <View />}
          {bundle.next ? <Link href={{ pathname: "/study/[verseKey]", params: { verseKey: bundle.next } } as never} asChild><Chip label={`${T.next} ›`} /></Link> : <View />}
        </Row>
      </Card>

      <Card>
        <Kicker>{T.words}</Kicker>
        <View style={{ flexDirection: "row-reverse", flexWrap: "wrap", gap: 8 }}>
          {bundle.words.map((w) => (
            <Pressable key={w.position} onPress={() => { setSelectedWord(w.position); play(w.audioUrl); }} style={{ borderWidth: 1, borderColor: selectedWord === w.position ? c.accent : c.line, borderRadius: 12, padding: 8, alignItems: "center", minWidth: 64 }}>
              <Arabic size={22} center>{w.text}</Arabic>
              {w.translation ? <Muted style={{ textAlign: "center", fontSize: 11, maxWidth: 110 }}>{w.translation}</Muted> : null}
              {w.transliteration && !isAr ? <Muted style={{ textAlign: "center", fontSize: 10, fontStyle: "italic" }}>{w.transliteration}</Muted> : null}
            </Pressable>
          ))}
        </View>
        {selectedWord !== null ? (
          <Link href={{ pathname: "/search", params: { q: bundle.words.find((w) => w.position === selectedWord)?.text ?? "" } } as never} asChild><Chip label={`🔎 ${T.occurrences}`} /></Link>
        ) : null}
      </Card>

      {bundle.translations.length ? (
        <Card>
          <Kicker>{T.translations}</Kicker>
          {bundle.translations.map((t) => (<View key={t.id} style={{ gap: 2 }}><Muted>{t.name}</Muted><Body>{t.text.replace(/<[^>]+>/g, "")}</Body></View>))}
        </Card>
      ) : null}

      <Card>
        <Kicker>{T.tafsir}</Kicker>
        <Row>{bundle.tafsirs.filter((t) => t.language === (isAr ? "arabic" : "english") || bundle.defaultTafsirs.includes(t.id)).slice(0, 8).map((t) => (
          <Chip key={t.id} label={t.name} active={t.id === activeTafsir} onPress={() => { setTafsirId(t.id); AsyncStorage.setItem(TAFSIR_KEY, String(t.id)).catch(() => undefined); }} />
        ))}</Row>
        {tafsir === "loading" ? <Loading /> : tafsir ? (<><H2>{tafsir.name}</H2><Body style={{ writingDirection: /[؀-ۿ]/.test(tafsir.text) ? "rtl" : "ltr", textAlign: /[؀-ۿ]/.test(tafsir.text) ? "right" : "left" }}>{tafsir.text.replace(/<[^>]+>/g, "").trim()}</Body></>) : <Muted>{T.pick}</Muted>}
      </Card>

      {bundle.chapterInfo ? (<Card><Kicker>{T.info}</Kicker><Body>{bundle.chapterInfo.shortText.replace(/<[^>]+>/g, "").trim()}</Body>{bundle.chapterInfo.source ? <Muted>{bundle.chapterInfo.source}</Muted> : null}</Card>) : null}

      <Card>
        <Kicker>{T.hadith}</Kicker>
        {bundle.availability.hadith === "unavailable" ? <Muted>{T.unavailable}</Muted> : bundle.hadith?.length ? bundle.hadith.map((h, i) => (<View key={i} style={{ gap: 2 }}><Muted>{h.collection}{h.number ? ` · ${h.number}` : ""}{h.grade ? ` · ${h.grade}` : ""}</Muted><Body>{h.text}</Body></View>)) : <Muted>{T.empty}</Muted>}
      </Card>
      <Card>
        <Kicker>{T.reflections}</Kicker>
        {bundle.availability.reflections === "unavailable" ? <Muted>{T.unavailable}</Muted> : bundle.reflections?.length ? bundle.reflections.map((r) => (<View key={r.id} style={{ gap: 2 }}><Muted>{r.author}{r.verified ? " ✓" : ""} · ♥ {num(r.likes)}</Muted><Body>{r.body}</Body></View>)) : <Muted>{T.empty}</Muted>}
      </Card>
    </Screen>
  );
}
