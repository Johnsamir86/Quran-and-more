import { Link, Stack } from "expo-router";
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from "expo-speech-recognition";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { ask, type AskResult } from "@/lib/study-api";
import { useI18n } from "@/lib/i18n";
import { Paywall, PlusGate, useUsage } from "@/lib/plus";
import { Arabic, Body, Button, Card, Chip, ErrorBox, H1, H2, Kicker, Loading, Muted, Pill, Row, Screen, StudyNav, usePalette, SourcesBadge } from "@/lib/ui";


function AskScreen() {
  const c = usePalette();
  const { m, locale } = useI18n();
  const T = { ...m.ask, hint: m.ask.placeholder, send: m.ask.ask };
  const [q, setQ] = useState("");
  const [history, setHistory] = useState<AskResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const usage = useUsage();
  const [limitHit, setLimitHit] = useState(false);
  // Voice: dictate the question in the interface language; the recognised text is sent as typed.
  const [listening, setListening] = useState(false);
  useSpeechRecognitionEvent("start", () => setListening(true));
  useSpeechRecognitionEvent("end", () => setListening(false));
  useSpeechRecognitionEvent("error", () => { setListening(false); setError(m.player.voiceUnsupported); });
  useSpeechRecognitionEvent("result", (e) => { if (!e.isFinal) return; const text = e.results[0]?.transcript ?? ""; if (text.trim().length >= 3) { setQ(text); void send(text); } });
  const speak = async () => {
    if (listening) { ExpoSpeechRecognitionModule.stop(); return; }
    try {
      const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!perm.granted) { setError(m.player.voiceUnsupported); return; }
      ExpoSpeechRecognitionModule.start({ lang: locale === "ar" ? "ar-SA" : locale, interimResults: false, maxAlternatives: 1, continuous: false });
    } catch { setError(m.player.voiceUnsupported); }
  };
  const send = async (text = q) => {
    const question = text.trim(); if (question.length < 3) return;
    if (!usage.allowed("ask")) { setLimitHit(true); return; }
    setLoading(true); setError(null); setQ("");
    try { const r = await ask(question, locale); usage.bump("ask"); setHistory((h) => [r, ...h]); } catch (e) { setError((e as Error).message); } finally { setLoading(false); }
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: T.title }} />
      {limitHit ? <><ErrorBox message={m.plus.limitReached} /><Paywall feature="ask" inline /></> : null}
      <StudyNav current="ask" />
      <Card>
        <Row style={{ justifyContent: "space-between" }}><Kicker>Quran.ai / Tazkiya-style · {T.pending}</Kicker><SourcesBadge compact /></Row>
        <H1>{T.title}</H1>
        <TextInput value={q} onChangeText={setQ} placeholder={T.hint} placeholderTextColor={c.muted} multiline onSubmitEditing={() => send()} style={{ borderWidth: 1, borderColor: c.line, borderRadius: 14, padding: 12, color: c.ink, backgroundColor: c.card, fontSize: 16, minHeight: 60 }} />
        <Row style={{ justifyContent: "space-between" }}>
          <Pressable accessibilityRole="button" accessibilityLabel={T.speak} onPress={speak} style={{ width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: listening ? c.bad : c.accentSoft, borderWidth: 1, borderColor: listening ? c.bad : c.accent }}><Text style={{ fontSize: 20 }}>{listening ? "⏹" : "🎙"}</Text></Pressable>
          <Muted style={{ flex: 1, marginHorizontal: 10 }}>{listening ? T.listening : T.speakHint}</Muted>
          <Button label={T.send} onPress={() => send()} disabled={loading || q.trim().length < 3} />
        </Row>
        <Row>{T.examples.map((e) => <Chip key={e} label={e} onPress={() => send(e)} />)}</Row>
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

export default function AskScreenGated() {
  return <PlusGate feature="ask"><AskScreen /></PlusGate>;
}
