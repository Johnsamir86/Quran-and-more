/**
 * Quran Arena-style quiz games. Questions are built from verbatim Quran
 * text and catalogue names; the app fetches the ayat, this module frames
 * the questions and scores them.
 */
import { hashString, seededRandom, shuffle } from "./text";

export type GameKind = "guess-surah" | "next-ayah" | "missing-word" | "which-juz";

export interface GameSurah { number: number; arabicName: string; latinName: string; verseCount: number }
export interface GameAyah { verseKey: string; text: string; words: string[]; juz: number | null; next: { verseKey: string; text: string } | null }

export interface GameQuestion {
  kind: GameKind;
  id: string;
  prompt: string; // Arabic ayah text (verbatim)
  verseKey: string;
  options: string[];
  answer: number;
  /** Extra data for "missing-word": the ayah with the blank marked as "____". */
  display?: string;
}

export interface GameRound { kind: GameKind; questions: GameQuestion[]; secondsPerQuestion: number }

const surahOptions = (surahs: GameSurah[], correct: GameSurah, rnd: () => number, ar: boolean) => {
  const wrong = shuffle(surahs.filter((s) => s.number !== correct.number), rnd).slice(0, 3);
  const all = shuffle([correct, ...wrong], rnd);
  return { options: all.map((s) => (ar ? s.arabicName : s.latinName)), answer: all.indexOf(correct) };
};

/** Build a round. `ayahs` should be random ayat (with `next` when available); `seed` keeps it reproducible. */
export const buildRound = (kind: GameKind, surahs: GameSurah[], ayahs: GameAyah[], opts: { seed?: string; count?: number; arabicNames?: boolean } = {}): GameRound => {
  const rnd = seededRandom(hashString(opts.seed ?? kind));
  const count = opts.count ?? 8;
  const ar = opts.arabicNames ?? true;
  const byNumber = new Map(surahs.map((s) => [s.number, s]));
  const questions: GameQuestion[] = [];
  for (const a of shuffle(ayahs, rnd)) {
    if (questions.length >= count) break;
    const sn = Number(a.verseKey.split(":")[0]);
    const surah = byNumber.get(sn);
    if (!surah) continue;
    if (kind === "guess-surah") {
      const o = surahOptions(surahs, surah, rnd, ar);
      questions.push({ kind, id: a.verseKey, prompt: a.text, verseKey: a.verseKey, ...o });
    } else if (kind === "next-ayah") {
      if (!a.next) continue;
      const others = shuffle(ayahs.filter((x) => x.verseKey !== a.verseKey && x.next && x.next.verseKey !== a.next!.verseKey), rnd).slice(0, 3).map((x) => x.next!.text);
      if (others.length < 3) continue;
      const options = shuffle([a.next.text, ...others], rnd);
      questions.push({ kind, id: a.verseKey, prompt: a.text, verseKey: a.verseKey, options, answer: options.indexOf(a.next.text) });
    } else if (kind === "missing-word") {
      if (a.words.length < 4) continue;
      const idx = 1 + Math.floor(rnd() * (a.words.length - 2));
      const target = a.words[idx];
      const pool = shuffle(ayahs.flatMap((x) => x.words).filter((w) => w !== target && w.length > 2), rnd);
      const wrong: string[] = [];
      for (const w of pool) { if (wrong.length >= 3) break; if (!wrong.includes(w)) wrong.push(w); }
      if (wrong.length < 3) continue;
      const options = shuffle([target, ...wrong], rnd);
      questions.push({ kind, id: a.verseKey, prompt: a.text, verseKey: a.verseKey, options, answer: options.indexOf(target), display: a.words.map((w, i) => (i === idx ? "____" : w)).join(" ") });
    } else {
      if (!a.juz) continue;
      const wrongs = shuffle(Array.from({ length: 30 }, (_, i) => i + 1).filter((j) => j !== a.juz), rnd).slice(0, 3);
      const opts2 = shuffle([a.juz, ...wrongs], rnd);
      questions.push({ kind, id: a.verseKey, prompt: a.text, verseKey: a.verseKey, options: opts2.map(String), answer: opts2.indexOf(a.juz) });
    }
  }
  return { kind, questions, secondsPerQuestion: kind === "next-ayah" ? 30 : 20 };
};

/** Score one answer: 100 for correct plus up to 50 for speed; 0 when wrong. */
export const scoreAnswer = (correct: boolean, secondsLeft: number, secondsPerQuestion: number): number =>
  correct ? 100 + Math.round(50 * Math.max(0, Math.min(1, secondsLeft / secondsPerQuestion))) : 0;

export const GAME_LABELS: Record<GameKind, { ar: string; en: string; icon: string; arSub: string; enSub: string }> = {
  "guess-surah": { ar: "من أي سورة؟", en: "Which surah?", icon: "🕌", arSub: "اقرأ الآية واختر السورة", enSub: "Read the ayah, pick its surah" },
  "next-ayah": { ar: "الآية التالية", en: "Next ayah", icon: "⏭", arSub: "ما الآية التي تليها؟", enSub: "Which ayah comes next?" },
  "missing-word": { ar: "الكلمة الناقصة", en: "Missing word", icon: "🧩", arSub: "أكمل الآية بالكلمة الصحيحة", enSub: "Complete the ayah with the right word" },
  "which-juz": { ar: "في أي جزء؟", en: "Which juz?", icon: "📚", arSub: "خمّن الجزء", enSub: "Guess the juz" },
};
