import { Link, Stack } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, useColorScheme } from "react-native";

import { AVATARS, bookmarksFor, notesFor, type AgeBand, type Gender, type ProfileRole } from "@qam/core";

import { useFamily } from "@/lib/family";
import { useI18n } from "@/lib/i18n";
import { LanguagePicker } from "@/lib/ui";

export default function FamilyScreen() {
  const { state, dispatch, profile } = useFamily();
  const { m, locale } = useI18n();
  const T = m.family;
  const dark = useColorScheme() === "dark";
  const c = dark ? { bg: "#0d1512", card: "#13201b", ink: "#e9efea", muted: "#9fb0a7", line: "rgba(233,239,234,0.12)", accent: "#1d9e75" } : { bg: "#f6f3ea", card: "#fffdf7", ink: "#15201b", muted: "#5d6a63", line: "rgba(21,32,27,0.1)", accent: "#1d9e75" };
  const [form, setForm] = useState<null | { id?: string; displayName: string; role: ProfileRole; gender: Gender; ageBand: AgeBand; avatar: string }>(null);
  const prog = profile ? state.progress[profile.id] : undefined;
  const today = new Date().toISOString().slice(0, 10);
  const chip = (on: boolean) => [st.chip, { borderColor: on ? c.accent : c.line, backgroundColor: on ? c.accent : "transparent" }];
  const chipText = (on: boolean) => ({ color: on ? "#fff" : c.ink, fontSize: 13 });
  const save = () => {
    if (!form || !form.displayName.trim()) return;
    if (form.id) dispatch({ type: "profile/update", id: form.id, patch: { displayName: form.displayName, role: form.role, gender: form.gender, ageBand: form.ageBand, avatar: form.avatar } });
    else dispatch({ type: "profile/add", input: { displayName: form.displayName, role: form.role, gender: form.gender, ageBand: form.ageBand, locale, avatar: form.avatar } });
    setForm(null);
  };
  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 60 }}>
      <Stack.Screen options={{ title: T.title }} />
      <Text style={{ color: c.muted }}>{T.sub}</Text>
      <View style={st.wrap}><LanguagePicker /></View>
      <View style={st.grid}>
        {state.profiles.map((p) => (
          <Pressable key={p.id} onPress={() => dispatch({ type: "profile/select", id: p.id })} onLongPress={() => setForm({ id: p.id, displayName: p.displayName, role: p.role, gender: p.gender, ageBand: p.ageBand, avatar: (p as { avatar?: string }).avatar ?? AVATARS[0] })} style={[st.card, { backgroundColor: c.card, borderColor: p.id === state.activeProfileId ? c.accent : c.line, borderWidth: p.id === state.activeProfileId ? 2 : 1 }]}>
            <Text style={{ fontSize: 34 }}>{(p as { avatar?: string }).avatar ?? "🌙"}</Text>
            <Text style={{ color: c.ink, fontWeight: "700" }}>{p.displayName}</Text>
            <Text style={{ color: c.muted, fontSize: 11 }}>{T.roles[p.role]} · {p.ageBand}</Text>
          </Pressable>
        ))}
        <Pressable onPress={() => setForm({ displayName: "", role: state.profiles.length ? "child" : "parent", gender: "unspecified", ageBand: state.profiles.length ? "7-12" : "18-59", avatar: AVATARS[state.profiles.length % AVATARS.length] })} style={[st.card, { borderColor: c.line, borderStyle: "dashed" }]}>
          <Text style={{ fontSize: 34, color: c.muted }}>＋</Text><Text style={{ color: c.muted }}>{T.add}</Text>
        </Pressable>
      </View>

      {form ? (
        <View style={[st.form, { backgroundColor: c.card, borderColor: c.line }]}>
          <TextInput value={form.displayName} onChangeText={(v) => setForm({ ...form, displayName: v })} placeholder={T.name} placeholderTextColor={c.muted} style={[st.input, { color: c.ink, borderColor: c.line }]} autoFocus />
          <View style={st.wrap}>{(Object.keys(T.roles) as ProfileRole[]).map((r) => <Pressable key={r} onPress={() => setForm({ ...form, role: r })} style={chip(form.role === r)}><Text style={chipText(form.role === r)}>{T.roles[r]}</Text></Pressable>)}</View>
          <View style={st.wrap}>{(Object.keys(T.genders) as Gender[]).map((g) => <Pressable key={g} onPress={() => setForm({ ...form, gender: g })} style={chip(form.gender === g)}><Text style={chipText(form.gender === g)}>{T.genders[g]}</Text></Pressable>)}</View>
          <View style={st.wrap}>{(Object.keys(T.ages) as AgeBand[]).map((a) => <Pressable key={a} onPress={() => setForm({ ...form, ageBand: a })} style={chip(form.ageBand === a)}><Text style={chipText(form.ageBand === a)}>{a}</Text></Pressable>)}</View>
          <View style={st.wrap}>{AVATARS.map((a) => <Pressable key={a} onPress={() => setForm({ ...form, avatar: a })} style={[st.avatarBtn, { borderColor: form.avatar === a ? c.accent : c.line }]}><Text style={{ fontSize: 20 }}>{a}</Text></Pressable>)}</View>
          <View style={[st.wrap, { justifyContent: "flex-end" }]}>
            {form.id ? <Pressable onPress={() => { dispatch({ type: "profile/remove", id: form.id! }); setForm(null); }} style={chip(false)}><Text style={{ color: "#b91c1c" }}>{T.remove}</Text></Pressable> : null}
            <Pressable onPress={() => setForm(null)} style={chip(false)}><Text style={chipText(false)}>{T.cancel}</Text></Pressable>
            <Pressable onPress={save} style={chip(true)}><Text style={chipText(true)}>{T.save}</Text></Pressable>
          </View>
        </View>
      ) : null}

      {profile && !form ? (
        <>
          <View style={st.wrap}>
            {[[prog?.streak ?? 0, T.streak], [Math.round((prog?.days[today] ?? 0) / 60), T.minutes], [bookmarksFor(state, profile.id).length, T.bookmarks], [notesFor(state, profile.id).length, T.notes]].map(([n, l]) => (
              <View key={String(l)} style={[st.stat, { backgroundColor: c.card, borderColor: c.line }]}><Text style={{ color: c.ink, fontSize: 22, fontWeight: "700" }}>{String(n)}</Text><Text style={{ color: c.muted, fontSize: 11 }}>{String(l)}</Text></View>
            ))}
          </View>
          {prog?.lastVerseKey ? <Link href={{ pathname: "/player", params: { surah: prog.lastVerseKey.split(":")[0], ayah: prog.lastVerseKey.split(":")[1] } }} asChild><Pressable style={chip(true)}><Text style={chipText(true)}>▶ {T.continue} · {prog.lastVerseKey}</Text></Pressable></Link> : null}
          <Text style={{ color: c.ink, fontWeight: "700", fontSize: 16 }}>{T.bookmarks}</Text>
          {bookmarksFor(state, profile.id).length ? bookmarksFor(state, profile.id).map((b) => (
            <View key={b.id} style={[st.item, { backgroundColor: c.card, borderColor: c.line }]}>
              <Text style={{ color: c.accent, fontWeight: "700" }}>🔖 {b.verseKey}</Text>
              <View style={st.wrap}>
                <Link href={{ pathname: "/player", params: { surah: b.verseKey.split(":")[0], ayah: b.verseKey.split(":")[1] } }} asChild><Pressable style={chip(false)}><Text style={chipText(false)}>{T.open}</Text></Pressable></Link>
                <Pressable onPress={() => dispatch({ type: "bookmark/remove", id: b.id })} style={chip(false)}><Text style={{ color: "#b91c1c" }}>✕</Text></Pressable>
              </View>
            </View>
          )) : <Text style={{ color: c.muted }}>{T.none}</Text>}
          <Text style={{ color: c.ink, fontWeight: "700", fontSize: 16 }}>{T.notes}</Text>
          {notesFor(state, profile.id).length ? notesFor(state, profile.id).map((n) => (
            <View key={n.id} style={[st.item, { backgroundColor: c.card, borderColor: c.line, flexDirection: "column", alignItems: "flex-start" }]}>
              <Text style={{ color: c.accent, fontWeight: "700" }}>{n.verseKey}</Text>
              <Text style={{ color: c.ink }}>{n.body}</Text>
              <Pressable onPress={() => dispatch({ type: "note/remove", id: n.id })} style={chip(false)}><Text style={{ color: "#b91c1c", fontSize: 12 }}>{T.remove}</Text></Pressable>
            </View>
          )) : <Text style={{ color: c.muted }}>{T.none}</Text>}
        </>
      ) : null}
    </ScrollView>
  );
}

const st = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  card: { width: "30%", minWidth: 100, borderWidth: 1, borderRadius: 16, padding: 12, alignItems: "center", gap: 4 },
  form: { borderWidth: 1, borderRadius: 16, padding: 14, gap: 10 },
  input: { borderWidth: 1, borderRadius: 12, padding: 10, fontSize: 16 },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 6, alignItems: "center" },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  avatarBtn: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  stat: { borderWidth: 1, borderRadius: 12, padding: 10, minWidth: 78, alignItems: "center" },
  item: { borderWidth: 1, borderRadius: 12, padding: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
});
