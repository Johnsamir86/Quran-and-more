import { describe, expect, it } from "vitest";

import { matchSurah, parseSpokenNumber, parseVoiceCommand } from "./voice-commands";

const surahs = [
  { number: 1, arabicName: "الفاتحة", latinName: "Al-Fatihah", translatedName: "The Opener" },
  { number: 2, arabicName: "البقرة", latinName: "Al-Baqarah", translatedName: "The Cow" },
  { number: 18, arabicName: "الكهف", latinName: "Al-Kahf", translatedName: "The Cave" },
  { number: 36, arabicName: "يس", latinName: "Ya-Sin", translatedName: "Ya Sin" },
  { number: 55, arabicName: "الرحمن", latinName: "Ar-Rahman", translatedName: "The Beneficent" },
  { number: 67, arabicName: "الملك", latinName: "Al-Mulk", translatedName: "The Sovereignty" },
  { number: 112, arabicName: "الإخلاص", latinName: "Al-Ikhlas", translatedName: "The Sincerity" },
];

describe("voice commands", () => {
  it("matches English catalogue names and common spoken forms", () => {
    expect(parseVoiceCommand("play surah al kahf", surahs)).toMatchObject({ action: "play", surah: 18 });
    expect(parseVoiceCommand("open yaseen", surahs)).toMatchObject({ action: "play", surah: 36 });
    expect(parseVoiceCommand("recite the cave", surahs)).toMatchObject({ surah: 18 });
    expect(parseVoiceCommand("surah rahman please", surahs).surah).toBe(55);
    expect(parseVoiceCommand("play chapter 67", surahs).surah).toBe(67);
  });
  it("matches Arabic names with and without the article", () => {
    expect(parseVoiceCommand("شغّل سورة الكهف", surahs)).toMatchObject({ action: "play", surah: 18 });
    expect(parseVoiceCommand("افتح سورة يس", surahs).surah).toBe(36);
    expect(parseVoiceCommand("اسمعني الاخلاص", surahs).surah).toBe(112);
    expect(parseVoiceCommand("سورة الملك", surahs)).toMatchObject({ action: "play", surah: 67 });
  });
  it("reads ayah numbers in digits and words", () => {
    expect(parseVoiceCommand("play al baqarah ayah 255", surahs)).toMatchObject({ surah: 2, ayah: 255 });
    expect(parseVoiceCommand("surah al kahf verse ten", surahs)).toMatchObject({ surah: 18, ayah: 10 });
    expect(parseVoiceCommand("الآية مئتان وخمسة وخمسون من البقرة", surahs)).toMatchObject({ surah: 2, ayah: 255 });
    expect(parseSpokenNumber("twenty three")).toBe(23);
    expect(parseSpokenNumber("٣٦")).toBe(36);
  });
  it("tolerates small recognition slips", () => {
    expect(matchSurah("play surah al bakara", surahs)?.number).toBe(2);
    expect(matchSurah("play surah fatiha", surahs)?.number).toBe(1);
  });
  it("handles transport commands and unknown text", () => {
    expect(parseVoiceCommand("pause", surahs).action).toBe("pause");
    expect(parseVoiceCommand("next", surahs).action).toBe("next");
    expect(parseVoiceCommand("التالي", surahs).action).toBe("next");
    expect(parseVoiceCommand("what is the weather", surahs)).toMatchObject({ action: "unknown", surah: null });
  });
});
