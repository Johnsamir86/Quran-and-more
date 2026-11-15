import { Stack } from "expo-router";
import { useMemo, useState } from "react";
import { TextInput, View } from "react-native";

import { DIVINE_NAMES, nameOfDay } from "@qam/core";

import { useI18n } from "@/lib/i18n";
import { PlusGate } from "@/lib/plus";
import { Arabic, Body, Card, Kicker, Muted, Screen, usePalette } from "@/lib/ui";

/** The 99 names with a name of the day and search. */
function NamesScreen() {
  const c = usePalette();
  const { m, locale, num } = useI18n();
  const t = m.worship.names;
  const [q, setQ] = useState("");
  const today = useMemo(() => nameOfDay(new Date()), []);
  const ar = locale === "ar";
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return DIVINE_NAMES;
    return DIVINE_NAMES.filter((n) => n.ar.includes(s) || n.tr.toLowerCase().includes(s) || n.en.toLowerCase().includes(s) || n.arMeaning.includes(s) || String(n.n) === s);
  }, [q]);
  return (
    <Screen>
      <Stack.Screen options={{ title: t.title }} />
      <Card>
        <Kicker>{t.today}</Kicker>
        <Arabic size={34} center>{today.ar}</Arabic>
        <Body style={{ textAlign: "center" }}><Body style={{ fontWeight: "700" }}>{today.tr}</Body> · {ar ? today.arMeaning : today.en}</Body>
        <TextInput value={q} onChangeText={setQ} placeholder={t.search} placeholderTextColor={c.muted} style={{ borderWidth: 1, borderColor: c.line, borderRadius: 12, padding: 10, color: c.ink }} />
      </Card>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        {list.map((n) => (
          <Card key={n.n} style={{ width: "48%", flexGrow: 1, alignItems: "center", gap: 4 }}>
            <Kicker>{num(n.n)}</Kicker>
            <Arabic size={22} center>{n.ar}</Arabic>
            <Body style={{ fontWeight: "700", textAlign: "center" }}>{n.tr}</Body>
            <Muted style={{ textAlign: "center" }}>{ar ? n.arMeaning : n.en}</Muted>
          </Card>
        ))}
      </View>
      <Muted>{t.about}</Muted>
    </Screen>
  );
}

export default function NamesScreenGated() {
  return <PlusGate feature="names"><NamesScreen /></PlusGate>;
}
