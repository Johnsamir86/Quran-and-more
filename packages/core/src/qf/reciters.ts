import type { Gender } from "../profiles";

/**
 * Gender of reciters in the Quran Foundation catalogue. Every reciter in the
 * official catalogue today is male. Female recitations (for female profiles
 * only) come from a separately licensed catalogue and are tagged here.
 */
export const RECITER_GENDER: Record<number, Gender> = {};

export const reciterGender = (reciterId: number): Gender => RECITER_GENDER[reciterId] ?? "male";
