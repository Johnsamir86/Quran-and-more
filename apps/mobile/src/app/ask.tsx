import { Link, Stack } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, TextInput, View } from "react-native";

import { ask, fetchAyahOfDay, type AskResult, type AyahOfDay } from "@/lib/study-api";
import { useI18n } from "@/lib/i18n";
import { Arabic, Body, Button, Card, Chip, ErrorBox, H1, H2, Kicker, Loading, Muted, Pill, Row, Screen, StudyNav, usePalette } from "@/lib/ui";


export default function AskScreen() {
  const c = usePalette();
  const { m, locale } = useI18n();
  const T = { ...m.ask, hint: m.ask.placeholder, send: m.ask.ask };
  const [q, setQ] = useState("");
  const [history, setHistory] = useState<AskResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [today, setToday] = useState<AyahOfDay | null>(null);
  useEffect(() => { fetchAyahOfDay(locale).then(setToday).catch(() => undefined); }, [locale]);

  const send = async (text = q) => {
    const question = text.trim(); if (question.length < 3) return;
    setLoading(true); setError(null); setQ("");
    try { const r = await ask(question, locale); setHistory((h) => [r, ...h]); } catch (e) { setError((e as Error).message); } finally { setLoading(false); }
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: T.title }} />
      <StudyNav current="ask" />
      {today ? (
        <Link href={{ pathname: "/study/[verseKey]", params: { verseKey: today.verseKey } } as never} asChild>
          <Pressable><Card><Kicker>{T.today} · {today.verseKey}</Kicker><Arabic size={24}>{today.text}</Arabic>{today.translation ? <Muted>{today.translation.replace(/<[^>]+>/g, "")}</Muted> : null}</Card></Pressable>
        </Link>
      ) : null}
      <Card>
        <Kicker>Quran.ai / Tazkiya-style · {T.pending}</Kicker>
        <H1>{T.title}</H1>
        <TextInput value={q} onChangeText={setQ} placeholder={T.hint} placeholderTextColor={c.muted} multiline onSubmitEditing={() => send()} style={{ borderWidth: 1, borderColor: c.line, borderRadius: 14, padding: 12, color: c.ink, backgroundColor: c.card, fontSize: 16, minHeight: 60 }} />
        <Row style={{ justifyContent: "space-between" }}>
          <Row>{T.examples.map((e) => <Chip key={e} label={e} onPress={() => send(e)} />)}</Row>
          <Button label={T.send} onPress={() => send()} disabled={loading || q.trim().length < 3} />
        </Row>
      </Card>
      {loading ? <Loading /> : null}
      {error ? <ErrorBox message={error} /> : null}
      {history.map((r, idx) => (
        <View key={idx} style={{ gap: 10 }}>
          <View style={{ alignSelf: "flex-end", backgroundColor: c.accent, borderRadius: 16, padding: 12, maxWidth: "85%" }}><Body style={{ color: "#fff" }}>{r.question}</Body></View>
          <Card>
            <Row style={{ justifyContent: "space-between" }}><Pill>{r.mode === "model" ? T.model : T.retrieval}</Pill><Muted>⚠ {T.pending}</Muted></Row>
            {r.answer ? <Body>{r.answer}</Body> : null}
            <Kicker>{T.sources}</Kicker>
            {r.sources.map((s) => (
              <View key={s.verseKey} style={{ borderLeftWidth: 3, borderLeftColor: c.accent, paddingLeft: 10, gap: 4 }}>
                <Row style={{ justifyContent: "space-between" }}><Pill>{s.verseKey}</Pill><Link href={{ pathname: "/study/[verseKey]", params: { verseKey: s.verseKey } } as never} asChild><Pressable><Muted>{T.open} ›</Muted></Pressable></Link></Row>
                <Arabic size={22}>{s.text}</Arabic>
                {s.translation ? <Muted>{s.translation.replace(/<[^>]+>/g, "")}</Muted> : null}
                {s.tafsir ? (<><H2>{s.tafsir.name}</H2><Muted>{s.tafsir.text.replace(/<[^>]+>/g, "").slice(0, 400)}…</Muted></>) : null}
              </View>
            ))}
            <Muted>{r.disclaimer}</Muted>
          </Card>
        </View>
      ))}
    </Screen>
  );
}
