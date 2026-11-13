import { Link, Stack } from "expo-router";
import { useAudioPlayer } from "expo-audio";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Switch, TextInput, View } from "react-native";

import { AZAN_PRAYERS, CALC_METHODS, MUEZZINS, PRAYER_NAMES, asrForCountry, formatCountdown, formatPrayerTime, hijriDate, methodForCountry, muezzinById, prayerSchedule, resolveCalc, type AzanSettings, type PrayerName } from "@qam/core";

import { configureNotifications, detectLocation, geocodeCity, hasSavedAzanSettings, loadAzanSettings, requestNotificationPermission, saveAzanSettings, scheduleAzanNotifications, type CityHit } from "@/lib/azan";
import { useI18n } from "@/lib/i18n";
import { Body, Button, Card, Chip, H1, H2, Kicker, Loading, Muted, Pill, Row, Screen, StudyNav, usePalette } from "@/lib/ui";

const ICONS: Record<PrayerName, string> = { fajr: "🌄", sunrise: "🌅", dhuhr: "☀️", asr: "🌤️", maghrib: "🌇", isha: "🌙" };

export default function AzanScreen() {
  const c = usePalette();
  const { m, locale } = useI18n();
  const t = m.azan;
  const [settings, setSettings] = useState<AzanSettings | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<CityHit[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const player = useAudioPlayer(null);
  const [playing, setPlaying] = useState(false);
  const announced = useRef<string | null>(null);

  useEffect(() => {
    (async () => {
      await configureNotifications();
      const s = await loadAzanSettings();
      setSettings(s);
      if (!(await hasSavedAzanSettings())) {
        const loc = await detectLocation().catch(() => null);
        if (loc) { const next = { ...s, ...loc }; setSettings(next); await saveAzanSettings(next); }
      }
    })();
  }, []);
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(id); }, []);

  const update = useCallback((patch: Partial<AzanSettings>) => {
    setSettings((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      void saveAzanSettings(next);
      if (next.notifications) void scheduleAzanNotifications(next, locale);
      return next;
    });
  }, [locale]);

  useEffect(() => {
    if (query.trim().length < 2) { setHits([]); return; }
    const id = setTimeout(() => { geocodeCity(query, locale).then(setHits).catch(() => setHits([])); }, 300);
    return () => clearTimeout(id);
  }, [query, locale]);

  const schedule = useMemo(() => (settings ? prayerSchedule(now, settings.timeZone, resolveCalc(settings, methodForCountry, asrForCountry)) : null), [settings, now]);

  const playAzan = () => {
    if (!settings) return;
    player.replace({ uri: muezzinById(settings.muezzin).url });
    player.play(); setPlaying(true);
  };
  const stopAzan = () => { player.pause(); player.seekTo(0); setPlaying(false); };
  useEffect(() => {
    if (!settings || !schedule?.current || !settings.playInApp) return;
    const cur = schedule.current;
    if (cur.name === "sunrise" || !settings.prayers[cur.name as keyof AzanSettings["prayers"]]) return;
    const key = `${cur.day}-${cur.name}`;
    const age = now.getTime() - cur.at.getTime();
    if (age >= 0 && age < 90_000 && announced.current !== key) { announced.current = key; playAzan(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schedule?.current?.name, schedule?.current?.day]);

  const locate = async () => {
    setBusy(true); setStatus(t.locating);
    try {
      const loc = await detectLocation();
      if (!loc) { setStatus(t.locationDenied); return; }
      update(loc); setStatus(`${t.location}: ${loc.city}`);
    } catch { setStatus(t.locationDenied); } finally { setBusy(false); }
  };

  const toggleNotifications = async () => {
    if (!settings) return;
    if (settings.notifications) { update({ notifications: false }); await scheduleAzanNotifications({ ...settings, notifications: false }, locale); setStatus(t.disabled); return; }
    const ok = await requestNotificationPermission();
    if (!ok) { setStatus(t.denied); return; }
    const n = await scheduleAzanNotifications({ ...settings, notifications: true }, locale);
    update({ notifications: true }); setStatus(`${t.enabled} · ${n}`);
  };

  if (!settings || !schedule) return <Screen><Stack.Screen options={{ title: t.title }} /><StudyNav current="azan" /><Loading label={m.common.loading} /></Screen>;

  const method = settings.method === "auto" ? methodForCountry(settings.countryCode) : settings.method;
  const asr = settings.asr === "auto" ? asrForCountry(settings.countryCode) : settings.asr;
  const fmt = (d: Date) => formatPrayerTime(d, settings.timeZone, locale);
  const next = schedule.next;

  return (
    <Screen>
      <Stack.Screen options={{ title: t.title }} />
      <StudyNav current="azan" />
      <Card style={{ backgroundColor: "#146b57", borderColor: "#146b57" }}>
        <Kicker>{settings.city}{settings.countryCode ? ` · ${settings.countryCode}` : ""} · {hijriDate(now, locale, settings.timeZone)}</Kicker>
        {next ? <Body style={{ color: "#fff" }}>{t.nextPrayer}: {ICONS[next.name]} {t.prayers[next.name]} · {fmt(next.at)}</Body> : null}
        {next ? <H1><Body style={{ color: "#fff", fontSize: 40, lineHeight: 48, fontWeight: "800" }}>{formatCountdown(next.at.getTime() - now.getTime())}</Body></H1> : null}
        <Row>
          <Chip label={playing ? `⏹ ${t.stop}` : `🔊 ${t.preview}`} onPress={playing ? stopAzan : playAzan} />
          <Link href={{ pathname: "/story", params: next ? { prayer: next.name } : {} } as never} asChild><Chip label={`✨ ${t.openStory}`} /></Link>
        </Row>
      </Card>

      <Card>
        <Kicker>{t.todayTimes}</Kicker>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {PRAYER_NAMES.map((p) => {
            const at = schedule.today[p];
            const isNext = next?.name === p && next.day === "today";
            const azanable = p !== "sunrise";
            const on = azanable ? settings.prayers[p as keyof AzanSettings["prayers"]] : false;
            return (
              <View key={p} style={{ minWidth: "30%", flexGrow: 1, borderWidth: 1, borderColor: isNext ? c.accent : c.line, borderRadius: 14, padding: 10, opacity: !isNext && at.getTime() < now.getTime() ? 0.55 : 1, gap: 2 }}>
                <Muted>{ICONS[p]} {t.prayers[p]}</Muted>
                <H2>{fmt(at)}</H2>
                {azanable ? <Chip label={on ? "🔔" : "🔕"} active={on} onPress={() => update({ prayers: { ...settings.prayers, [p]: !on } })} /> : null}
              </View>
            );
          })}
        </View>
        <Kicker>{t.tomorrowTimes}</Kicker>
        <Row>{PRAYER_NAMES.map((p) => <Pill key={p}>{t.prayers[p]} {fmt(schedule.tomorrow[p])}</Pill>)}</Row>
        <Muted>{t.source}</Muted>
      </Card>

      <Card>
        <Kicker>{t.location}</Kicker>
        <Row><Button label={`📍 ${busy ? t.locating : t.useMyLocation}`} onPress={locate} disabled={busy} /><Muted>{t.timezone}: {settings.timeZone}</Muted></Row>
        <TextInput value={query} onChangeText={setQuery} placeholder={`${t.pickCity}…`} placeholderTextColor={c.muted} style={{ borderWidth: 1, borderColor: c.line, borderRadius: 14, padding: 12, color: c.ink, backgroundColor: c.card, fontSize: 16 }} />
        {hits.map((h, i) => <Chip key={`${h.name}-${i}`} label={`${h.name}${h.admin ? `, ${h.admin}` : ""} · ${h.country}`} onPress={() => { update({ latitude: h.latitude, longitude: h.longitude, timeZone: h.timeZone, city: h.name, countryCode: h.countryCode }); setQuery(""); setHits([]); }} />)}
        <Kicker>{t.method}</Kicker>
        <Row>
          <Chip label={`${t.methodAuto} · ${CALC_METHODS.find((x) => x.id === method)?.name ?? ""}`} active={settings.method === "auto"} onPress={() => update({ method: "auto" })} />
          {CALC_METHODS.map((x) => <Chip key={x.id} label={x.name} active={settings.method === x.id} onPress={() => update({ method: x.id })} />)}
        </Row>
        <Kicker>{t.prayers.asr}</Kicker>
        <Row>
          <Chip label={`${t.methodAuto} · ${asr === "hanafi" ? t.asrHanafi : t.prayers.asr}`} active={settings.asr === "auto"} onPress={() => update({ asr: "auto" })} />
          <Chip label={t.prayers.asr} active={settings.asr === "standard"} onPress={() => update({ asr: "standard" })} />
          <Chip label={t.asrHanafi} active={settings.asr === "hanafi"} onPress={() => update({ asr: "hanafi" })} />
        </Row>
      </Card>

      <Card>
        <Kicker>{t.muezzin}</Kicker>
        <Row>{MUEZZINS.map((mz) => <Chip key={mz.id} label={mz.name} active={settings.muezzin === mz.id} onPress={() => { update({ muezzin: mz.id }); if (playing) stopAzan(); }} />)}</Row>
        <Row style={{ justifyContent: "space-between" }}><Body>{t.playAtAzan}</Body><Switch value={settings.playInApp} onValueChange={(v) => update({ playInApp: v })} /></Row>
      </Card>

      <Card>
        <Kicker>{t.notifications}</Kicker>
        <Muted>{t.notificationsHelp}</Muted>
        <Row style={{ justifyContent: "space-between" }}><Body>{settings.notifications ? t.enabled : t.disabled}</Body><Switch value={settings.notifications} onValueChange={toggleNotifications} /></Row>
        <Row>{AZAN_PRAYERS.map((p) => <Chip key={p} label={t.prayers[p]} active={settings.prayers[p]} onPress={() => update({ prayers: { ...settings.prayers, [p]: !settings.prayers[p] } })} />)}</Row>
        {status ? <Pill>{status}</Pill> : null}
      </Card>
    </Screen>
  );
}
