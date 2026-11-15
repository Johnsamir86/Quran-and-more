import { Stack } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, Text, Vibration, View } from "react-native";

import { ADHKAR_CATEGORIES, adhkarFor, adhkarProgress, emptyAdhkarDay, suggestedAdhkar, type AdhkarCategory, type AdhkarDayState } from "@qam/core";

import { useI18n } from "@/lib/i18n";
import { useStored } from "@/lib/stored";
import { Arabic, Body, Button, Card, Chip, Kicker, Muted, Pill, Progress, Row, Screen, todayIso, usePalette } from "@/lib/ui";

/** Adhkar from Hisn al-Muslim with a per-dhikr counter that resets daily. */
export default function AdhkarScreen() {
  const c = usePalette();
  const { m, locale, num } = useI18n();
  const t = m.worship.adhkar;
  const [cat, setCat] = useState<AdhkarCategory>(() => suggestedAdhkar(new Date().getHours()));
  const [day, setDay] = useStored<AdhkarDayState>("qam.adhkar.v1", () => emptyAdhkarDay(todayIso()));
  const state = day.day === todayIso() ? day : emptyAdhkarDay(todayIso());
  const list = useMemo(() => adhkarFor(cat), [cat]);
  const progress = adhkarProgress(cat, state);
  const [showTr, setShowTr] = useState(false);
  const showEnglish = locale !== "ar";
  const refOf = (d: { ref: string; refAr: string }) => (locale === "ar" ? d.refAr || d.ref : d.ref);
  const virtueOf = (d: { virtue: string; virtueAr: string }) => (locale === "ar" ? d.virtueAr || d.virtue : d.virtue);
  const tap = (id: string, max: number) => setDay((prev) => {
    const cur = prev.day === todayIso() ? prev : emptyAdhkarDay(todayIso());
    const n = Math.min(max, (cur.counts[id] ?? 0) + 1);
    Vibration.vibrate(n === max ? 40 : 10);
    return { ...cur, counts: { ...cur.counts, [id]: n } };
  });
  const reset = () => setDay((prev) => { const cur = { ...emptyAdhkarDay(todayIso()), counts: { ...prev.counts } }; for (const d of list) delete cur.counts[d.id]; return cur; });
  return (
    <Screen>
      <Stack.Screen options={{ title: t.title }} />
      <Row>{ADHKAR_CATEGORIES.map((k) => <Chip key={k} label={t[k]} active={k === cat} onPress={() => setCat(k)} />)}</Row>
      <Card>
        <Row style={{ justifyContent: "space-between" }}>
          <Pill>{num(progress.done)} / {num(progress.total)} {t.completed}</Pill>
          <Row>
            {showEnglish ? <Button ghost label={showTr ? t.translation : t.transliteration} onPress={() => setShowTr((v) => !v)} /> : null}
            <Button ghost label={t.reset} onPress={reset} />
          </Row>
        </Row>
        <Progress value={progress.total ? progress.done / progress.total : 0} />
        <Muted>{progress.done === progress.total && progress.total > 0 ? t.allDone : t.tapToCount}</Muted>
      </Card>
      {list.map((d) => {
        const n = state.counts[d.id] ?? 0; const done = n >= d.count;
        return (
          <Pressable key={d.id} accessibilityRole="button" onPress={() => tap(d.id, d.count)}>
            <Card style={done ? { borderColor: c.accent, backgroundColor: c.accentSoft } : undefined}>
              <Row style={{ justifyContent: "space-between" }}>
                <Kicker>{d.count > 1 ? `${num(d.count)} ${t.times}` : t.once}{refOf(d) ? ` · ${refOf(d)}` : ""}</Kicker>
                <View style={{ minWidth: 52, height: 44, paddingHorizontal: 10, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: done ? c.ok : c.accent }}>
                  <Text style={{ color: c.onAccent, fontWeight: "700" }}>{done ? "✓" : `${num(n)}/${num(d.count)}`}</Text>
                </View>
              </Row>
              <Arabic size={22}>{d.ar}</Arabic>
              {showEnglish ? <Body style={{ fontSize: 14, lineHeight: 21 }}>{showTr && d.tr ? d.tr : d.en}</Body> : null}
              {virtueOf(d) ? <Muted>{t.virtue}: {virtueOf(d)}</Muted> : null}
            </Card>
          </Pressable>
        );
      })}
      <Muted>{t.about}</Muted>
    </Screen>
  );
}
