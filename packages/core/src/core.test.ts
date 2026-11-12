import { describe, expect, it } from "vitest";

import {
  assertVerbatimQuran,
  canProfileHearReciter,
  canViewProgress,
  hasFeature,
  outputContainsAllVersesVerbatim,
  resolveLocale,
  RestrictedModeViolation,
  tierFor,
} from "./index";

describe("locales", () => {
  it("resolves device language to a supported locale", () => {
    expect(resolveLocale("ar-EG")).toBe("ar");
    expect(resolveLocale("pt-BR")).toBe("pt");
    expect(resolveLocale("de-DE")).toBe("en");
    expect(resolveLocale(undefined)).toBe("en");
  });
});

describe("reciter visibility", () => {
  it("shows female reciters to female profiles only", () => {
    expect(canProfileHearReciter({ gender: "female" }, { id: 1, gender: "female" })).toBe(true);
    expect(canProfileHearReciter({ gender: "male" }, { id: 1, gender: "female" })).toBe(false);
    expect(canProfileHearReciter({ gender: "unspecified" }, { id: 1, gender: "female" })).toBe(false);
    expect(canProfileHearReciter({ gender: "male" }, { id: 2, gender: "male" })).toBe(true);
  });
});

describe("progress visibility", () => {
  const child = { familyId: "fam1", linkedMadrasahIds: ["m1"] };
  it("parent in same family can view", () => {
    expect(canViewProgress({ role: "parent", familyId: "fam1" }, child)).toBe(true);
    expect(canViewProgress({ role: "parent", familyId: "fam2" }, child)).toBe(false);
  });
  it("teacher of a linked madrasah can view", () => {
    expect(canViewProgress({ role: "teacher", madrasahId: "m1" }, child)).toBe(true);
    expect(canViewProgress({ role: "teacher", madrasahId: "m9" }, child)).toBe(false);
  });
});

describe("tiers", () => {
  it("gates features by tier", () => {
    expect(hasFeature("free", "reader.core")).toBe(true);
    expect(hasFeature("free", "ai.ask")).toBe(false);
    expect(tierFor("madrasah.classes")).toBe("madrasah");
    expect(tierFor("family.progress")).toBe("family");
  });
});

describe("restricted mode", () => {
  const ayah = "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ";
  it("accepts verbatim text with harmless whitespace differences", () => {
    expect(() => assertVerbatimQuran(ayah, `  ${ayah}\n`)).not.toThrow();
  });
  it("rejects any change to the ayah", () => {
    expect(() => assertVerbatimQuran(ayah, ayah.replace("ٱلرَّحِيمِ", "الرحيم"))).toThrow(RestrictedModeViolation);
  });
  it("checks that artifacts contain every verse verbatim", () => {
    expect(outputContainsAllVersesVerbatim([ayah], `Title\n${ayah}\nhashtags`)).toBe(true);
    expect(outputContainsAllVersesVerbatim([ayah], "Title only")).toBe(false);
  });
});
