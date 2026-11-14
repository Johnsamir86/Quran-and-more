/**
 * Curated "radio" stations: continuous listening programmes built from
 * full-surah recitations. Titles are Arabic-first (the app's first learning
 * language), with English for the UI fallback.
 */
export interface Station {
  id: string;
  title: { ar: string; en: string };
  subtitle: { ar: string; en: string };
  /** Surah numbers in play order. */
  surahs: number[];
  /** Loop the station when it ends. */
  loop: boolean;
}

const range = (from: number, to: number): number[] => Array.from({ length: to - from + 1 }, (_, i) => from + i);

export const STATIONS: Station[] = [
  {
    id: "full-mushaf",
    title: { ar: "المصحف كاملًا", en: "The complete Mushaf" },
    subtitle: { ar: "من الفاتحة إلى الناس، ١١٤ سورة", en: "From Al-Fatihah to An-Nas, 114 surahs" },
    surahs: range(1, 114),
    loop: true,
  },
  {
    id: "juz-amma",
    title: { ar: "جزء عمّ", en: "Juz Amma" },
    subtitle: { ar: "من النبأ إلى الناس", en: "From An-Naba to An-Nas" },
    surahs: range(78, 114),
    loop: true,
  },
  {
    id: "evening-three",
    title: { ar: "يس والواقعة والملك", en: "Ya-Sin, Al-Waqi'ah and Al-Mulk" },
    subtitle: { ar: "ثلاث سور تُقرأ في المساء", en: "Three surahs read in the evening" },
    surahs: [36, 56, 67],
    loop: true,
  },
  {
    id: "friday-kahf",
    title: { ar: "سورة الكهف", en: "Surah Al-Kahf" },
    subtitle: { ar: "تُقرأ يوم الجمعة، على التكرار", en: "Read on Friday, on repeat" },
    surahs: [18],
    loop: true,
  },
  {
    id: "popular",
    title: { ar: "سور يكثر الاستماع إليها", en: "Most listened surahs" },
    subtitle: { ar: "الرحمن، يس، الكهف، الملك، الواقعة، البقرة", en: "Ar-Rahman, Ya-Sin, Al-Kahf, Al-Mulk, Al-Waqi'ah, Al-Baqarah" },
    surahs: [55, 36, 18, 67, 56, 2],
    loop: true,
  },
  {
    id: "ruqyah",
    title: { ar: "آيات الحفظ والرقية", en: "Protection and ruqyah" },
    subtitle: { ar: "الفاتحة، الإخلاص، الفلق، الناس", en: "Al-Fatihah, Al-Ikhlas, Al-Falaq, An-Nas" },
    surahs: [1, 112, 113, 114],
    loop: true,
  },
];

export const stationById = (id: string): Station | undefined => STATIONS.find((s) => s.id === id);
