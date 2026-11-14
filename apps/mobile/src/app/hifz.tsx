import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAudioPlayer } from "expo-audio";
import { Stack } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, View } from "react-native";

import { fetchChapterRows, fetchHifzAyahs, type ChapterRow, type HifzAyah } from "@/lib/study-api";
import { useI18n } from "@/lib/i18n";
import { Arabic, Button, Card, Chip, H1, H2, Kicker, Loading, Muted, Pill, Progress, Row, Screen, StudyNav, todayIso, usePalette } from "@/lib/ui";

/**
 * Memorisation trainer (Tasmi'-style): hide the ayah, recall it, peek, grade
 * yourself; a simple spaced-repetition schedule decides when each ayah comes
 * back. Same card store shape as the web (qam.hifz.v1) so the schedule
 * survives a later sync.
 */
interface CardRec { verseKey: string; due: string; interval: number; ease: number; reps: number }
type Grade = "forgot" | "hard" | "good" | "easy";
const STORE = "qam.hifz.v1";
const INTERVALS: Record<Grade, number> = { forgot: 0, hard: 1, good: 4, easy: 9 };

const addDays = (day: string, n: number) => { const d = new Date(`${day}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

export default function HifzScreen() {
  const c = usePalette();
  const { m, locale, isAr, num } = useI18n();
  const T = { ...m.hifz, note: m.hifz.noProfile };
  const today = todayIso();
  const [surahs, setSurahs] = useState<ChapterRow[]>([]);
  const [surah, setSurah] = useState(112);
  const [from, setFrom] = useState(1);
  const [to, setTo] = useState(4);
  const [ayahs, setAyahs] = useState<HifzAyah[]>([]);
  const [cards, setCards] = useState<Record<string, CardRec>>({});
  const [queue, setQueue] = useState<string[]>([]);
  const [i, setI] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [reps, setReps] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const player = useAudioPlayer(null);

  useEffect(() => {
    AsyncStorage.getItem(STORE).then((raw) => { if (raw) setCards(JSON.parse(raw) as Record<string, CardRec>); }).catch(() => undefined);
    fetchChapterRows(locale).then(setSurahs).catch(() => undefined);
  }, [locale]);
  const verseCount = surahs.find((s) => s.id === surah)?.versesCount ?? 7;
  useEffect(() => { setFrom(1); setTo(Math.min(verseCount, 5)); }, [surah, verseCount]);
  const persist = (next: Record<string, CardRec>) => { setCards(next); AsyncStorage.setItem(STORE, JSON.stringify(next)).catch(() => undefined); };

  const start = async () => {
    setLoading(true);
    try {
      const all = await fetchHifzAyahs(surah, locale);
      const list = all.filter((v) => v.verseNumber >= from && v.verseNumber <= to);
      setAyahs(list);
      const dueFirst = [...list].sort((a, b) => (cards[a.verseKey]?.due ?? "0").localeCompare(cards[b.verseKey]?.due ?? "0"));
      setQueue(dueFirst.map((v) => v.verseKey)); setI(0); setRevealed(false); setReps(0);
    } finally { setLoading(false); }
  };
  const current = useMemo(() => ayahs.find((a) => a.verseKey === queue[i]) ?? null, [ayahs, queue, i]);
  const grade = (g: Grade) => {
    if (!current) return;
    const prev = cards[current.verseKey] ?? { verseKey: current.verseKey, due: today, interval: 0, ease: 2.5, reps: 0 };
    const interval = g === "forgot" ? 0 : Math.max(INTERVALS[g], Math.round(prev.interval * (g === "hard" ? 1.2 : g === "good" ? prev.ease : prev.ease * 1.3)));
    const nextCard: CardRec = { ...prev, interval, due: addDays(today, interval), ease: Math.max(1.3, prev.ease + (g === "easy" ? 0.15 : g === "good" ? 0 : g === "hard" ? -0.15 : -0.3)), reps: prev.reps + 1 };
    persist({ ...cards, [current.verseKey]: nextCard });
    if (g === "forgot") setQueue((q) => [...q, current.verseKey]);
    setI((n) => n + 1); setRevealed(false); setReps(0);
  };
  const play = () => { if (!current?.audioUrl) return; player.replace({ uri: current.audioUrl }); player.play(); setReps((r) => r + 1); };
  const dueCount = Object.values(cards).filter((k) => k.due <= today).length;
  const dueLabel = (k?: CardRec) => (!k ? "" : k.due <= today ? T.today : k.due === addDays(today, 1) ? T.tomorrow : `${num(Math.round((new Date(k.due).getTime() - new Date(today).getTime()) / 86400000))} ${T.days}`);
  const finished = queue.length > 0 && i >= queue.length;
  const surahRow = surahs.find((s) => s.id === surah);

  return (
    <Screen>
      <Stack.Screen options={{ title: T.title }} />
      <StudyNav current="hifz" />
      <Card>
        <Kicker>Tasmi'-style</Kicker>
        <H1>{T.title}</H1>
        <Row><Pill>📚 {num(Object.keys(cards).length)} {T.cards}</Pill><Pill>⏰ {num(dueCount)} {T.due}</Pill></Row>
        <Muted>{T.note}</Muted>
      </Card>

      {!queue.length || finished ? (
        <Card>
          <Kicker>{T.pick}</Kicker>
          <Pressable onPress={() => setPickerOpen((o) => !o)} style={{ borderWidth: 1, borderColor: c.line, borderRadius: 12, padding: 12 }}>
            <Row style={{ justifyContent: "space-between" }}><Arabic size={20}>{surahRow?.nameArabic ?? ""}</Arabic><Muted>{surahRow ? `${surahRow.translatedName || surahRow.nameSimple} · ${num(surahRow.versesCount)}` : "…"} {pickerOpen ? "▴" : "▾"}</Muted></Row>
          </Pressable>
          {pickerOpen ? (
            <View style={{ maxHeight: 260, borderWidth: 1, borderColor: c.line, borderRadius: 12 }}>
              <Row style={{ padding: 8 }}>{surahs.map((s) => <Chip key={s.id} label={`${num(s.id)} ${isAr ? s.nameArabic : s.nameSimple}`} active={s.id === surah} onPress={() => { setSurah(s.id); setPickerOpen(false); }} />)}</Row>
            </View>
          ) : null}
          <Row style={{ justifyContent: "space-between" }}>
            <Row><Muted>{T.from}</Muted><Stepper value={from} min={1} max={to} onChange={setFrom} /></Row>
            <Row><Muted>{T.to}</Muted><Stepper value={to} min={from} max={verseCount} onChange={setTo} /></Row>
          </Row>
          <Button label={finished ? T.again : T.start} onPress={start} disabled={loading} />
          {finished ? <H2>✅ {T.done}</H2> : null}
          {loading ? <Loading label={T.loading} /> : null}
          <Kicker>{T.methods}</Kicker>
          <Muted>• {T.method6446}</Muted>
          <Muted>• {T.method3x3}</Muted>
        </Card>
      ) : null}

      {current && !finished ? (
        <Card>
          <Row style={{ justifyContent: "space-between" }}>
            <Kicker>{current.verseKey} · {num(i + 1)} / {num(queue.length)}</Kicker>
            <Row><Pill>🔁 {num(reps)} {T.reps}</Pill>{cards[current.verseKey] ? <Pill>{T.schedule}: {dueLabel(cards[current.verseKey])}</Pill> : null}</Row>
          </Row>
          <Progress value={i / queue.length} />
          <Pressable onPress={() => setRevealed((r) => !r)} style={{ minHeight: 120, justifyContent: "center" }}>
            {revealed ? <Arabic size={30} center>{current.text}</Arabic> : <View style={{ alignItems: "center", gap: 8 }}><H1>🙈</H1><Muted>{T.reveal}</Muted></View>}
          </Pressable>
          {revealed && current.translation ? <Muted style={{ textAlign: "center" }}>{current.translation.replace(/<[^>]+>/g, "")}</Muted> : null}
          <Row style={{ justifyContent: "center" }}>
            <Button label={revealed ? `🙈 ${T.hide}` : `👁 ${T.reveal}`} ghost onPress={() => setRevealed((r) => !r)} />
            <Button label={`🔊 ${T.listen}`} ghost onPress={play} disabled={!current.audioUrl} />
          </Row>
          <Kicker>{T.grade}</Kicker>
          <Row>
            {(["forgot", "hard", "good", "easy"] as Grade[]).map((g) => (
              <Pressable key={g} onPress={() => grade(g)} style={{ flexGrow: 1, minWidth: "46%", borderWidth: 1, borderColor: c.line, borderRadius: 14, padding: 12, alignItems: "center", gap: 2 }}>
                <H2>{g === "forgot" ? "😵" : g === "hard" ? "😓" : g === "good" ? "🙂" : "😎"} {T[g]}</H2>
                <Muted>{g === "forgot" ? "10 min" : `${num(INTERVALS[g])} ${T.days}`}</Muted>
              </Pressable>
            ))}
          </Row>
        </Card>
      ) : null}
    </Screen>
  );
}

function Stepper({ value, min, max, onChange }: { value: number; min: number; max: number; onChange: (n: number) => void }) {
  const c = usePalette();
  const { num } = useI18n();
  return (
    <Row>
      <Pressable onPress={() => onChange(Math.max(min, value - 1))} style={{ borderWidth: 1, borderColor: c.line, borderRadius: 999, width: 34, height: 34, alignItems: "center", justifyContent: "center" }}><H2>−</H2></Pressable>
      <H2>{num(value)}</H2>
      <Pressable onPress={() => onChange(Math.min(max, value + 1))} style={{ borderWidth: 1, borderColor: c.line, borderRadius: 999, width: 34, height: 34, alignItems: "center", justifyContent: "center" }}><H2>+</H2></Pressable>
    </Row>
  );
}
