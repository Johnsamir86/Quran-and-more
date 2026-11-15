import { Stack } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { daysToRamadan, hijriDate, hijriMonthGrid, toHijri, upcomingEvents, type UpcomingEvent } from "@qam/core";

import { useI18n } from "@/lib/i18n";
import { fmt, useStored } from "@/lib/stored";
import { Body, Button, Card, H1, H2, Kicker, Muted, Pill, Row, Screen, usePalette } from "@/lib/ui";

const monthTitle = (date: Date, locale: string) => { try { return new Intl.DateTimeFormat(`${locale}-u-ca-islamic-umalqura`, { month: "long", year: "numeric" }).format(date); } catch { return ""; } };
const gDay = (d: Date, locale: string) => { try { return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(d); } catch { return ""; } };
const gFull = (d: Date, locale: string) => { try { return new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric", month: "long", year: "numeric" }).format(d); } catch { return d.toDateString(); } };

/** Hijri calendar (Umm al-Qura via Intl) with upcoming dates and a Ramadan countdown. */
export default function CalendarScreen() {
  const c = usePalette();
  const { m, locale, num } = useI18n();
  const t = m.worship.calendar;
  const [adjust, setAdjust] = useStored<number>("qam.hijri.adjust", () => 0);
  const today = useMemo(() => new Date(), []);
  const h = toHijri(today, adjust);
  const [view, setView] = useState({ year: h.year, month: h.month });
  const grid = useMemo(() => hijriMonthGrid(view.year, view.month, adjust), [view, adjust]);
  const events = useMemo(() => upcomingEvents(today, adjust), [today, adjust]);
  const ramadan = daysToRamadan(today, adjust);
  const eventOn = (y: number, mo: number, d: number) => events.find((e) => e.hijri.year === y && e.hijri.month === mo && d >= e.hijri.day && d < e.hijri.day + (e.id === "whiteDays" ? 3 : e.id === "lastTenNights" ? 10 : e.id === "tashriq" ? 3 : 1));
  const when = (e: UpcomingEvent) => (e.inDays === 0 ? t.todayIs : e.inDays === 1 ? t.tomorrow : fmt(t.inDays, { n: num(e.inDays) }));
  const move = (d: number) => setView((v) => { let mo = v.month + d, y = v.year; if (mo < 1) { mo = 12; y -= 1; } if (mo > 12) { mo = 1; y += 1; } return { year: y, month: mo }; });
  return (
    <Screen>
      <Stack.Screen options={{ title: t.title }} />
      <Card>
        <Kicker>{t.today}</Kicker>
        <H1>{hijriDate(new Date(today.getTime() + adjust * 86_400_000), locale)}</H1>
        <Muted>{gFull(today, locale)}</Muted>
        <Pill>{ramadan === 0 ? `🌙 ${t.inRamadan}` : `🌙 ${t.ramadanIn} ${num(ramadan)} ${t.daysToRamadan}`}</Pill>
        <Row style={{ justifyContent: "space-between" }}>
          <Muted>{t.adjust}</Muted>
          <Row>
            <Button ghost label="−" onPress={() => setAdjust((a) => Math.max(-2, a - 1))} />
            <Body style={{ fontWeight: "700", minWidth: 28, textAlign: "center" }}>{adjust > 0 ? `+${num(adjust)}` : num(adjust)}</Body>
            <Button ghost label="+" onPress={() => setAdjust((a) => Math.min(2, a + 1))} />
          </Row>
        </Row>
        <Muted>{t.adjustHelp}</Muted>
      </Card>
      <Card>
        <Row style={{ justifyContent: "space-between" }}>
          <Button ghost label={`‹ ${t.prevMonth}`} onPress={() => move(-1)} />
          <H2>{monthTitle(grid[0]?.date ?? today, locale)}</H2>
          <Button ghost label={`${t.nextMonth} ›`} onPress={() => move(1)} />
        </Row>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          {grid.map((cell) => {
            const isToday = view.year === h.year && view.month === h.month && cell.day === h.day;
            const ev = eventOn(view.year, view.month, cell.day);
            return (
              <View key={cell.day} style={{ width: "13%", minWidth: 40, paddingVertical: 8, borderRadius: 12, borderWidth: 1, alignItems: "center", gap: 2, borderColor: isToday || ev ? c.accent : c.line, backgroundColor: isToday ? c.accentSoft : c.card }}>
                <Text style={{ color: c.ink, fontWeight: isToday ? "700" : "400" }}>{num(cell.day)}</Text>
                <Text style={{ color: c.muted, fontSize: 9 }}>{gDay(cell.date, locale)}</Text>
                {ev ? <Text style={{ fontSize: 10 }}>{ev.id === "eidFitr" || ev.id === "eidAdha" ? "🎉" : ev.fasting ? "🌙" : "•"}</Text> : null}
              </View>
            );
          })}
        </View>
      </Card>
      <Card>
        <Kicker>{t.events}</Kicker>
        {events.map((e) => (
          <Pressable key={`${e.id}-${e.hijri.year}-${e.hijri.month}`} style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.line, gap: 2 }}>
            <Row style={{ justifyContent: "space-between" }}>
              <Body style={{ fontWeight: "700", flex: 1 }}>{t.eventNames[e.id]}</Body>
              <Body style={{ fontWeight: "700" }}>{when(e)}</Body>
            </Row>
            <Row><Muted>{gFull(e.date, locale)}</Muted>{e.fasting ? <Pill>{t.fasting}</Pill> : null}</Row>
            {t.eventNotes[e.id as keyof typeof t.eventNotes] ? <Muted>{t.eventNotes[e.id as keyof typeof t.eventNotes]}</Muted> : null}
          </Pressable>
        ))}
      </Card>
    </Screen>
  );
}
