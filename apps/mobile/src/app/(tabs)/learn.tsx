import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { Pressable, View } from "react-native";

import { bestScores, learnFor, levelForXp } from "@qam/core";

import { useFamily } from "@/lib/family";
import { useI18n } from "@/lib/i18n";
import { Body, Card, H2, Kicker, Muted, Pill, Row, Screen, usePalette } from "@/lib/ui";

type IconName = keyof typeof Ionicons.glyphMap;

/** Learn hub: lessons, memorisation, games, study and ask, with the profile's XP and streak. */
export default function LearnHub() {
  const c = usePalette();
  const { m } = useI18n();
  const { state, profile } = useFamily();
  const learn = profile ? learnFor(state, profile.id) : null;
  const level = learn ? levelForXp(learn.xp) : null;
  const best = profile ? bestScores(state).filter((s) => s.profileId === profile.id).slice(0, 3) : [];
  const items: { href: string; icon: IconName; title: string; sub: string }[] = [
    { href: "/lessons", icon: "school-outline", title: m.home.tiles.learn.title, sub: m.home.tiles.learn.sub },
    { href: "/hifz", icon: "repeat-outline", title: m.home.tiles.hifz.title, sub: m.home.tiles.hifz.sub },
    { href: "/play", icon: "game-controller-outline", title: m.home.tiles.play.title, sub: m.home.tiles.play.sub },
    { href: "/study/1:1", icon: "layers-outline", title: m.home.tiles.study.title, sub: m.home.tiles.study.sub },
    { href: "/ask", icon: "chatbubble-ellipses-outline", title: m.home.tiles.ask.title, sub: m.home.tiles.ask.sub },
    { href: "/search", icon: "search-outline", title: m.home.tiles.search.title, sub: m.home.tiles.search.sub },
  ];
  return (
    <Screen>
      {learn && level ? (
        <Card>
          <Row style={{ justifyContent: "space-between" }}>
            <View><Kicker>{m.learn.level} {level.level}</Kicker><H2>{learn.xp} {m.learn.xp}</H2></View>
            <View style={{ alignItems: "flex-end" }}><Kicker>{m.learn.streak}</Kicker><H2>{learn.streak}</H2></View>
          </Row>
          <Muted>{m.learn.lessonsDone}: {learn.lessonsDone.length}</Muted>
          {best.length ? <Row>{best.map((b) => <Pill key={b.id}>{m.play.games[b.kind as keyof typeof m.play.games]?.title ?? b.kind} · {b.score}</Pill>)}</Row> : null}
        </Card>
      ) : <Card><Muted>{m.learn.noProfile}</Muted></Card>}
      <View style={{ gap: 10 }}>
        {items.map((it) => (
          <Link key={it.href} href={it.href as never} asChild>
            <Pressable accessibilityRole="button" style={({ pressed }) => ({ flexDirection: "row", gap: 14, alignItems: "center", padding: 14, borderRadius: c.radius.md, backgroundColor: pressed ? c.surface : c.card, borderWidth: 1, borderColor: c.line })}>
              <View style={{ width: 44, height: 44, borderRadius: c.radius.sm, alignItems: "center", justifyContent: "center", backgroundColor: c.accentSoft }}><Ionicons name={it.icon} size={22} color={c.accent} /></View>
              <View style={{ flex: 1 }}><Body style={{ fontWeight: "700" }}>{it.title}</Body><Muted>{it.sub}</Muted></View>
              <Ionicons name="chevron-forward" size={18} color={c.muted} />
            </Pressable>
          </Link>
        ))}
      </View>
    </Screen>
  );
}
