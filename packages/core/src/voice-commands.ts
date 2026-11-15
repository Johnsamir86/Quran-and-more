import { editDistance, normaliseArabic } from "./text";

/**
 * Voice commands for the player: "play surah Al-Kahf", "open Ya-Sin ayah 36",
 * "شغّل سورة الكهف", "الآية مئتان وخمسة وخمسون من البقرة". The matcher works on
 * whatever surah list the app already has (API names in the interface language),
 * plus a table of common spoken forms, so it never needs a network call.
 */
export interface VoiceSurah { number: number; arabicName: string; latinName: string; translatedName?: string }
export type VoiceAction = "play" | "pause" | "next" | "prev" | "stop" | "unknown";
export interface VoiceCommand { action: VoiceAction; surah: number | null; ayah: number | null; confidence: number; transcript: string }

/** Common spoken/transliterated forms that differ from the catalogue spelling. */
const ALIASES: Record<number, string[]> = {
  1: ["fatiha", "fatihah", "opening", "الحمد"], 2: ["baqara", "baqarah", "cow"], 3: ["imran", "ali imran", "al imran", "ال عمران", "آل عمران"], 4: ["nisa", "nisaa", "women"],
  5: ["maida", "maidah", "table"], 6: ["anam", "an'am", "cattle"], 7: ["araf", "a'raf"], 8: ["anfal"], 9: ["tawba", "tawbah", "bara'a", "براءة"], 10: ["yunus", "younus", "jonah"],
  11: ["hud", "hood"], 12: ["yusuf", "yousuf", "joseph"], 13: ["rad", "ra'd", "thunder"], 14: ["ibrahim", "abraham"], 15: ["hijr"], 16: ["nahl", "bee"], 17: ["isra", "israa", "bani israil", "night journey"],
  18: ["kahf", "cave"], 19: ["maryam", "mary"], 20: ["taha", "ta ha", "طه"], 21: ["anbiya", "anbiyaa", "prophets"], 22: ["hajj", "pilgrimage"], 23: ["muminun", "mu'minoon", "believers"],
  24: ["nur", "noor", "light"], 25: ["furqan", "criterion"], 26: ["shuara", "shu'ara", "poets"], 27: ["naml", "ants"], 28: ["qasas", "stories"], 29: ["ankabut", "ankaboot", "spider"],
  30: ["rum", "room", "romans"], 31: ["luqman", "lukman"], 32: ["sajda", "sajdah", "prostration"], 33: ["ahzab", "confederates"], 34: ["saba", "sheba"], 35: ["fatir", "originator", "malaika"],
  36: ["yasin", "yaseen", "ya sin", "يس"], 37: ["saffat"], 38: ["sad", "saad", "ص"], 39: ["zumar", "groups"], 40: ["ghafir", "mumin", "forgiver"], 41: ["fussilat", "ha mim sajda"],
  42: ["shura", "consultation"], 43: ["zukhruf", "ornaments"], 44: ["dukhan", "smoke"], 45: ["jathiya", "jathiyah", "kneeling"], 46: ["ahqaf"], 47: ["muhammad", "mohammed"],
  48: ["fath", "victory"], 49: ["hujurat", "rooms"], 50: ["qaf", "ق"], 51: ["dhariyat", "zariyat"], 52: ["tur", "toor", "mount"], 53: ["najm", "star"], 54: ["qamar", "moon"],
  55: ["rahman", "rahmaan", "merciful"], 56: ["waqia", "waqiah", "inevitable"], 57: ["hadid", "iron"], 58: ["mujadila", "mujadala"], 59: ["hashr", "exile"], 60: ["mumtahana", "mumtahina"],
  61: ["saff", "ranks"], 62: ["jumua", "jumuah", "friday"], 63: ["munafiqun", "hypocrites"], 64: ["taghabun"], 65: ["talaq", "divorce"], 66: ["tahrim"], 67: ["mulk", "sovereignty", "kingdom"],
  68: ["qalam", "pen", "nun"], 69: ["haqqa", "haqqah", "reality"], 70: ["maarij", "ma'arij"], 71: ["nuh", "nooh", "noah"], 72: ["jinn"], 73: ["muzzammil", "muzammil"], 74: ["muddathir", "mudathir"],
  75: ["qiyama", "qiyamah", "resurrection"], 76: ["insan", "dahr", "man"], 77: ["mursalat"], 78: ["naba", "nabaa", "tidings"], 79: ["naziat", "nazi'at"], 80: ["abasa"], 81: ["takwir"],
  82: ["infitar"], 83: ["mutaffifin", "tatfif"], 84: ["inshiqaq"], 85: ["buruj", "burooj"], 86: ["tariq"], 87: ["ala", "a'la", "most high"], 88: ["ghashiya", "ghashiyah"], 89: ["fajr", "dawn"],
  90: ["balad", "city"], 91: ["shams", "sun"], 92: ["layl", "lail", "night"], 93: ["duha", "dhuha", "morning"], 94: ["sharh", "inshirah", "alam nashrah"], 95: ["tin", "teen", "fig"], 96: ["alaq", "iqra", "clot"],
  97: ["qadr", "power", "decree"], 98: ["bayyina", "bayyinah", "evidence"], 99: ["zalzala", "zalzalah", "zilzal", "earthquake"], 100: ["adiyat"], 101: ["qaria", "qariah", "calamity"], 102: ["takathur"],
  103: ["asr", "time"], 104: ["humaza", "humazah"], 105: ["fil", "feel", "elephant"], 106: ["quraish", "quraysh"], 107: ["maun", "ma'un"], 108: ["kawthar", "kausar"], 109: ["kafirun", "kafiroon"],
  110: ["nasr", "help"], 111: ["masad", "lahab"], 112: ["ikhlas", "sincerity", "tawhid"], 113: ["falaq", "daybreak"], 114: ["nas", "naas", "mankind"],
};

const ARTICLE = /^(al|ar|as|an|at|ad|az|ash|ath|adh|el|ال|اال)[\s-]*/;
const latin = (s: string) => s.toLowerCase().replace(/[’'`ʿʾ-]/g, "").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
const forms = (s: string): string[] => { const out = new Set<string>(); const a = /[؀-ۿ]/.test(s) ? normaliseArabic(s) : latin(s); out.add(a); out.add(a.replace(ARTICLE, "")); out.add(a.replace(/\s/g, "")); out.add(a.replace(ARTICLE, "").replace(/\s/g, "")); return [...out].filter(Boolean); };

const AR_UNITS: Record<string, number> = { "صفر": 0, "واحد": 1, "واحده": 1, "اثنان": 2, "اثنين": 2, "اثنتان": 2, "ثلاثه": 3, "ثلاث": 3, "اربعه": 4, "اربع": 4, "خمسه": 5, "خمس": 5, "سته": 6, "ست": 6, "سبعه": 7, "سبع": 7, "ثمانيه": 8, "ثماني": 8, "تسعه": 9, "تسع": 9, "عشره": 10, "عشر": 10, "احد عشر": 11, "اثنا عشر": 12, "اثني عشر": 12, "ثلاثه عشر": 13, "اربعه عشر": 14, "خمسه عشر": 15, "سته عشر": 16, "سبعه عشر": 17, "ثمانيه عشر": 18, "تسعه عشر": 19 };
const AR_TENS: Record<string, number> = { "عشرون": 20, "عشرين": 20, "ثلاثون": 30, "ثلاثين": 30, "اربعون": 40, "اربعين": 40, "خمسون": 50, "خمسين": 50, "ستون": 60, "ستين": 60, "سبعون": 70, "سبعين": 70, "ثمانون": 80, "ثمانين": 80, "تسعون": 90, "تسعين": 90 };
const AR_HUNDREDS: Record<string, number> = { "مئه": 100, "مائه": 100, "مئتان": 200, "مئتين": 200, "مائتان": 200, "مائتين": 200, "ثلاثمئه": 300, "ثلاث مئه": 300, "ثلاثمائه": 300 };
const normKeys = (m: Record<string, number>): Record<string, number> => Object.fromEntries(Object.entries(m).map(([k, v]) => [normaliseArabic(k), v]));
const N_UNITS = normKeys(AR_UNITS), N_TENS = normKeys(AR_TENS), N_HUNDREDS = normKeys(AR_HUNDREDS);
const EN_WORDS: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90, hundred: 100 };

/** Parse a spoken number in Latin digits, Arabic-Indic digits, English words or Arabic words. */
export const parseSpokenNumber = (s: string): number | null => {
  const digits = s.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d))).match(/\d{1,3}/);
  if (digits) return Number(digits[0]);
  // JS word boundaries are ASCII-only, so strip the conjunction "و" per token instead.
  const ar = normaliseArabic(s).split(" ").map((w) => (w.length > 2 && w.startsWith("و") ? w.slice(1) : w)).filter(Boolean);
  let total = 0, found = false;
  for (let i = 0; i < ar.length; i++) {
    const two = `${ar[i]} ${ar[i + 1] ?? ""}`.trim();
    if (N_UNITS[two] !== undefined) { total += N_UNITS[two]; found = true; i++; continue; }
    if (N_HUNDREDS[two] !== undefined) { total += N_HUNDREDS[two]; found = true; i++; continue; }
    const w = ar[i];
    if (N_HUNDREDS[w] !== undefined) { total += N_HUNDREDS[w]; found = true; } else if (N_TENS[w] !== undefined) { total += N_TENS[w]; found = true; } else if (N_UNITS[w] !== undefined) { total += N_UNITS[w]; found = true; }
  }
  if (found) return total;
  const en = latin(s).split(" ");
  let acc = 0; found = false;
  for (const w of en) { const n = EN_WORDS[w]; if (n === undefined) continue; found = true; if (n === 100) acc = Math.max(1, acc) * 100; else acc += n; }
  return found ? acc : null;
};

const ACTIONS: { action: VoiceAction; words: string[] }[] = [
  { action: "pause", words: ["pause", "hold", "توقف", "وقف", "ايقاف مؤقت"] },
  { action: "stop", words: ["stop", "quiet", "silence", "اوقف", "اسكت", "ايقاف"] },
  { action: "next", words: ["next", "skip", "التالي", "التاليه", "بعد"] },
  { action: "prev", words: ["previous", "back", "السابق", "السابقه", "ارجع"] },
  { action: "play", words: ["play", "open", "start", "recite", "listen", "read", "go to", "شغل", "افتح", "ابدا", "اقرا", "اسمع", "اسمعني", "اذهب", "روح", "سمعني"] },
];

/** Best surah for the transcript: exact or near (edit distance ≤ 1 for short, ≤ 2 for long) match on any name form. */
export const matchSurah = (transcript: string, surahs: VoiceSurah[]): { number: number; score: number } | null => {
  const isAr = /[؀-ۿ]/.test(transcript);
  const text = isAr ? normaliseArabic(transcript).replace(/\bسوره\b|\bسورة\b/g, " ").replace(/\s+/g, " ").trim() : latin(transcript).replace(/\b(surah|surat|sura|chapter)\b/g, " ").replace(/\s+/g, " ").trim();
  const tokens = text.split(" ").filter(Boolean);
  const windows: string[] = [];
  for (let i = 0; i < tokens.length; i++) for (let n = 1; n <= 3 && i + n <= tokens.length; n++) windows.push(tokens.slice(i, i + n).join(" "));
  let best: { number: number; score: number } | null = null;
  for (const s of surahs) {
    const names = new Set<string>();
    for (const f of [s.arabicName, s.latinName, s.translatedName ?? "", ...(ALIASES[s.number] ?? [])]) if (f) for (const x of forms(f)) names.add(x);
    for (const name of names) {
      if (name.length < 2) continue;
      for (const w of windows) {
        const ws = forms(w);
        for (const cand of ws) {
          if (cand === name) { const score = 1; if (!best || score > best.score) best = { number: s.number, score }; continue; }
          if (Math.min(cand.length, name.length) < 4) continue;
          const d = editDistance(cand, name); const allow = name.length >= 8 ? 2 : 1;
          if (d <= allow) { const score = 0.9 - d * 0.15; if (!best || score > best.score) best = { number: s.number, score }; }
        }
      }
    }
  }
  if (best) return best;
  // "surah 18" / "سورة ثمانية عشر"
  const afterWord = isAr ? transcript.match(/سور[ةه]\s+(.+)$/) : transcript.toLowerCase().match(/(?:surah|sura|surat|chapter)\s+(.+)$/);
  const n = afterWord ? parseSpokenNumber(afterWord[1].split(/\b(ayah|aya|verse|آية|آيه|الآية|الايه)\b/)[0]) : null;
  return n && n >= 1 && n <= 114 ? { number: n, score: 0.8 } : null;
};

export const parseVoiceCommand = (transcript: string, surahs: VoiceSurah[]): VoiceCommand => {
  const isAr = /[؀-ۿ]/.test(transcript);
  const norm = isAr ? normaliseArabic(transcript) : latin(transcript);
  let action: VoiceAction = "unknown";
  for (const a of ACTIONS) if (a.words.some((w) => new RegExp(`(^|\\s)${w}(\\s|$)`).test(norm))) { action = a.action; break; }
  const surah = matchSurah(transcript, surahs);
  const ayahPart = isAr ? transcript.match(/(?:الآية|الايه|آية|آيه|ايه|اية)\s*(?:رقم\s*)?(.+?)(?:\s+من\b|$)/) : transcript.toLowerCase().match(/(?:ayah|aya|verse|ayat)\s*(?:number\s*)?(.+?)(?:\s+(?:of|from|in)\b|$)/);
  const ayah = ayahPart ? parseSpokenNumber(ayahPart[1]) : null;
  if (surah && action === "unknown") action = "play";
  return { action, surah: surah?.number ?? null, ayah: ayah && ayah > 0 ? ayah : null, confidence: surah ? surah.score : action !== "unknown" ? 0.6 : 0, transcript };
};
