import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { asrForCountry, formatCountdown, formatPrayerTime, methodForCountry, prayerSchedule, resolveCalc, type AzanSettings } from "@qam/core";

import { loadAzanSettings } from "@/lib/azan";
import { useFamily } from "@/lib/family";
import { useI18n } from "@/lib/i18n";
import { fetchAyahOfDay, type AyahOfDay } from "@/lib/study-api";
import { Arabic, Body, Card, H1, H2, Kicker, Muted, Pill, Row, Screen, usePalette } from "@/lib/ui";

type IconName = keyof typeof Ionicons.glyphMap;

/** Home = today: greeting, ayah of the day, next prayer, continue, quick actions. */
export default function HomeScreen() {
  const c = usePalette();
  const { m, locale, isAr } = useI18n();
  const { profile, state } = useFamily();
  const [ayah, setAyah] = useState<AyahOfDay | null>(null);
  const [azan, setAzan] = useState<AzanSettings | null>(null);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { fetchAyahOfDay(locale).then(setAyah).catch(() => undefined); loadAzanSettings().then(setAzan).catch(() => undefined); }, [locale]);
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 30_000); return () => clearInterval(id); }, []);
  const next = useMemo(() => (azan ? prayerSchedule(now, azan.timeZone, resolveCalc(azan, methodForCountry, asrForCountry)).next : null), [azan, now]);
  const hour = now.getHours();
  const greeting = hour < 12 ? m.story.goodMorning : m.story.goodEvening;
  const prog = profile ? state.progress[profile.id] : undefined;
  const last = prog && (prog.lastVerseKey || prog.lastPage) ? prog : null;
  const todayKey = now.toISOString().slice(0, 10);

  const tiles: { href: string; icon: IconName; label: string }[] = [
    { href: "/player", icon: "play-circle-outline", label: m.nav.player },
    { href: "/mushaf", icon: "book-outline", label: m.nav.mushaf },
    { href: "/search", icon: "search-outline", label: m.nav.search },
    { href: "/lessons", icon: "school-outline", label: m.learn.title },
    { href: "/hifz", icon: "repeat-outline", label: m.nav.hifz },
    { href: "/play", icon: "game-controller-outline", label: m.nav.play },
    { href: "/ask", icon: "chatbubble-ellipses-outline", label: m.nav.ask },
    { href: "/family", icon: "people-outline", label: m.nav.family },
  ];

  return (
    <Screen>
      <View style={{ gap: 2 }}>
        <Kicker>{greeting}</Kicker>
        <H1>{profile ? `${profile.avatar ?? ""} ${profile.displayName}`.trim() : m.common.appName}</H1>
      </View>

      {ayah ? (
        <Link href={{ pathname: "/story" } as never} asChild>
          <Pressable accessibilityRole="button">
            <Card>
              <Row style={{ justifyContent: "space-between" }}><Kicker>{m.story.title} · {ayah.verseKey}</Kicker><Ionicons name="sparkles-outline" size={18} color={c.accent2} /></Row>
              <Arabic size={24}>{ayah.text}</Arabic>
              {ayah.translation ? <Muted>{ayah.translation.replace(/<[^>]+>/g, "")}</Muted> : null}
            </Card>
          </Pressable>
        </Link>
      ) : null}

      <Row>
        <Link href="/azan" asChild>
          <Pressable style={{ flex: 1, minWidth: "46%" }} accessibilityRole="button">
            <Card style={{ backgroundColor: c.accent, borderColor: c.accent }}>
              <Row style={{ justifyContent: "space-between" }}><Text style={{ color: c.onAccent, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", opacity: 0.9 }}>{m.azan.nextPrayer}</Text><Ionicons name="moon-outline" size={16} color={c.onAccent} /></Row>
              {next && azan ? <>
                <Text style={{ color: c.onAccent, fontSize: 20, fontWeight: "700" }}>{m.azan.prayers[next.name]} · {formatPrayerTime(next.at, azan.timeZone, locale)}</Text>
                <Text style={{ color: c.onAccent, opacity: 0.9 }}>{m.azan.inTime} {formatCountdown(next.at.getTime() - now.getTime())} · {azan.city}</Text>
              </> : <Text style={{ color: c.onAccent }}>{m.azan.title}</Text>}
            </Card>
          </Pressable>
        </Link>
        {last ? (
          <Link href={last.lastPage ? { pathname: "/mushaf", params: { page: String(last.lastPage) } } as never : { pathname: "/player", params: { surah: last.lastVerseKey?.split(":")[0] ?? "1", ayah: last.lastVerseKey?.split(":")[1] ?? "1" } } as never} asChild>
            <Pressable style={{ flex: 1, minWidth: "46%" }} accessibilityRole="button">
              <Card>
                <Row style={{ justifyContent: "space-between" }}><Kicker>{m.family.continue}</Kicker><Ionicons name="arrow-forward-circle-outline" size={18} color={c.accent} /></Row>
                <H2>{last.lastPage ? `${m.common.page} ${last.lastPage}` : `${m.common.ayah} ${last.lastVerseKey}`}</H2>
                <Muted>{m.family.minutes}: {Math.round((last.days[todayKey] ?? 0) / 60)} · {m.family.streak}: {last.streak}</Muted>
              </Card>
            </Pressable>
          </Link>
        ) : null}
      </Row>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {tiles.map((t) => (
          <Link key={t.href} href={t.href as never} asChild>
            <Pressable accessibilityRole="button" style={{ flexGrow: 1, minWidth: "22%", alignItems: "center", gap: 6, padding: 12, borderRadius: c.radius.md, backgroundColor: c.card, borderWidth: 1, borderColor: c.line }}>
              <Ionicons name={t.icon} size={24} color={c.accent} />
              <Body style={{ fontSize: 12, fontWeight: "600" }}>{t.label}</Body>
            </Pressable>
          </Link>
        ))}
      </View>
      {isAr ? null : <Pill>{m.home.tiles.kahf.title} · {m.home.tiles.kahf.sub}</Pill>}
    </Screen>
  );
}
