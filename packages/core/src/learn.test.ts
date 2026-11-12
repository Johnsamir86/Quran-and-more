import { describe, expect, it } from "vitest";

import { buildLesson, checkOrder, levelForXp, type LessonAyah } from "./learn";
import { buildRound, scoreAnswer, type GameAyah, type GameSurah } from "./games";
import { arabicWords, compareRecitation, normaliseArabic, similarity } from "./text";
import { familyReducer, initialFamilyState, learnFor, bestScores } from "./family-store";

const ayahs: LessonAyah[] = [
  { verseKey: "112:1", translation: "Say: He is Allah, One", words: [
    { verseKey: "112:1", position: 1, arabic: "قُلْ", meaning: "Say", transliteration: "qul", audioUrl: null },
    { verseKey: "112:1", position: 2, arabic: "هُوَ", meaning: "He", transliteration: "huwa", audioUrl: null },
    { verseKey: "112:1", position: 3, arabic: "ٱللَّهُ", meaning: "Allah", transliteration: "allahu", audioUrl: null },
    { verseKey: "112:1", position: 4, arabic: "أَحَدٌ", meaning: "One", transliteration: "ahad", audioUrl: null } ] },
  { verseKey: "112:2", translation: "Allah, the Eternal", words: [
    { verseKey: "112:2", position: 1, arabic: "ٱللَّهُ", meaning: "Allah", transliteration: null, audioUrl: null },
    { verseKey: "112:2", position: 2, arabic: "ٱلصَّمَدُ", meaning: "the Eternal Refuge", transliteration: null, audioUrl: null } ] },
  { verseKey: "112:3", translation: null, words: [
    { verseKey: "112:3", position: 1, arabic: "لَمْ", meaning: "not", transliteration: null, audioUrl: null },
    { verseKey: "112:3", position: 2, arabic: "يَلِدْ", meaning: "He begets", transliteration: null, audioUrl: null },
    { verseKey: "112:3", position: 3, arabic: "وَلَمْ", meaning: "and not", transliteration: null, audioUrl: null },
    { verseKey: "112:3", position: 4, arabic: "يُولَدْ", meaning: "He is begotten", transliteration: null, audioUrl: null } ] },
];

describe("text", () => {
  it("normalises harakat and letter variants", () => {
    expect(normaliseArabic("ٱلرَّحْمَـٰنِ")).toBe("الرحمن");
    expect(arabicWords("بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ")).toEqual(["بسم", "الله", "الرحمن", "الرحيم"]);
    expect(similarity("الرحمن", "الرحمان")).toBeGreaterThan(0.8);
  });
  it("grades a recitation word by word", () => {
    const r = compareRecitation(["قُلْ", "هُوَ", "ٱللَّهُ", "أَحَدٌ"], "قل هو الله احد");
    expect(r.accuracy).toBe(100);
    const miss = compareRecitation(["قُلْ", "هُوَ", "ٱللَّهُ", "أَحَدٌ"], "قل الله احد");
    expect(miss.words[1].verdict).toBe("missed");
    expect(miss.accuracy).toBe(75);
    const extra = compareRecitation(["قُلْ", "هُوَ"], "قل يا هو");
    expect(extra.extras).toEqual(["يا"]);
  });
});

describe("learn", () => {
  it("builds a deterministic lesson with verbatim words", () => {
    const a = buildLesson(112, "الإخلاص", ayahs, { size: 8, seed: "t" });
    const b = buildLesson(112, "الإخلاص", ayahs, { size: 8, seed: "t" });
    expect(a.exercises.length).toBe(8);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    for (const ex of a.exercises) {
      if (ex.kind === "meaning") expect(ex.options[ex.answer]).toBe(ex.prompt.meaning);
      if (ex.kind === "word") expect(ex.options[ex.answer].meaning).toBe(ex.prompt);
      if (ex.kind === "hidden") expect(ex.options[ex.answer]).toBe(ex.ayah.words.find((w) => w.position === ex.hiddenPosition)!.arabic);
      if (ex.kind === "order") expect(checkOrder(ex, ex.ayah.words.map((_, i) => i))).toBe(true);
    }
    expect(a.xp).toBe(80);
  });
  it("levels up", () => {
    expect(levelForXp(0).level).toBe(1);
    expect(levelForXp(100).level).toBe(2);
    expect(levelForXp(230).level).toBe(3);
  });
  it("records xp, streak and scores per profile", () => {
    let s = familyReducer(initialFamilyState(), { type: "profile/add", input: { displayName: "A", role: "child", gender: "male", ageBand: "child", locale: "ar" }, id: "p1" });
    s = familyReducer(s, { type: "learn/complete", lessonId: "112:t", xp: 80, day: "2026-01-01" });
    s = familyReducer(s, { type: "learn/complete", lessonId: "113:t", xp: 50, day: "2026-01-02" });
    expect(learnFor(s, "p1")).toMatchObject({ xp: 130, streak: 2, lessonsDone: ["112:t", "113:t"] });
    s = familyReducer(s, { type: "game/score", kind: "guess-surah", score: 640, correct: 5, total: 8 });
    expect(bestScores(s)[0].score).toBe(640);
  });
});

describe("games", () => {
  const surahs: GameSurah[] = Array.from({ length: 10 }, (_, i) => ({ number: i + 1, arabicName: `س${i + 1}`, latinName: `S${i + 1}`, verseCount: 5 }));
  const ay: GameAyah[] = Array.from({ length: 12 }, (_, i) => ({ verseKey: `${(i % 10) + 1}:${i + 1}`, text: `آية ${i} كلمة ثانية ثالثة رابعة`, words: ["آية", `ك${i}`, "ثانية", "ثالثة", "رابعة"], juz: (i % 30) + 1, next: { verseKey: `${(i % 10) + 1}:${i + 2}`, text: `التالية ${i}` } }));
  it("builds each game kind with a valid answer index", () => {
    for (const kind of ["guess-surah", "next-ayah", "missing-word", "which-juz"] as const) {
      const r = buildRound(kind, surahs, ay, { seed: "x", count: 5 });
      expect(r.questions.length).toBeGreaterThan(0);
      for (const q of r.questions) { expect(q.options.length).toBe(4); expect(q.answer).toBeGreaterThanOrEqual(0); expect(q.answer).toBeLessThan(4); }
    }
  });
  it("scores speed", () => {
    expect(scoreAnswer(true, 20, 20)).toBe(150);
    expect(scoreAnswer(true, 0, 20)).toBe(100);
    expect(scoreAnswer(false, 20, 20)).toBe(0);
  });
});
