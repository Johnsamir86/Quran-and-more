import { ADHKAR, type AdhkarCategory, type Dhikr } from "./adhkar-data";

export { ADHKAR, type AdhkarCategory, type Dhikr };

export const ADHKAR_CATEGORIES: AdhkarCategory[] = ["morning", "evening", "afterPrayer", "sleep", "waking"];

export const adhkarFor = (cat: AdhkarCategory): Dhikr[] => ADHKAR.filter((d) => d.cats.includes(cat));

/** Which set fits the hour: morning until midday, evening after ʿAsr-ish, sleep late at night. */
export const suggestedAdhkar = (hour: number): AdhkarCategory => (hour >= 4 && hour < 12 ? "morning" : hour >= 15 && hour < 21 ? "evening" : hour >= 21 || hour < 4 ? "sleep" : "afterPrayer");

/** Per-day completion state: dhikr id -> taps so far. */
export interface AdhkarDayState { day: string; counts: Record<string, number> }
export const emptyAdhkarDay = (day: string): AdhkarDayState => ({ day, counts: {} });
export const adhkarProgress = (cat: AdhkarCategory, s: AdhkarDayState): { done: number; total: number } => {
  const list = adhkarFor(cat);
  return { done: list.filter((d) => (s.counts[d.id] ?? 0) >= d.count).length, total: list.length };
};
