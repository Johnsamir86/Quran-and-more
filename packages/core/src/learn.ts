/**
 * Quranlingo-style vocabulary lessons built from the word-by-word data.
 * Every Arabic word shown is the verbatim Quran word; only the exercise
 * framing (choices, order) is generated.
 */
import { hashString, seededRandom, shuffle } from "./text";

export interface LessonWord {
  verseKey: string;
  position: number;
  arabic: string;
  meaning: string;
  transliteration: string | null;
  audioUrl: string | null;
}

export interface LessonAyah { verseKey: string; words: LessonWord[]; translation: string | null }

export type Exercise =
  | { kind: "meaning"; prompt: LessonWord; options: string[]; answer: number }
  | { kind: "word"; prompt: string; options: LessonWord[]; answer: number }
  | { kind: "hidden"; ayah: LessonAyah; hiddenPosition: number; options: string[]; answer: number }
  | { kind: "order"; ayah: LessonAyah; shuffled: number[] };

export interface Lesson { id: string; chapterId: number; title: string; exercises: Exercise[]; xp: number }

const distinctMeaning = (w: LessonWord) => w.meaning.trim().toLowerCase();

/** Content words worth learning: skip one-letter particles and words with no meaning text. */
const learnable = (w: LessonWord) => w.meaning.trim().length > 0 && w.arabic.replace(/[ً-ْ]/g, "").length > 1;

const pickOptions = <T>(pool: T[], correct: T, n: number, key: (t: T) => string, rnd: () => number): { options: T[]; answer: number } => {
  const seen = new Set([key(correct)]);
  const wrong: T[] = [];
  for (const c of shuffle(pool, rnd)) {
    if (wrong.length >= n - 1) break;
    const k = key(c); if (seen.has(k)) continue; seen.add(k); wrong.push(c);
  }
  const options = shuffle([correct, ...wrong], rnd);
  return { options, answer: options.indexOf(correct) };
};

/**
 * Build a lesson of about `size` exercises from a surah (or any ayah list).
 * `seed` makes the lesson deterministic; pass the date to get a new mix daily.
 */
export const buildLesson = (chapterId: number, title: string, ayahs: LessonAyah[], opts: { size?: number; seed?: string } = {}): Lesson => {
  const rnd = seededRandom(hashString(opts.seed ?? `${chapterId}`));
  const size = opts.size ?? 10;
  const words = ayahs.flatMap((a) => a.words).filter(learnable);
  const pool = words.filter((w, i, arr) => arr.findIndex((x) => distinctMeaning(x) === distinctMeaning(w)) === i);
  const exercises: Exercise[] = [];
  const order = shuffle(pool, rnd);
  let wi = 0;
  const next = () => order[wi++ % Math.max(1, order.length)];
  for (let i = 0; exercises.length < size && pool.length >= 2; i += 1) {
    const kind = i % 4;
    if (kind === 0 || pool.length < 4) {
      const w = next(); const o = pickOptions(pool, w, Math.min(4, pool.length), distinctMeaning, rnd);
      exercises.push({ kind: "meaning", prompt: w, options: o.options.map((x) => x.meaning), answer: o.answer });
    } else if (kind === 1) {
      const w = next(); const o = pickOptions(pool, w, 4, distinctMeaning, rnd);
      exercises.push({ kind: "word", prompt: w.meaning, options: o.options, answer: o.answer });
    } else if (kind === 2) {
      const candidates = ayahs.filter((a) => a.words.length >= 3);
      if (!candidates.length) { i -= 1; continue; }
      const ayah = candidates[Math.floor(rnd() * candidates.length)];
      const target = ayah.words[Math.floor(rnd() * ayah.words.length)];
      const o = pickOptions(pool.length >= 4 ? pool : words, target, 4, (w) => w.arabic, rnd);
      exercises.push({ kind: "hidden", ayah, hiddenPosition: target.position, options: o.options.map((x) => x.arabic), answer: o.answer });
    } else {
      const candidates = ayahs.filter((a) => a.words.length >= 3 && a.words.length <= 9);
      if (!candidates.length) { i -= 1; continue; }
      const ayah = candidates[Math.floor(rnd() * candidates.length)];
      let shuffled = shuffle(ayah.words.map((_, idx) => idx), rnd);
      if (shuffled.every((v, idx) => v === idx)) shuffled = shuffled.slice().reverse();
      exercises.push({ kind: "order", ayah, shuffled });
    }
  }
  return { id: `${chapterId}:${opts.seed ?? "default"}`, chapterId, title, exercises, xp: exercises.length * 10 };
};

export const checkOrder = (ex: Extract<Exercise, { kind: "order" }>, chosen: number[]): boolean =>
  chosen.length === ex.ayah.words.length && chosen.every((v, i) => v === i);

/** XP needed for each level (1-based). */
export const levelForXp = (xp: number): { level: number; next: number; progress: number } => {
  let level = 1, need = 100, acc = 0;
  while (xp >= acc + need) { acc += need; level += 1; need = Math.round(need * 1.3); }
  return { level, next: acc + need, progress: (xp - acc) / need };
};
