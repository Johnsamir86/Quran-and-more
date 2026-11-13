import { Link } from "expo-router";
import { useState, type ReactNode } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View, useColorScheme, type PressableProps, type StyleProp, type TextStyle, type ViewStyle } from "react-native";

import { LOCALES, hasUiDictionary } from "@qam/core";

import { useI18n } from "@/lib/i18n";

/** Shared look for the study screens (search, study, learn, play, hifz, ask) — mirrors apps/web study.module.css. */
export { useI18n };
export const todayIso = () => new Date().toISOString().slice(0, 10);

export interface Palette { bg: string; card: string; ink: string; muted: string; line: string; accent: string; ok: string; bad: string; warn: string }
export const usePalette = (): Palette => {
  const dark = useColorScheme() === "dark";
  return dark
    ? { bg: "#0d1512", card: "#13201b", ink: "#e9efea", muted: "#9fb0a7", line: "rgba(233,239,234,0.12)", accent: "#1d9e75", ok: "#1d9e75", bad: "#ef4444", warn: "#d69e2e" }
    : { bg: "#f6f3ea", card: "#fffdf7", ink: "#15201b", muted: "#5d6a63", line: "rgba(21,32,27,0.1)", accent: "#1d9e75", ok: "#1d9e75", bad: "#b91c1c", warn: "#b7791f" };
};

/** System Arabic font (Noto Naskh on Android, Geeza on iOS); the Mushaf screen loads QCF fonts separately. */
export const ARABIC_FONT = {} as const;

export function Screen({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  const c = usePalette();
  if (!scroll) return <View style={[styles.screen, { backgroundColor: c.bg }]}>{children}</View>;
  return <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={styles.screenContent} keyboardShouldPersistTaps="handled">{children}</ScrollView>;
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const c = usePalette();
  return <View style={[styles.card, { backgroundColor: c.card, borderColor: c.line }, style]}>{children}</View>;
}

export function Kicker({ children }: { children: ReactNode }) { const c = usePalette(); return <Text style={[styles.kicker, { color: c.muted }]}>{children}</Text>; }
export function H1({ children }: { children: ReactNode }) { const c = usePalette(); return <Text style={[styles.h1, { color: c.ink }]}>{children}</Text>; }
export function H2({ children }: { children: ReactNode }) { const c = usePalette(); return <Text style={[styles.h2, { color: c.ink }]}>{children}</Text>; }
export function Muted({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) { const c = usePalette(); return <Text style={[styles.muted, { color: c.muted }, style]}>{children}</Text>; }
export function Body({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) { const c = usePalette(); return <Text style={[styles.body, { color: c.ink }, style]}>{children}</Text>; }
export function Arabic({ children, size = 26, center = false, style }: { children: ReactNode; size?: number; center?: boolean; style?: StyleProp<TextStyle> }) {
  const c = usePalette();
  return <Text style={[styles.arabic, { color: c.ink, fontSize: size, lineHeight: size * 1.9, textAlign: center ? "center" : "right" }, style]}>{children}</Text>;
}

export function Row({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) { return <View style={[styles.row, style]}>{children}</View>; }

export function Pill({ children }: { children: ReactNode }) {
  const c = usePalette();
  return <View style={[styles.pill, { backgroundColor: "rgba(29,158,117,0.12)" }]}><Text style={{ color: c.accent, fontWeight: "600", fontSize: 12 }}>{children}</Text></View>;
}

export function Chip({ label, active, onPress, ...rest }: { label: string; active?: boolean } & Omit<PressableProps, "style" | "children">) {
  const c = usePalette();
  return (
    <Pressable accessibilityRole="button" {...rest} onPress={onPress} style={[styles.chip, { borderColor: active ? c.accent : c.line, backgroundColor: active ? c.accent : c.card }]}>
      <Text style={{ color: active ? "#fff" : c.ink, fontSize: 13 }}>{label}</Text>
    </Pressable>
  );
}

export function Button({ label, onPress, ghost, disabled, style }: { label: string; onPress: () => void; ghost?: boolean; disabled?: boolean; style?: StyleProp<ViewStyle> }) {
  const c = usePalette();
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" style={[styles.btn, { borderColor: ghost ? c.line : c.accent, backgroundColor: ghost ? "transparent" : c.accent, opacity: disabled ? 0.5 : 1 }, style]}>
      <Text style={{ color: ghost ? c.ink : "#fff", fontWeight: "600" }}>{label}</Text>
    </Pressable>
  );
}

/** Answer option: neutral → selected → correct / wrong after checking. */
export function Option({ label, state, onPress, arabic, disabled }: { label: string; state: "idle" | "selected" | "ok" | "bad"; onPress: () => void; arabic?: boolean; disabled?: boolean }) {
  const c = usePalette();
  const border = state === "ok" ? c.ok : state === "bad" ? c.bad : state === "selected" ? c.accent : c.line;
  const bg = state === "ok" ? "rgba(29,158,117,0.15)" : state === "bad" ? "rgba(185,28,28,0.12)" : state === "selected" ? "rgba(29,158,117,0.08)" : c.card;
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" style={[styles.option, { borderColor: border, backgroundColor: bg }]}>
      <Text style={[{ color: c.ink, textAlign: "center", fontSize: arabic ? 22 : 15, lineHeight: arabic ? 36 : 20 }, arabic ? ARABIC_FONT : null]}>{label}</Text>
    </Pressable>
  );
}

export function Progress({ value }: { value: number }) {
  const c = usePalette();
  return <View style={[styles.progress, { backgroundColor: c.line }]}><View style={{ width: `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%`, height: "100%", backgroundColor: c.accent }} /></View>;
}

export function Loading({ label }: { label?: string }) {
  return <View style={styles.center}><ActivityIndicator size="large" />{label ? <Muted>{label}</Muted> : null}</View>;
}

export function ErrorBox({ message }: { message: string }) { const c = usePalette(); return <Card><Text style={{ color: c.bad }}>{message}</Text></Card>; }

/** Study-section navigation chips shown at the top of every study screen. */
export function StudyNav({ current }: { current: "search" | "study" | "learn" | "play" | "hifz" | "ask" | "player" | "azan" | "story" }) {
  const { m } = useI18n();
  const items: { key: typeof current; href: string; icon: string }[] = [
    { key: "player", href: "/player", icon: "▶" },
    { key: "search", href: "/search", icon: "🔎" },
    { key: "learn", href: "/learn", icon: "🎓" },
    { key: "play", href: "/play", icon: "🎮" },
    { key: "hifz", href: "/hifz", icon: "🧠" },
    { key: "ask", href: "/ask", icon: "💬" },
    { key: "azan", href: "/azan", icon: "🕌" },
  ];
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingBottom: 4 }}>
      {items.map((it) => (
        <Link key={it.key} href={it.href as never} asChild>
          <Chip label={`${it.icon} ${m.nav[it.key === "study" ? "search" : it.key]}`} active={it.key === current} />
        </Link>
      ))}
      <LanguagePicker compact />
    </ScrollView>
  );
}

/** Interface-language picker: a chip with the current language that opens the full list (66 languages; those without their own UI text show "EN"). */
export function LanguagePicker({ compact }: { compact?: boolean }) {
  const { locale, m, setLocale } = useI18n();
  const c = usePalette();
  const [open, setOpen] = useState(false);
  const current = LOCALES.find((l) => l.code === locale);
  return (
    <>
      <Chip label={`🌐 ${compact ? (current?.code.toUpperCase() ?? "EN") : (current?.nativeName ?? "English")}`} onPress={() => setOpen(true)} accessibilityLabel={m.common.uiLanguage} />
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", padding: 20 }} onPress={() => setOpen(false)}>
          <View style={{ backgroundColor: c.card, borderRadius: 18, maxHeight: "80%", padding: 12, gap: 8 }} onStartShouldSetResponder={() => true}>
            <H2>{m.common.chooseLanguage}</H2>
            <ScrollView contentContainerStyle={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
              {LOCALES.map((l) => <Chip key={l.code} label={`${l.nativeName}${hasUiDictionary(l.code) ? "" : " · EN"}`} active={l.code === locale} onPress={() => { setLocale(l.code); setOpen(false); }} />)}
            </ScrollView>
            <Button label={m.common.close} ghost onPress={() => setOpen(false)} />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  screenContent: { padding: 14, gap: 14, paddingBottom: 60 },
  card: { borderWidth: 1, borderRadius: 18, padding: 16, gap: 10 },
  kicker: { fontSize: 11, letterSpacing: 1, textTransform: "uppercase" },
  h1: { fontSize: 22, fontWeight: "700" },
  h2: { fontSize: 16, fontWeight: "600" },
  muted: { fontSize: 13, lineHeight: 19 },
  body: { fontSize: 15, lineHeight: 23 },
  arabic: { writingDirection: "rtl" },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center" },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  btn: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 18, paddingVertical: 11, alignItems: "center" },
  option: { borderWidth: 1, borderRadius: 14, padding: 12, minWidth: "46%", flexGrow: 1 },
  progress: { height: 8, borderRadius: 4, overflow: "hidden" },
  center: { padding: 32, alignItems: "center", gap: 10 },
});
