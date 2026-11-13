import { describe, expect, it } from "vitest";

import { asrForCountry, computePrayerTimes, formatPrayerTime, methodForCountry, prayerSchedule } from "./prayer-times";

const hm = (d: Date, tz: string) => formatPrayerTime(d, tz, "en-GB", false);

describe("prayer times", () => {
  it("matches Aladhan for Cairo (Egyptian authority) on 13 Nov 2026", () => {
    // Reference from api.aladhan.com/v1/timings/13-11-2026?latitude=30.0444&longitude=31.2357&method=5
    const t = computePrayerTimes(2026, 11, 13, { latitude: 30.0444, longitude: 31.2357, method: "egypt" });
    const got = { fajr: hm(t.fajr, "Africa/Cairo"), sunrise: hm(t.sunrise, "Africa/Cairo"), dhuhr: hm(t.dhuhr, "Africa/Cairo"), asr: hm(t.asr, "Africa/Cairo"), maghrib: hm(t.maghrib, "Africa/Cairo"), isha: hm(t.isha, "Africa/Cairo") };
    const want = { fajr: "04:49", sunrise: "06:18", dhuhr: "11:39", asr: "14:40", maghrib: "17:00", isha: "18:20" };
    for (const k of Object.keys(want) as (keyof typeof want)[]) expect(Math.abs(mins(got[k]) - mins(want[k])), `${k} got ${got[k]} want ${want[k]}`).toBeLessThanOrEqual(2);
  });
  it("matches Aladhan for London (MWL) on 13 Nov 2026", () => {
    const t = computePrayerTimes(2026, 11, 13, { latitude: 51.5074, longitude: -0.1278, method: "mwl" });
    const tz = "Europe/London";
    const got = { fajr: hm(t.fajr, tz), sunrise: hm(t.sunrise, tz), dhuhr: hm(t.dhuhr, tz), asr: hm(t.asr, tz), maghrib: hm(t.maghrib, tz), isha: hm(t.isha, tz) };
    const want = { fajr: "05:18", sunrise: "07:15", dhuhr: "11:45", asr: "13:52", maghrib: "16:14", isha: "18:04" };
    for (const k of Object.keys(want) as (keyof typeof want)[]) expect(Math.abs(mins(got[k]) - mins(want[k])), `${k} got ${got[k]} want ${want[k]}`).toBeLessThanOrEqual(2);
  });
  it("Hanafi asr is later than standard asr", () => {
    const a = computePrayerTimes(2026, 6, 21, { latitude: 33.68, longitude: 73.04, method: "karachi", asr: "standard" });
    const b = computePrayerTimes(2026, 6, 21, { latitude: 33.68, longitude: 73.04, method: "karachi", asr: "hanafi" });
    expect(b.asr.getTime()).toBeGreaterThan(a.asr.getTime() + 30 * 60_000);
  });
  it("gives finite times in midsummer Oslo (high-latitude fallback)", () => {
    const t = computePrayerTimes(2026, 6, 21, { latitude: 59.91, longitude: 10.75, method: "mwl" });
    for (const d of Object.values(t)) expect(Number.isFinite(d.getTime())).toBe(true);
    expect(t.fajr.getTime()).toBeLessThan(t.sunrise.getTime());
    expect(t.isha.getTime()).toBeGreaterThan(t.maghrib.getTime());
  });
  it("picks the next prayer across midnight", () => {
    const now = new Date("2026-11-13T22:30:00Z"); // 00:30 in Cairo on the 14th
    const s = prayerSchedule(now, "Africa/Cairo", { latitude: 30.0444, longitude: 31.2357, method: "egypt" });
    expect(s.next?.name).toBe("fajr");
    expect(s.current?.name).toBe("isha");
  });
  it("maps countries to methods and schools", () => {
    expect(methodForCountry("eg")).toBe("egypt");
    expect(methodForCountry("US")).toBe("isna");
    expect(methodForCountry("ZZ")).toBe("mwl");
    expect(asrForCountry("PK")).toBe("hanafi");
    expect(asrForCountry("EG")).toBe("standard");
  });
});

const mins = (s: string) => { const [h, m] = s.split(":").map(Number); return h * 60 + m; };
