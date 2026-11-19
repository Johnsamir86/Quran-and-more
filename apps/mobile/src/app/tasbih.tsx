import { Stack } from "expo-router";
import { useState } from "react";
import { Pressable, Switch, Text, TextInput, Vibration, View } from "react-native";

import { AFTER_PRAYER_SEQUENCE, TASBIH_PRESETS, TASBIH_STORAGE_KEY, tasbihTap, type TasbihState } from "@qam/core";

import { useI18n } from "@/lib/i18n";
import { PlusGate } from "@/lib/plus";
import { useStored } from "@/lib/stored";
import { Arabic, Body, Button, Card, Chip, Kicker, Muted, Row, Screen, usePalette } from "@/lib/ui";

/** Digital tasbih: presets, rounds, vibration, optional 33/33/34 after-prayer sequence. */
function TasbihScreen() {
  const c = usePalette();
  const { m, locale, num } = useI18n();
  const t = m.worship.tasbih;
  const [s, setS] = useStored<TasbihState>(TASBIH_STORAGE_KEY, () => ({ presetId: "subhanallah", count: 0, rounds: 0, total: 0, updatedAt: 0 }));
  const [vibrate, setVibrate] = useStored<boolean>("qam.tasbih.vibrate", () => true);
  const [sequence, setSequence] = useStored<boolean>("qam.tasbih.sequence", () => false);
  const [custom, setCustom] = useStored<number>("qam.tasbih.custom", () => 100);
  const [flash, setFlash] = useState(false);
  const preset = TASBIH_PRESETS.find((p) => p.id === s.presetId) ?? TASBIH_PRESETS[0];
  const target = s.presetId === "custom" ? custom : preset.target;
  const tap = () => setS((prev) => {
    const next = tasbihTap(prev, target);
    const rolled = next.rounds > prev.rounds;
    if (vibrate) Vibration.vibrate(rolled ? [0, 40, 60, 40] : 12);
    if (rolled) {
      setFlash(true); setTimeout(() => setFlash(false), 600);
      if (sequence) { const i = AFTER_PRAYER_SEQUENCE.indexOf(prev.presetId as (typeof AFTER_PRAYER_SEQUENCE)[number]); if (i >= 0 && i < AFTER_PRAYER_SEQUENCE.length - 1) return { ...next, presetId: AFTER_PRAYER_SEQUENCE[i + 1] }; }
    }
    return next;
  });
  const choose = (id: string) => setS((prev) => ({ ...prev, presetId: id, count: 0 }));
  return (
    <Screen>
      <Stack.Screen options={{ title: t.title }} />
      <Row>
        {TASBIH_PRESETS.map((p) => <Chip key={p.id} label={p.tr} active={p.id === s.presetId} onPress={() => choose(p.id)} />)}
        <Chip label={t.custom} active={s.presetId === "custom"} onPress={() => choose("custom")} />
      </Row>
      <Card>
        {s.presetId === "custom" ? (
          <Row><Body>{t.target}</Body><TextInput keyboardType="number-pad" returnKeyType="done" value={String(custom)} onChangeText={(v) => setCustom(Math.max(1, Number(v.replace(/\D/g, "")) || 1))} style={{ borderWidth: 1, borderColor: c.line, borderRadius: 10, padding: 8, minWidth: 80, color: c.ink }} /></Row>
        ) : (
          <View style={{ gap: 4 }}>
            <Arabic size={24} center>{preset.ar}</Arabic>
            {locale !== "ar" ? <Muted style={{ textAlign: "center" }}>{preset.tr} · {preset.en}</Muted> : null}
          </View>
        )}
        <Pressable accessibilityRole="button" accessibilityLabel={t.tap} onPress={tap} style={({ pressed }) => ({ alignSelf: "center", width: 260, height: 260, borderRadius: 130, borderWidth: 10, borderColor: flash ? c.ok : c.accentSoft, backgroundColor: c.accent, alignItems: "center", justifyContent: "center", transform: [{ scale: pressed ? 0.97 : 1 }] })}>
          <Text style={{ color: c.onAccent, fontSize: 64, fontWeight: "800", fontVariant: ["tabular-nums"] }}>{num(s.count)}</Text>
          <Text style={{ color: c.onAccent, opacity: 0.85 }}>/ {num(target)}</Text>
          <Text style={{ color: c.onAccent, opacity: 0.8, fontSize: 12, marginTop: 6 }}>{t.tap}</Text>
        </Pressable>
        <Row style={{ justifyContent: "center", gap: 28 }}>
          <View style={{ alignItems: "center" }}><Kicker>{t.rounds}</Kicker><Text style={{ color: c.ink, fontSize: 26, fontWeight: "800" }}>{num(s.rounds)}</Text></View>
          <View style={{ alignItems: "center" }}><Kicker>{t.total}</Kicker><Text style={{ color: c.ink, fontSize: 26, fontWeight: "800" }}>{num(s.total)}</Text></View>
        </Row>
        <Row style={{ justifyContent: "space-between" }}><Body>{t.vibrate}</Body><Switch value={vibrate} onValueChange={setVibrate} /></Row>
        <Row style={{ justifyContent: "space-between" }}><Body style={{ flex: 1 }}>{t.afterPrayer}</Body><Switch value={sequence} onValueChange={(v) => { setSequence(v); if (v) choose("subhanallah"); }} /></Row>
        <Row><Button ghost label={t.reset} onPress={() => setS((prev) => ({ ...prev, count: 0, rounds: 0, total: 0, updatedAt: Date.now() }))} /></Row>
      </Card>
    </Screen>
  );
}

export default function TasbihScreenGated() {
  return <PlusGate feature="worship"><TasbihScreen /></PlusGate>;
}
