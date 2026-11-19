/** Tasbih (dhikr counter) presets: well-known formulas with their usual counts. */
export interface TasbihPreset { id: string; ar: string; tr: string; en: string; target: number; ref?: string }
export const TASBIH_PRESETS: TasbihPreset[] = [
  { id: "subhanallah", ar: "سُبْحَانَ اللَّهِ", tr: "SubhanAllah", en: "How perfect Allah is", target: 33 },
  { id: "alhamdulillah", ar: "الْحَمْدُ لِلَّهِ", tr: "Alhamdulillah", en: "All praise is for Allah", target: 33 },
  { id: "allahuakbar", ar: "اللَّهُ أَكْبَرُ", tr: "Allahu Akbar", en: "Allah is the greatest", target: 34 },
  { id: "lailaha", ar: "لَا إِلَهَ إِلَّا اللَّهُ", tr: "La ilaha illa Allah", en: "None has the right to be worshipped except Allah", target: 100 },
  { id: "istighfar", ar: "أَسْتَغْفِرُ اللَّهَ", tr: "Astaghfirullah", en: "I seek Allah's forgiveness", target: 100 },
  { id: "salawat", ar: "اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ", tr: "Allahumma salli wa sallim ʿala nabiyyina Muhammad", en: "O Allah, send prayers and peace upon our Prophet Muhammad", target: 100 },
  { id: "hawqala", ar: "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ", tr: "La hawla wa la quwwata illa billah", en: "There is no might nor power except with Allah", target: 100 },
  { id: "subhanbihamdihi", ar: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ", tr: "SubhanAllahi wa bihamdihi", en: "How perfect Allah is, and I praise Him", target: 100, ref: "Muslim 2691" },
  { id: "tahlil-full", ar: "لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ", tr: "La ilaha illa Allahu wahdahu la sharika lah, lahul-mulku wa lahul-hamd, wa huwa ʿala kulli shayʾin qadir", en: "None has the right to be worshipped except Allah, alone, without partner; to Him belongs all sovereignty and praise, and He is over all things omnipotent", target: 100, ref: "Bukhari 3293, Muslim 2691" },
];

/** The after-prayer sequence: 33 + 33 + 34, then the tahlil once (Muslim 597). */
export const AFTER_PRAYER_SEQUENCE = ["subhanallah", "alhamdulillah", "allahuakbar"] as const;

export interface TasbihState { presetId: string; count: number; rounds: number; total: number; updatedAt: number }
export const TASBIH_STORAGE_KEY = "qam.tasbih.v1";
export const tasbihTap = (s: TasbihState, target: number): TasbihState => {
  const count = s.count + 1;
  if (count >= target) return { ...s, count: 0, rounds: s.rounds + 1, total: s.total + 1, updatedAt: Date.now() };
  return { ...s, count, total: s.total + 1, updatedAt: Date.now() };
};
