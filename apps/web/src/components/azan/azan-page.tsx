"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AZAN_PRAYERS, CALC_METHODS, MUEZZINS, PRAYER_NAMES, asrForCountry, formatCountdown, formatPrayerTime, hijriDate, methodForCountry, muezzinById, prayerSchedule, resolveCalc, type AzanSettings, type PrayerName } from "@qam/core";

import { detectLocation, geocodeCity, hasSavedAzanSettings, loadAzanSettings, pushSupported, saveAzanSettings, sendTestPush, subscribePush, syncPushSettings, unsubscribePush, type CityHit, type PushResult } from "@/lib/azan-client";
import { useI18n } from "@/lib/i18n";

import StudyShell from "../study/study-shell";
import shell from "../study/study.module.css";
import styles from "./azan.module.css";

const ICONS: Record<PrayerName, string> = { fajr: "🌄", sunrise: "🌅", dhuhr: "☀️", asr: "🌤️", maghrib: "🌇", isha: "🌙" };

export default function AzanPage() {
  const { locale, m, isRtl } = useI18n();
  const t = m.azan;
  const [settings, setSettings] = useState<AzanSettings | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<CityHit[]>([]);
  const [busy, setBusy] = useState<"locate" | "push" | null>(null);
  const [status, setStatus] = useState<{ text: string; bad?: boolean } | null>(null);
  const [playing, setPlaying] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null);
  const announced = useRef<string | null>(null);

  // Load saved settings; first visit on a device tries the browser location once.
  useEffect(() => {
    const s = loadAzanSettings();
    setSettings(s);
    if (!hasSavedAzanSettings()) void locate(s, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { const id = window.setInterval(() => setNow(new Date()), 1000); return () => window.clearInterval(id); }, []);

  const update = useCallback((patch: Partial<AzanSettings>) => {
    setSettings((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      saveAzanSettings(next);
      if (next.notifications) void syncPushSettings(next, locale);
      return next;
    });
  }, [locale]);

  const locate = async (base: AzanSettings | null, silent = false) => {
    setBusy("locate");
    if (!silent) setStatus({ text: t.locating });
    try {
      const loc = await detectLocation(locale);
      const next = { ...(base ?? loadAzanSettings()), ...loc };
      setSettings(next); saveAzanSettings(next);
      if (next.notifications) void syncPushSettings(next, locale);
      setStatus(silent ? null : { text: `${t.location}: ${next.city}` });
    } catch {
      if (!silent) setStatus({ text: t.locationDenied, bad: true });
    } finally { setBusy(null); }
  };

  // City search (debounced).
  useEffect(() => {
    if (query.trim().length < 2) { setHits([]); return; }
    const id = window.setTimeout(() => { geocodeCity(query, locale).then(setHits).catch(() => setHits([])); }, 300);
    return () => window.clearTimeout(id);
  }, [query, locale]);

  const pickCity = (h: CityHit) => {
    update({ latitude: h.latitude, longitude: h.longitude, timeZone: h.timeZone, city: h.name, countryCode: h.countryCode });
    setQuery(""); setHits([]);
  };

  const schedule = useMemo(() => (settings ? prayerSchedule(now, settings.timeZone, resolveCalc(settings, methodForCountry, asrForCountry)) : null), [settings, now]);

  // Play the azan inside the app when a prayer time arrives while the page is open.
  useEffect(() => {
    if (!settings || !schedule?.current || !settings.playInApp) return;
    const cur = schedule.current;
    const key = `${cur.day}-${cur.name}-${settings.city}`;
    if (cur.name === "sunrise" || !settings.prayers[cur.name as keyof AzanSettings["prayers"]]) return;
    const age = now.getTime() - cur.at.getTime();
    if (age >= 0 && age < 90_000 && announced.current !== key) { announced.current = key; void playAzan(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schedule?.current?.name, schedule?.current?.day]);

  const playAzan = async () => {
    if (!settings) return;
    const el = audio.current ?? new Audio();
    audio.current = el;
    el.src = muezzinById(settings.muezzin).url;
    el.onended = () => setPlaying(false);
    try { await el.play(); setPlaying(true); } catch { setPlaying(false); }
  };
  const stopAzan = () => { audio.current?.pause(); if (audio.current) audio.current.currentTime = 0; setPlaying(false); };

  const togglePush = async () => {
    if (!settings) return;
    setBusy("push");
    try {
      if (settings.notifications) {
        await unsubscribePush();
        update({ notifications: false });
        setStatus({ text: t.disabled });
      } else {
        const r: PushResult = await subscribePush(settings, locale);
        if (r === "ok") { update({ notifications: true }); setStatus({ text: t.enabled }); }
        else setStatus({ text: r === "denied" ? t.denied : r === "unsupported" ? t.unsupported : r === "unconfigured" ? `${t.unsupported} (VAPID)` : m.common.unavailable, bad: true });
      }
    } finally { setBusy(null); }
  };

  if (!settings || !schedule) return <StudyShell title={t.title}><div className={shell.muted}>{m.common.loading}</div></StudyShell>;

  const method = settings.method === "auto" ? methodForCountry(settings.countryCode) : settings.method;
  const asr = settings.asr === "auto" ? asrForCountry(settings.countryCode) : settings.asr;
  const fmt = (d: Date) => formatPrayerTime(d, settings.timeZone, locale);
  const next = schedule.next;
  const hijri = hijriDate(now, locale, settings.timeZone);
  const supported = pushSupported();

  return (
    <StudyShell title={t.title}>
      <section className={styles.hero} dir={isRtl ? "rtl" : "ltr"}>
        <div className={shell.kicker} style={{ color: "rgba(255,255,255,0.85)" }}>{settings.city}{settings.countryCode ? ` · ${settings.countryCode}` : ""} · {hijri}</div>
        {next ? (
          <>
            <div className={styles.heroSub}>{t.nextPrayer}: {ICONS[next.name]} {t.prayers[next.name]} · {fmt(next.at)}</div>
            <div className={styles.heroBig}>{formatCountdown(next.at.getTime() - now.getTime())}</div>
          </>
        ) : null}
        <div className={shell.row}>
          <button className={shell.chip} onClick={playing ? stopAzan : playAzan}>{playing ? `⏹ ${t.stop}` : `🔊 ${t.preview}`}</button>
          <Link href={next ? `/story?prayer=${next.name}` : "/story"} className={shell.chip}>✨ {t.openStory}</Link>
        </div>
      </section>

      <section className={shell.card}>
        <div className={shell.kicker}>{t.todayTimes}</div>
        <div className={styles.times}>
          {PRAYER_NAMES.map((p) => {
            const at = schedule.today[p];
            const isNext = next?.name === p && next.day === "today";
            const past = at.getTime() < now.getTime();
            const azanable = p !== "sunrise";
            const on = azanable ? settings.prayers[p as keyof AzanSettings["prayers"]] : false;
            return (
              <div key={p} className={`${styles.time} ${isNext ? styles.timeNext : ""} ${past && !isNext ? styles.timePast : ""}`}>
                <div className={styles.timeName}>{ICONS[p]} {t.prayers[p]}</div>
                <div className={styles.timeValue}>{fmt(at)}</div>
                {azanable ? <button className={styles.timeToggle} title={t.notifications} aria-pressed={on} onClick={() => update({ prayers: { ...settings.prayers, [p]: !on } })}>{on ? "🔔" : "🔕"}</button> : null}
              </div>
            );
          })}
        </div>
        <div className={shell.kicker} style={{ marginTop: 12 }}>{t.tomorrowTimes}</div>
        <div className={shell.row}>{PRAYER_NAMES.map((p) => <span key={p} className={shell.pill}>{t.prayers[p]} {fmt(schedule.tomorrow[p])}</span>)}</div>
        <p className={shell.muted}>{t.source}</p>
      </section>

      <section className={shell.card}>
        <div className={shell.kicker}>{t.location}</div>
        <div className={shell.row}>
          <button className={shell.btn} disabled={busy === "locate"} onClick={() => locate(settings)}>📍 {busy === "locate" ? t.locating : t.useMyLocation}</button>
          <span className={shell.muted}>{t.timezone}: {settings.timeZone}</span>
        </div>
        <div className={styles.formRow}>
          <label htmlFor="azan-city">{t.pickCity}</label>
          <input id="azan-city" className={shell.input} value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`${t.city}…`} autoComplete="off" />
          {hits.length ? (
            <div className={styles.suggest}>
              {hits.map((h, i) => <button key={`${h.name}-${i}`} className={styles.suggestItem} onClick={() => pickCity(h)}>{h.name}{h.admin ? `, ${h.admin}` : ""} · {h.country} <span className={shell.muted}>({h.timeZone})</span></button>)}
            </div>
          ) : null}
        </div>
        <div className={styles.grid}>
          <div className={styles.formRow}>
            <label htmlFor="azan-method">{t.method}</label>
            <select id="azan-method" className={shell.select} value={settings.method} onChange={(e) => update({ method: e.target.value as AzanSettings["method"] })}>
              <option value="auto">{t.methodAuto} · {CALC_METHODS.find((c) => c.id === method)?.name}</option>
              {CALC_METHODS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className={styles.formRow}>
            <label htmlFor="azan-asr">{t.prayers.asr}</label>
            <select id="azan-asr" className={shell.select} value={settings.asr} onChange={(e) => update({ asr: e.target.value as AzanSettings["asr"] })}>
              <option value="auto">{t.methodAuto} · {asr === "hanafi" ? t.asrHanafi : t.prayers.asr}</option>
              <option value="standard">{t.prayers.asr} (Shafi‘i, Maliki, Hanbali)</option>
              <option value="hanafi">{t.asrHanafi}</option>
            </select>
          </div>
          <div className={styles.formRow}>
            <label htmlFor="azan-highlat">{t.highLat}</label>
            <select id="azan-highlat" className={shell.select} value={settings.highLat} onChange={(e) => update({ highLat: e.target.value as AzanSettings["highLat"] })}>
              <option value="night-middle">Middle of the night</option>
              <option value="one-seventh">One seventh of the night</option>
              <option value="angle-based">Angle based</option>
            </select>
          </div>
        </div>
      </section>

      <section className={shell.card}>
        <div className={shell.kicker}>{t.muezzin}</div>
        <div className={shell.row}>
          {MUEZZINS.map((mz) => <button key={mz.id} className={`${shell.chip} ${settings.muezzin === mz.id ? shell.chipActive : ""}`} onClick={() => { update({ muezzin: mz.id }); if (playing) { stopAzan(); } }}>{mz.name}</button>)}
        </div>
        <div className={shell.row}>
          <button className={shell.chip} onClick={playing ? stopAzan : playAzan}>{playing ? `⏹ ${t.stop}` : `🔊 ${t.preview}`}</button>
          <label className={styles.switch}><input type="checkbox" checked={settings.playInApp} onChange={(e) => update({ playInApp: e.target.checked })} /> {t.playAtAzan}</label>
        </div>
      </section>

      <section className={shell.card}>
        <div className={shell.kicker}>{t.notifications}</div>
        <p className={shell.muted}>{t.notificationsHelp}</p>
        {!supported ? <div className={`${styles.status} ${styles.statusBad}`}>{t.unsupported}</div> : null}
        <div className={shell.row}>
          <button className={shell.btn} disabled={!supported || busy === "push"} onClick={togglePush}>{settings.notifications ? `🔕 ${m.common.disable}` : `🔔 ${t.enable}`}</button>
          {settings.notifications ? <button className={shell.chip} onClick={async () => setStatus({ text: (await sendTestPush()) ? t.testNotification + " ✓" : m.common.unavailable })}>{t.testNotification}</button> : null}
          <span className={shell.pill}>{settings.notifications ? t.enabled : t.disabled}</span>
        </div>
        <div className={shell.row}>
          {AZAN_PRAYERS.map((p) => <label key={p} className={styles.switch}><input type="checkbox" checked={settings.prayers[p]} onChange={(e) => update({ prayers: { ...settings.prayers, [p]: e.target.checked } })} /> {t.prayers[p]}</label>)}
        </div>
        {status ? <div className={`${styles.status} ${status.bad ? styles.statusBad : ""}`}>{status.text}</div> : null}
      </section>
    </StudyShell>
  );
}
