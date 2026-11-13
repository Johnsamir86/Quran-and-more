import { useAudioPlayer } from "expo-audio";
import { Link, Stack } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, View } from "react-native";

import { checkOrder, learnFor, levelForXp, type Exercise, type Lesson, type LessonAyah } from "@qam/core";

import { useFamily } from "@/lib/family";
import { fetchChapterRows, fetchLesson, type ChapterRow } from "@/lib/study-api";
import { Arabic, Button, Card, Chip, H1, H2, Kicker, Loading, Muted, Option, Pill, Progress, Row, Screen, StudyNav, isAr, locale, num, todayIso, usePalette } from "@/lib/ui";

const T = isAr
  ? { title: "تعلّم", pick: "اختر سورة لتبدأ", xp: "نقاط", level: "المستوى", streak: "أيام متتالية", check: "تحقق", next: "التالي", correct: "صحيح!", wrong: "ليس صحيحًا. الإجابة:", done: "أحسنت! أكملت الدرس", earned: "حصلت على", again: "درس جديد", meaning: "ما معنى هذه الكلمة؟", word: "أي كلمة تعني:", hidden: "أكمل الآية بالكلمة الناقصة", order: "رتّب كلمات الآية", reset: "إعادة", loading: "جارٍ إعداد الدرس…", noProfile: "اختر ملفًا من صفحة العائلة لحفظ تقدّمك", lessonsDone: "دروس مكتملة", juz30: "جزء عمّ", all: "كل السور", listen: "استمع", skip: "تخطَّ", short: "سور قصيرة", stage: "المرحلة" }
  : { title: "Learn", pick: "Pick a surah to start", xp: "XP", level: "Level", streak: "day streak", check: "Check", next: "Next", correct: "Correct!", wrong: "Not quite. The answer:", done: "Well done! Lesson complete", earned: "You earned", again: "New lesson", meaning: "What does this word mean?", word: "Which word means:", hidden: "Complete the ayah with the missing word", order: "Put the words of the ayah in order", reset: "Reset", loading: "Preparing the lesson…", noProfile: "Choose a profile on the Family page to save your progress", lessonsDone: "lessons done", juz30: "Juz Amma", all: "All surahs", listen: "Listen", skip: "Skip", short: "Short surahs", stage: "Stage" };

export default function LearnScreen() {
  const c = usePalette();
  const family = useFamily();
  const today = todayIso();
  const [surahs, setSurahs] = useState<ChapterRow[]>([]);
  const [filter, setFilter] = useState<"juz30" | "short" | "all">("juz30");
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [ayahs, setAyahs] = useState<LessonAyah[]>([]);
  const [loading, setLoading] = useState(false);
  const [idx, setIdx] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [orderPick, setOrderPick] = useState<number[]>([]);
  const [checked, setChecked] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const player = useAudioPlayer(null);

  useEffect(() => { fetchChapterRows(locale).then(setSurahs).catch(() => undefined); }, []);
  const progress = family.profile ? learnFor(family.state, family.profile.id) : null;
  const lvl = levelForXp(progress?.xp ?? 0);
  const visible = useMemo(() => surahs.filter((s) => (filter === "all" ? true : filter === "juz30" ? s.id >= 78 : s.versesCount <= 30)), [surahs, filter]);

  const startLesson = async (chapterId: number) => {
    setLoading(true); setLesson(null); setFinished(false); setIdx(0); setScore(0); setChosen(null); setChecked(null); setOrderPick([]);
    try { const json = await fetchLesson(chapterId, locale, today); setLesson(json.lesson); setAyahs(json.ayahs); } catch { /* keep picker */ } finally { setLoading(false); }
  };
  const ex: Exercise | undefined = lesson?.exercises[idx];
  const play = (url: string | null) => { if (!url) return; player.replace({ uri: url }); player.play(); };
  const check = () => {
    if (!ex) return;
    const ok = ex.kind === "order" ? checkOrder(ex, orderPick) : chosen === ex.answer;
    setChecked(ok); if (ok) setScore((s) => s + 10);
  };
  const next = () => {
    if (!lesson) return;
    if (idx + 1 >= lesson.exercises.length) { setFinished(true); if (family.profile) family.dispatch({ type: "learn/complete", lessonId: lesson.id, xp: score, day: today }); return; }
    setIdx((i) => i + 1); setChosen(null); setChecked(null); setOrderPick([]);
  };
  const answerText = (e: Exercise): string => (e.kind === "meaning" ? e.options[e.answer] : e.kind === "word" ? e.options[e.answer].arabic : e.kind === "hidden" ? e.options[e.answer] : e.ayah.words.map((w) => w.arabic).join(" "));
  const optState = (i: number, e: Exercise): "idle" | "selected" | "ok" | "bad" => (checked === null ? (chosen === i ? "selected" : "idle") : e.kind !== "order" && i === e.answer ? "ok" : chosen === i ? "bad" : "idle");

  return (
    <Screen>
      <Stack.Screen options={{ title: T.title }} />
      <StudyNav current="learn" />
      <Card>
        <Kicker>Quranlingo-style</Kicker>
        <H1>{T.title}</H1>
        <Row><Pill>⭐ {num(progress?.xp ?? 0)} {T.xp}</Pill><Pill>🏅 {T.level} {num(lvl.level)}</Pill><Pill>🔥 {num(progress?.streak ?? 0)} {T.streak}</Pill><Pill>✅ {num(progress?.lessonsDone.length ?? 0)} {T.lessonsDone}</Pill></Row>
        <Progress value={lvl.progress} />
        {!family.profile ? <Link href="/family" asChild><Pressable><Muted>{T.noProfile}</Muted></Pressable></Link> : null}
      </Card>

      {!lesson && !loading ? (
        <Card>
          <Kicker>{T.pick}</Kicker>
          <Row>{(["juz30", "short", "all"] as const).map((f) => <Chip key={f} label={T[f]} active={filter === f} onPress={() => setFilter(f)} />)}</Row>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {visible.map((s, i) => { const done = progress?.lessonsDone.some((id) => id.startsWith(`${s.id}:`)); return (
              <Pressable key={s.id} onPress={() => startLesson(s.id)} style={{ width: "47%", flexGrow: 1, borderWidth: 1, borderColor: c.line, borderRadius: 16, padding: 12, gap: 4 }}>
                <Row style={{ justifyContent: "space-between" }}><Pill>{T.stage} {num(i + 1)}</Pill>{done ? <Muted>✅</Muted> : null}</Row>
                <Arabic size={22}>{s.nameArabic}</Arabic>
                <Muted>{s.translatedName || s.nameSimple} · {num(s.versesCount)}</Muted>
              </Pressable>
            ); })}
          </View>
        </Card>
      ) : null}
      {loading ? <Loading label={T.loading} /> : null}

      {lesson && ex && !finished ? (
        <Card>
          <Row style={{ justifyContent: "space-between" }}><Kicker>{lesson.title} · {num(idx + 1)} / {num(lesson.exercises.length)}</Kicker><Pill>⭐ {num(score)}</Pill></Row>
          <Progress value={idx / lesson.exercises.length} />

          {ex.kind === "meaning" ? (<>
            <H2>{T.meaning}</H2>
            <Pressable onPress={() => play(ex.prompt.audioUrl)}><Arabic size={34} center>{ex.prompt.arabic}{ex.prompt.audioUrl ? " 🔊" : ""}</Arabic></Pressable>
            {ex.prompt.transliteration ? <Muted style={{ textAlign: "center", fontStyle: "italic" }}>{ex.prompt.transliteration}</Muted> : null}
            <Row>{ex.options.map((o, i) => <Option key={i} label={o} state={optState(i, ex)} disabled={checked !== null} onPress={() => setChosen(i)} />)}</Row>
          </>) : null}

          {ex.kind === "word" ? (<>
            <H2>{T.word} {ex.prompt}</H2>
            <Row>{ex.options.map((o, i) => <Option key={i} arabic label={o.arabic} state={optState(i, ex)} disabled={checked !== null} onPress={() => { setChosen(i); play(o.audioUrl); }} />)}</Row>
          </>) : null}

          {ex.kind === "hidden" ? (<>
            <H2>{T.hidden}</H2>
            <Arabic size={26} center>{ex.ayah.words.map((w) => (w.position === ex.hiddenPosition ? (checked !== null ? `﴿${w.arabic}﴾` : " ____ ") : w.arabic)).join(" ")}</Arabic>
            {ex.ayah.translation ? <Muted style={{ textAlign: "center" }}>{ex.ayah.translation}</Muted> : null}
            <Row>{ex.options.map((o, i) => <Option key={i} arabic label={o} state={optState(i, ex)} disabled={checked !== null} onPress={() => setChosen(i)} />)}</Row>
          </>) : null}

          {ex.kind === "order" ? (<>
            <H2>{T.order}</H2>
            <View style={{ borderWidth: 1, borderStyle: "dashed", borderColor: c.line, borderRadius: 12, padding: 8, minHeight: 60 }}>
              <Arabic size={24} center>{orderPick.map((i) => ex.ayah.words[i].arabic).join(" ")}</Arabic>
            </View>
            <View style={{ flexDirection: "row-reverse", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
              {ex.shuffled.filter((i) => !orderPick.includes(i)).map((i) => (
                <Pressable key={i} disabled={checked !== null} onPress={() => setOrderPick((p) => [...p, i])} style={{ borderWidth: 1, borderColor: c.line, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 }}><Arabic size={22}>{ex.ayah.words[i].arabic}</Arabic></Pressable>
              ))}
            </View>
            <Row><Button label={T.reset} ghost disabled={checked !== null} onPress={() => setOrderPick([])} /><Link href={{ pathname: "/study/[verseKey]", params: { verseKey: ex.ayah.verseKey } } as never} asChild><Chip label={ex.ayah.verseKey} /></Link></Row>
          </>) : null}

          {checked === null ? (
            <Row><Button label={T.check} onPress={check} disabled={ex.kind === "order" ? orderPick.length !== ex.ayah.words.length : chosen === null} /><Button label={T.skip} ghost onPress={next} /></Row>
          ) : (
            <View style={{ backgroundColor: checked ? "rgba(29,158,117,0.1)" : "rgba(185,28,28,0.08)", borderRadius: 14, padding: 12, gap: 8 }}>
              <H2>{checked ? `✅ ${T.correct}` : `❌ ${T.wrong}`}</H2>
              {!checked ? <Arabic size={22} center>{answerText(ex)}</Arabic> : null}
              <Button label={T.next} onPress={next} />
            </View>
          )}
        </Card>
      ) : null}

      {finished && lesson ? (
        <Card style={{ alignItems: "center" }}>
          <H1>🎉</H1>
          <H2>{T.done}: {lesson.title}</H2>
          <Muted>{T.earned} {num(score)} {T.xp} · {num(ayahs.length)} {isAr ? "آيات" : "ayat"}</Muted>
          <Row style={{ justifyContent: "center" }}>
            <Button label={T.again} onPress={() => startLesson(lesson.chapterId)} />
            <Button label={T.pick} ghost onPress={() => setLesson(null)} />
            <Link href={{ pathname: "/player", params: { surah: String(lesson.chapterId) } } as never} asChild><Chip label={`▶ ${T.listen}`} /></Link>
          </Row>
        </Card>
      ) : null}
    </Screen>
  );
}
