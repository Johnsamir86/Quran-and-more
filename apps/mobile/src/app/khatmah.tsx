import { Link, Stack } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { KHATMAH_PRESETS, KHATMAH_STORAGE_KEY, MUSHAF_PAGES, daysToRamadan, isoDay, juzOfPage, khatmahStatus, pagesPerDay, type KhatmahPlan } from "@qam/core";

import { useFamily } from "@/lib/family";
import { useI18n } from "@/lib/i18n";
import { useStored } from "@/lib/stored";
import { Body, Button, Card, Chip, Kicker, Muted, Pill, Progress, Row, Screen, usePalette } from "@/lib/ui";

interface Stored { plan: KhatmahPlan | null; readPage: number }

/** Khatmah planner: 604 pages over N days, today's portion, progress from the mushaf or manual. */
export default function KhatmahScreen() {
  const c = usePalette();
  const { m, num } = useI18n();
  const t = m.worship.khatmah;
  const { state, profile, dispatch } = useFamily();
  const [st, setSt] = useStored<Stored>(KHATMAH_STORAGE_KEY, () => ({ plan: null, readPage: 0 }));
  const [days, setDays] = useState(30);
  const [startPage, setStartPage] = useState(1);
  const today = isoDay(new Date());
  const ramadanIn = daysToRamadan(new Date());
  const mushafPage = profile ? state.progress[profile.id]?.lastPage ?? 0 : 0;
  const readPage = Math.max(st.readPage, st.plan && mushafPage >= st.plan.startPage ? mushafPage : 0);
  const status = useMemo(() => (st.plan ? khatmahStatus(st.plan, readPage, today) : null), [st.plan, readPage, today]);
  const start = (d: number) => setSt({ plan: { startDay: today, days: Math.max(1, d), startPage: Math.min(MUSHAF_PAGES, Math.max(1, startPage)), createdAt: Date.now() }, readPage: Math.max(0, startPage - 1) });
  const mark = (page: number) => {
    const p = Math.max(0, Math.min(MUSHAF_PAGES, page));
    setSt((prev) => ({ ...prev, readPage: p }));
    if (profile && p > 0) dispatch({ type: "progress/record", page: p, seconds: 0, day: today });
  };
  const input = { borderWidth: 1, borderColor: c.line, borderRadius: 10, padding: 8, minWidth: 72, color: c.ink, textAlign: "center" as const };
  const plan = st.plan;
  return (
    <Screen>
      <Stack.Screen options={{ title: t.title }} />
      {!plan || !status ? (
        <Card>
          <Kicker>{t.plan}</Kicker>
          <Muted>{t.noPlan}</Muted>
          <Row>
            {KHATMAH_PRESETS.map((d) => <Chip key={d} label={`${num(d)} ${t.days}`} active={d === days} onPress={() => setDays(d)} />)}
            {ramadanIn > 1 ? <Chip label={`🌙 ${t.beforeRamadan} (${num(ramadanIn)})`} active={days === ramadanIn} onPress={() => setDays(ramadanIn)} /> : null}
          </Row>
          <Row style={{ justifyContent: "space-between" }}><Body>{t.custom}</Body><TextInput keyboardType="number-pad" returnKeyType="done" value={String(days)} onChangeText={(v) => setDays(Math.max(1, Number(v.replace(/\D/g, "")) || 1))} style={input} /></Row>
          <Row style={{ justifyContent: "space-between" }}><Body>{t.startPage}</Body><TextInput keyboardType="number-pad" returnKeyType="done" value={String(startPage)} onChangeText={(v) => setStartPage(Math.max(1, Math.min(MUSHAF_PAGES, Number(v.replace(/\D/g, "")) || 1)))} style={input} /></Row>
          <Body>≈ <Text style={{ fontWeight: "700" }}>{num(Math.ceil((MUSHAF_PAGES - startPage + 1) / days))}</Text> {t.pagesPerDay}</Body>
          <Row><Button label={t.start} onPress={() => start(days)} /></Row>
        </Card>
      ) : (
        <>
          <Card>
            <Row style={{ justifyContent: "space-between" }}>
              <Kicker>{t.day} {num(status.dayIndex + 1)} {t.of} {num(plan.days)} · {num(status.daysLeft)} {t.daysLeft}</Kicker>
              <Pill>{num(status.percent)}% {t.percent}</Pill>
            </Row>
            <Progress value={status.percent / 100} />
            {status.finished ? <Body style={{ fontWeight: "700" }}>{t.finished}</Body> : (
              <>
                <Kicker>{t.today}</Kicker>
                <Text style={{ color: c.ink, fontSize: 36, fontWeight: "800" }}>{num(status.todayFrom)} – {num(status.todayTo)}</Text>
                <Muted>{t.pages} · {t.juz} {num(juzOfPage(status.todayFrom))}{juzOfPage(status.todayTo) !== juzOfPage(status.todayFrom) ? `–${num(juzOfPage(status.todayTo))}` : ""} · ≈ {num(Math.ceil(pagesPerDay(plan)))} {t.pagesPerDay} · {num(MUSHAF_PAGES - status.readPage)} {t.pagesLeft}</Muted>
                <Body style={{ color: status.behindPages > 0 ? c.warn : c.accent }}>{status.behindPages > 0 ? `⚠ ${num(status.behindPages)} ${t.behind}` : `✓ ${t.onTrack}`}</Body>
                <Row>
                  <Link href={{ pathname: "/mushaf", params: { page: String(status.todayFrom) } } as never} asChild><Pressable accessibilityRole="button" style={{ paddingVertical: 10, paddingHorizontal: 18, borderRadius: 999, backgroundColor: c.accent }}><Text style={{ color: c.onAccent, fontWeight: "600" }}>📖 {t.openMushaf}</Text></Pressable></Link>
                  <Button ghost label={`✓ ${t.markRead}`} onPress={() => mark(status.todayTo)} />
                </Row>
              </>
            )}
          </Card>
          <Card>
            <Kicker>{t.lastRead}</Kicker>
            <Row style={{ justifyContent: "space-between" }}>
              <TextInput keyboardType="number-pad" returnKeyType="done" value={String(status.readPage)} onChangeText={(v) => mark(Number(v.replace(/\D/g, "")) || 0)} style={input} />
              <Muted>{t.page} · {t.juz} {num(juzOfPage(Math.max(1, status.readPage)))}{mushafPage > st.readPage ? ` · ${t.fromProgress}` : ""}</Muted>
            </Row>
            <Row><Button ghost label={t.restart} onPress={() => setSt({ plan: null, readPage: 0 })} /></Row>
          </Card>
        </>
      )}
      <View><Muted>{num(MUSHAF_PAGES)} {t.pages} · 30 {t.juz}</Muted></View>
    </Screen>
  );
}
