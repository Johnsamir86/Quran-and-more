import type { PlayerReciter } from "./player";

/**
 * Reciters that are not in the Quran Foundation API catalogue but whose complete
 * surah-by-surah recordings are published by open archives: the foundation's own
 * quranicaudio.com and mp3quran.net. They play as one file per surah; verse and
 * word timestamps come from our forced-alignment pipeline (tools/align) and ship
 * in apps/web/data/timings/<id>/<surah>.json.
 */
export interface ExtraReciter extends PlayerReciter {
  /** Folder holding 001.mp3 .. 114.mp3 */
  audioBase: string;
  source: "quranicaudio" | "mp3quran";
}

const QA = "https://download.quranicaudio.com/quran/";
const MQ = "https://cdn.mp3quran.net/audio/";

export const EXTRA_RECITERS: ExtraReciter[] = [
  { id: "x-ajmi", chapterReciterId: null, recitationId: null, arabicName: "أحمد بن علي العجمي", latinName: "Ahmed ibn Ali al-Ajmi", riwayah: "Hafs", style: "murattal", imageUrl: null, gender: "male", audioBase: `${QA}ahmed_ibn_3ali_al-3ajamy/`, source: "quranicaudio" },
  { id: "x-muaiqly", chapterReciterId: null, recitationId: null, arabicName: "ماهر المعيقلي", latinName: "Maher al-Muaiqly", riwayah: "Hafs", style: "murattal", imageUrl: null, gender: "male", audioBase: `${QA}maher_almu3aiqly/year1440/`, source: "quranicaudio" },
  { id: "x-kurdi", chapterReciterId: null, recitationId: null, arabicName: "رعد محمد الكردي", latinName: "Raad Mohammad al-Kurdi", riwayah: "Hafs", style: "murattal", imageUrl: null, gender: "male", audioBase: `${QA}raad_mohammad_al_kurdi/mp3/`, source: "quranicaudio" },
  { id: "x-banna", chapterReciterId: null, recitationId: null, arabicName: "محمود علي البنا", latinName: "Mahmoud Ali al-Banna", riwayah: "Hafs", style: "murattal", imageUrl: null, gender: "male", audioBase: `${MQ}mahmoud-banna/r1/`, source: "mp3quran" },
  { id: "x-banna-mujawwad", chapterReciterId: null, recitationId: null, arabicName: "محمود علي البنا (مجوّد)", latinName: "Mahmoud Ali al-Banna (Mujawwad)", riwayah: "Hafs", style: "mujawwad", imageUrl: null, gender: "male", audioBase: `${MQ}mahmoud-banna/r2/`, source: "mp3quran" },
];

export const isExtraReciterId = (id: string): boolean => id.startsWith("x-");
export const extraReciterById = (id: string): ExtraReciter | undefined => EXTRA_RECITERS.find((r) => r.id === id);
/** Full-surah file URL for an extra reciter. */
export const extraChapterAudioUrl = (r: Pick<ExtraReciter, "audioBase">, chapter: number): string =>
  `${r.audioBase}${String(chapter).padStart(3, "0")}.mp3`;
