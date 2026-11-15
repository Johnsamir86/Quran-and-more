import { describe, expect, it } from "vitest";

import { ADHKAR, adhkarFor, adhkarProgress, emptyAdhkarDay, suggestedAdhkar } from "./adhkar";
import { daysToRamadan, formatHijri, hijriMonthGrid, hijriMonthLength, hijriToGregorian, toHijri, upcomingEvents } from "./hijri";
import { JUZ_START_PAGES, juzOfPage, khatmahStatus, pagesPerDay } from "./khatmah";
import { compassPoint, distanceToKaabaKm, qiblaBearing, qiblaOffset } from "./qibla";
import { TASBIH_PRESETS, tasbihTap } from "./tasbih";

describe("qibla", () => {
  it("matches published bearings for well-known cities", () => {
    expect(qiblaBearing(29.3759, 47.9774)).toBeCloseTo(224.6, 0); // Kuwait City ≈ 225°
    expect(qiblaBearing(51.5074, -0.1278)).toBeCloseTo(118.99, 0); // London ≈ 119°
    expect(qiblaBearing(40.7128, -74.006)).toBeCloseTo(58.48, 0); // New York ≈ 58°
    expect(qiblaBearing(-6.2088, 106.8456)).toBeCloseTo(295.15, 0); // Jakarta ≈ 295°
  });
  it("gives distance and offsets", () => {
    expect(distanceToKaabaKm(29.3759, 47.9774)).toBeGreaterThan(1180);
    expect(distanceToKaabaKm(29.3759, 47.9774)).toBeLessThan(1230);
    expect(distanceToKaabaKm(21.422487, 39.826206)).toBeCloseTo(0, 3);
    expect(qiblaOffset(200, 210)).toBe(10);
    expect(qiblaOffset(350, 10)).toBe(20);
    expect(qiblaOffset(10, 350)).toBe(-20);
    expect(compassPoint(210)).toBe("SW");
    expect(compassPoint(359)).toBe("N");
  });
});

describe("hijri", () => {
  it("converts both ways with the Umm al-Qura tables", () => {
    const g = new Date(Date.UTC(2026, 10, 15, 12));
    const h = toHijri(g, 0, "UTC");
    expect(h.year).toBe(1448);
    expect(h.month).toBeGreaterThanOrEqual(5);
    const back = hijriToGregorian(h, "UTC");
    expect(toHijri(back, 0, "UTC")).toEqual(h);
    expect(formatHijri({ year: 1447, month: 9, day: 1 })).toBe("1 Ramadan 1447 AH");
    expect(formatHijri({ year: 1447, month: 9, day: 1 }, "ar")).toContain("رمضان");
  });
  it("knows month lengths and builds a grid", () => {
    const len = hijriMonthLength(1447, 9, "UTC");
    expect([29, 30]).toContain(len);
    expect(hijriMonthGrid(1447, 9, 0, "UTC")).toHaveLength(len);
    const first = hijriMonthGrid(1447, 9, 0, "UTC")[0].date;
    expect(first.getFullYear()).toBe(2026);
    expect(first.getMonth()).toBe(1); // Ramadan 1447 began in February 2026
    expect(daysToRamadan(new Date(2026, 10, 15, 9), 0, "UTC")).toBe(85); // 1 Ramadan 1448 = 8 Feb 2027
  });
  it("lists upcoming events soonest first and counts down to Ramadan", () => {
    const today = new Date(Date.UTC(2026, 10, 15, 12));
    const ev = upcomingEvents(today, 0, "UTC");
    expect(ev.length).toBeGreaterThan(5);
    for (let i = 1; i < ev.length; i++) expect(ev[i].inDays).toBeGreaterThanOrEqual(ev[i - 1].inDays);
    const ramadan = ev.find((e) => e.id === "ramadanStart")!;
    expect(ramadan.hijri.year).toBe(1448);
    expect(daysToRamadan(today, 0, "UTC")).toBe(ramadan.inDays);
    expect(daysToRamadan(today, 0, "UTC")).toBeGreaterThan(60);
    expect(daysToRamadan(today, 0, "UTC")).toBeLessThan(120);
    const inRamadan = hijriToGregorian({ year: 1448, month: 9, day: 5 }, "UTC");
    expect(daysToRamadan(inRamadan, 0, "UTC")).toBe(0);
  });
  it("applies a manual day adjustment", () => {
    const g = new Date(Date.UTC(2026, 10, 15, 12));
    const a = toHijri(g, 0, "UTC"), b = toHijri(g, 1, "UTC");
    expect((b.day - a.day + 30) % 30).toBe(1);
  });
});

describe("adhkar", () => {
  it("has the five categories with Arabic, English and counts", () => {
    for (const cat of ["morning", "evening", "afterPrayer", "sleep", "waking"] as const) {
      const list = adhkarFor(cat);
      expect(list.length).toBeGreaterThan(3);
      for (const d of list) { expect(d.ar.length).toBeGreaterThan(5); expect(d.en.length).toBeGreaterThan(5); expect(d.count).toBeGreaterThanOrEqual(1); }
    }
    expect(new Set(ADHKAR.map((d) => d.id)).size).toBe(ADHKAR.length);
  });
  it("suggests a set by hour and tracks completion", () => {
    expect(suggestedAdhkar(7)).toBe("morning");
    expect(suggestedAdhkar(17)).toBe("evening");
    expect(suggestedAdhkar(23)).toBe("sleep");
    const s = emptyAdhkarDay("2026-11-15");
    const first = adhkarFor("morning")[0];
    s.counts[first.id] = first.count;
    expect(adhkarProgress("morning", s)).toEqual({ done: 1, total: adhkarFor("morning").length });
  });
});

describe("tasbih", () => {
  it("rolls over at the target", () => {
    let s = { presetId: "subhanallah", count: 31, rounds: 0, total: 31, updatedAt: 0 };
    s = tasbihTap(s, 33); expect(s.count).toBe(32);
    s = tasbihTap(s, 33); expect(s).toMatchObject({ count: 0, rounds: 1, total: 33 });
    expect(TASBIH_PRESETS.find((p) => p.id === "allahuakbar")?.target).toBe(34);
  });
});

describe("khatmah", () => {
  it("plans 604 pages over the chosen days", () => {
    const plan = { startDay: "2026-11-15", days: 30, startPage: 1, createdAt: 0 };
    expect(pagesPerDay(plan)).toBeCloseTo(20.13, 1);
    const d0 = khatmahStatus(plan, 0, "2026-11-15");
    expect(d0).toMatchObject({ dayIndex: 0, todayFrom: 1, targetPage: 20, behindPages: 0, percent: 0, finished: false, daysLeft: 30 });
    const d5 = khatmahStatus(plan, 80, "2026-11-20");
    expect(d5.dayIndex).toBe(5);
    expect(d5.targetPage).toBe(120);
    expect(d5.todayFrom).toBe(81);
    expect(d5.behindPages).toBe(20);
    expect(khatmahStatus(plan, 604, "2026-12-20").finished).toBe(true);
    expect(khatmahStatus(plan, 604, "2026-12-20").percent).toBe(100);
  });
  it("maps pages to ajzaʾ", () => {
    expect(JUZ_START_PAGES).toHaveLength(30);
    expect(juzOfPage(1)).toBe(1); expect(juzOfPage(21)).toBe(1); expect(juzOfPage(22)).toBe(2); expect(juzOfPage(604)).toBe(30);
  });
});

describe("99 names", () => {
  it("has 99 unique names in the Tirmidhi order", async () => {
    const { DIVINE_NAMES, nameOfDay } = await import("./names");
    expect(DIVINE_NAMES).toHaveLength(99);
    expect(new Set(DIVINE_NAMES.map((n) => n.tr)).size).toBe(99);
    expect(DIVINE_NAMES[0].tr).toBe("Ar-Rahman");
    expect(DIVINE_NAMES[98].tr).toBe("As-Sabur");
    expect(nameOfDay(new Date(2026, 10, 15)).n).toBeGreaterThan(0);
  });
});

describe("plans and limits", () => {
  it("maps entitlements to plans and meters Plus", async () => {
    const { planFromEntitlements, usageAllowed, bumpUsage, PLAN_LIMITS, isFreeReciter } = await import("./subscriptions");
    expect(planFromEntitlements([])).toBe("free");
    expect(planFromEntitlements(["offline_audio"])).toBe("plus");
    expect(planFromEntitlements(["offline_audio", "plus_unlimited"])).toBe("unlimited");
    const now = new Date(2026, 10, 16, 9);
    let u = bumpUsage(null, "ask", now);
    for (let i = 1; i < PLAN_LIMITS.plus.askPerDay; i++) u = bumpUsage(u, "ask", now);
    expect(usageAllowed("plus", u, "ask", now)).toBe(false);
    expect(usageAllowed("unlimited", u, "ask", now)).toBe(true);
    expect(usageAllowed("plus", u, "ask", new Date(2026, 10, 17, 9))).toBe(true); // next day resets
    expect(usageAllowed("free", null, "video", now)).toBe(false);
    expect(isFreeReciter({ id: "c7", chapterReciterId: 7, recitationId: 7 })).toBe(true);
    expect(isFreeReciter({ id: "c1", chapterReciterId: 1, recitationId: 1 })).toBe(false);
  });
});
