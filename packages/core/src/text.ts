/**
 * Arabic text helpers shared by search, learning exercises, games and the
 * recitation check. Nothing here ever changes Quran text that is shown to a
 * user; normalisation is only used for matching.
 */

const TASHKEEL = /[ؐ-ًؚ-ٰٟۖ-ۭـ࣓-ࣿ]/g;

/** Strip harakat, Quranic marks and tatweel; unify alef, ya, ta marbuta and hamza forms. */
export const normaliseArabic = (s: string): string =>
  s
    .replace(TASHKEEL, "")
    .replace(/[آأإٱٲٳٵ]/g, "ا") // آ أ إ ٱ -> ا
    .replace(/[ىی]/g, "ي") // ى ی -> ي
    .replace(/ة/g, "ه") // ة -> ه
    .replace(/[ؤ]/g, "و") // ؤ -> و
    .replace(/[ئ]/g, "ي") // ئ -> ي
    .replace(/[ء]/g, "") // standalone hamza
    .replace(/[^ء-ي٠-٩\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const arabicWords = (s: string): string[] => normaliseArabic(s).split(" ").filter(Boolean);

/** Levenshtein distance on code points. */
export const editDistance = (a: string, b: string): number => {
  const m = a.length, n = b.length;
  if (!m) return n; if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i += 1) {
    const cur = [i];
    for (let j = 1; j <= n; j += 1) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[n];
};

/** 1 = identical, 0 = nothing in common. */
export const similarity = (a: string, b: string): number => {
  const L = Math.max(a.length, b.length);
  return L ? 1 - editDistance(a, b) / L : 1;
};

export type WordVerdict = "correct" | "close" | "missed" | "extra";

export interface RecitationWord { position: number; expected: string; heard: string | null; verdict: WordVerdict }
export interface RecitationResult { words: RecitationWord[]; extras: string[]; accuracy: number; correct: number; close: number; missed: number }

/**
 * Compare what a speech recogniser heard with the expected ayah words.
 * Dynamic-programming alignment on normalised words; a word counts as
 * "close" when at least 70% similar (recognisers drop harakat and confuse
 * hamza forms). Used by the recitation check (Tasmi').
 */
export const compareRecitation = (expectedWords: string[], heard: string): RecitationResult => {
  const exp = expectedWords.map(normaliseArabic);
  const got = arabicWords(heard);
  const m = exp.length, n = got.length;
  const score = (i: number, j: number) => similarity(exp[i], got[j]);
  // dp[i][j] = best total similarity aligning exp[0..i) with got[0..j)
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  const back: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0)); // 0 diag, 1 up (skip expected), 2 left (extra heard)
  for (let i = 1; i <= m; i += 1) for (let j = 1; j <= n; j += 1) {
    const d = dp[i - 1][j - 1] + score(i - 1, j - 1);
    const u = dp[i - 1][j];
    const l = dp[i][j - 1];
    if (d >= u && d >= l) { dp[i][j] = d; back[i][j] = 0; } else if (u >= l) { dp[i][j] = u; back[i][j] = 1; } else { dp[i][j] = l; back[i][j] = 2; }
  }
  const words: RecitationWord[] = exp.map((_, i) => ({ position: i + 1, expected: expectedWords[i], heard: null, verdict: "missed" }));
  const extras: string[] = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && back[i][j] === 0) {
      const s = score(i - 1, j - 1);
      if (s >= 0.7) { words[i - 1].heard = got[j - 1]; words[i - 1].verdict = s >= 0.95 ? "correct" : "close"; }
      else { extras.push(got[j - 1]); }
      i -= 1; j -= 1;
    } else if (i > 0 && (j === 0 || back[i][j] === 1)) { i -= 1; }
    else { extras.push(got[j - 1]); j -= 1; }
  }
  const correct = words.filter((w) => w.verdict === "correct").length;
  const close = words.filter((w) => w.verdict === "close").length;
  const missed = m - correct - close;
  return { words, extras: extras.reverse(), accuracy: m ? Math.round(((correct + close * 0.5) / m) * 100) : 0, correct, close, missed };
};

/** Small seeded PRNG (mulberry32) so lessons and games are reproducible in tests. */
export const seededRandom = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const shuffle = <T>(items: T[], rnd: () => number): T[] => {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i -= 1) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};

export const hashString = (s: string): number => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
};
