import { Stack } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { View } from "react-native";

import { GAME_LABELS, bestScores, scoreAnswer, type GameKind, type GameRound } from "@qam/core";

import { useFamily } from "@/lib/family";
import { fetchRound } from "@/lib/study-api";
import { Arabic, Body, Button, Card, Chip, H1, H2, Kicker, Loading, Muted, Option, Pill, Progress, Row, Screen, StudyNav, isAr, locale, num, usePalette } from "@/lib/ui";

const KINDS: GameKind[] = ["guess-surah", "next-ayah", "missing-word", "which-juz"];
const T = isAr
  ? { title: "العب", pick: "اختر لعبة", scope: "النطاق", juz30: "جزء عمّ", short: "سور قصيرة", all: "كل القرآن", start: "ابدأ", loading: "جارٍ تجهيز الجولة…", score: "النقاط", time: "الوقت", correct: "صحيح", wrong: "خطأ. الإجابة:", next: "التالي", done: "انتهت الجولة", again: "جولة أخرى", best: "أفضل النتائج", of: "من", leaderboard: "لوحة العائلة", noProfile: "اختر ملفًا لحفظ نتائجك" }
  : { title: "Play", pick: "Choose a game", scope: "Scope", juz30: "Juz Amma", short: "Short surahs", all: "Whole Quran", start: "Start", loading: "Preparing the round…", score: "Score", time: "Time", correct: "Correct", wrong: "Wrong. The answer:", next: "Next", done: "Round over", again: "Play again", best: "Best scores", of: "of", leaderboard: "Family board", noProfile: "Choose a profile to save your scores" };

export default function PlayScreen() {
  const c = usePalette();
  const family = useFamily();
  const [kind, setKind] = useState<GameKind>("guess-surah");
  const [scope, setScope] = useState<"juz30" | "short" | "all">("juz30");
  const [round, setRound] = useState<GameRound | null>(null);
  const [loading, setLoading] = useState(false);
  const [i, setI] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [left, setLeft] = useState(0);
  const [finished, setFinished] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimer = () => { if (timer.current) { clearInterval(timer.current); timer.current = null; } };
  const startTimer = (seconds: number) => { stopTimer(); setLeft(seconds); timer.current = setInterval(() => setLeft((l) => (l <= 1 ? (stopTimer(), 0) : l - 1)), 1000); };
  useEffect(() => () => stopTimer(), []);

  const start = async () => {
    setLoading(true); setRound(null); setFinished(false); setI(0); setChosen(null); setScore(0); setCorrect(0);
    try { const r = await fetchRound(kind, scope, locale); setRound(r.round); startTimer(r.round.secondsPerQuestion); } catch { /* keep picker */ } finally { setLoading(false); }
  };
  const q = round?.questions[i];
  const answer = (idx: number) => {
    if (!q || chosen !== null) return;
    stopTimer(); setChosen(idx);
    const ok = idx === q.answer;
    if (ok) setCorrect((n) => n + 1);
    setScore((s) => s + scoreAnswer(ok, left, round!.secondsPerQuestion));
  };
  useEffect(() => { if (q && chosen === null && left === 0 && timer.current === null && round) { /* timed out */ setChosen(-1); } }, [left, q, chosen, round]);
  const next = () => {
    if (!round) return;
    if (i + 1 >= round.questions.length) { setFinished(true); stopTimer(); if (family.profile) family.dispatch({ type: "game/score", kind, score, correct, total: round.questions.length }); return; }
    setI((n) => n + 1); setChosen(null); startTimer(round.secondsPerQuestion);
  };
  const best = bestScores(family.state, kind).slice(0, 5);
  const label = GAME_LABELS[kind];

  return (
    <Screen>
      <Stack.Screen options={{ title: T.title }} />
      <StudyNav current="play" />
      <Card>
        <Kicker>Quran Arena-style</Kicker>
        <H1>{T.title}</H1>
        {!family.profile ? <Muted>{T.noProfile}</Muted> : null}
      </Card>

      {!round && !loading ? (
        <Card>
          <Kicker>{T.pick}</Kicker>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {KINDS.map((k) => (
              <View key={k} style={{ width: "47%", flexGrow: 1 }}>
                <Option label={`${GAME_LABELS[k].icon} ${isAr ? GAME_LABELS[k].ar : GAME_LABELS[k].en}\n${isAr ? GAME_LABELS[k].arSub : GAME_LABELS[k].enSub}`} state={k === kind ? "selected" : "idle"} onPress={() => setKind(k)} />
              </View>
            ))}
          </View>
          <Kicker>{T.scope}</Kicker>
          <Row>{(["juz30", "short", "all"] as const).map((s) => <Chip key={s} label={T[s]} active={scope === s} onPress={() => setScope(s)} />)}</Row>
          <Button label={`▶ ${T.start}`} onPress={start} />
          {best.length ? (<><Kicker>{T.best} · {isAr ? label.ar : label.en}</Kicker>{best.map((s) => <Muted key={s.id}>{family.state.profiles.find((p) => p.id === s.profileId)?.displayName ?? "?"} · {num(s.score)} · {num(s.correct)}/{num(s.total)}</Muted>)}</>) : null}
        </Card>
      ) : null}
      {loading ? <Loading label={T.loading} /> : null}

      {round && q && !finished ? (
        <Card>
          <Row style={{ justifyContent: "space-between" }}>
            <Kicker>{label.icon} {isAr ? label.ar : label.en} · {num(i + 1)} / {num(round.questions.length)}</Kicker>
            <Row><Pill>⭐ {num(score)}</Pill><Pill>⏱ {num(left)}</Pill></Row>
          </Row>
          <Progress value={left / round.secondsPerQuestion} />
          <Arabic size={26} center>{q.kind === "missing-word" && q.display ? q.display : q.prompt}</Arabic>
          {q.kind === "next-ayah" ? <Muted style={{ textAlign: "center" }}>{isAr ? "ما الآية التالية؟" : "Which ayah comes next?"}</Muted> : null}
          <Row>{q.options.map((o, idx) => (
            <Option key={idx} arabic={q.kind !== "which-juz" && (q.kind !== "guess-surah" || isAr)} label={o} disabled={chosen !== null} state={chosen === null ? "idle" : idx === q.answer ? "ok" : chosen === idx ? "bad" : "idle"} onPress={() => answer(idx)} />
          ))}</Row>
          {chosen !== null ? (
            <View style={{ backgroundColor: chosen === q.answer ? "rgba(29,158,117,0.1)" : "rgba(185,28,28,0.08)", borderRadius: 14, padding: 12, gap: 8 }}>
              <H2>{chosen === q.answer ? `✅ ${T.correct}` : `❌ ${T.wrong} ${q.options[q.answer]}`}</H2>
              <Body style={{ color: c.muted }}>{q.verseKey}</Body>
              <Button label={T.next} onPress={next} />
            </View>
          ) : null}
        </Card>
      ) : null}

      {finished && round ? (
        <Card style={{ alignItems: "center" }}>
          <H1>🏆</H1>
          <H2>{T.done}</H2>
          <Body>{T.score}: {num(score)} · {num(correct)} {T.of} {num(round.questions.length)}</Body>
          <Row style={{ justifyContent: "center" }}><Button label={T.again} onPress={start} /><Button label={T.pick} ghost onPress={() => setRound(null)} /></Row>
        </Card>
      ) : null}
    </Screen>
  );
}
