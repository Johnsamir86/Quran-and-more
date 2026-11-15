/** Khatmah planner: finish the Quran (604 mushaf pages, 30 ajzaʾ) in a chosen number of days. */
export const MUSHAF_PAGES = 604;
/** First page of each juz in the 604-page Madani mushaf. */
export const JUZ_START_PAGES = [1, 22, 42, 62, 82, 102, 121, 142, 162, 182, 201, 222, 242, 262, 282, 302, 322, 342, 362, 382, 402, 422, 442, 462, 482, 502, 522, 542, 562, 582];

export interface KhatmahPlan { startDay: string; days: number; startPage: number; createdAt: number }
export const KHATMAH_STORAGE_KEY = "qam.khatmah.v1";
export const KHATMAH_PRESETS = [30, 60, 90, 180, 365];

const dayNumber = (iso: string) => Math.floor(Date.UTC(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10))) / 86_400_000);
export const isoDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const juzOfPage = (page: number): number => { let j = 1; for (let i = 0; i < JUZ_START_PAGES.length; i++) if (page >= JUZ_START_PAGES[i]) j = i + 1; return j; };

/** Pages to read per day to finish on time (fractional; the UI rounds up). */
export const pagesPerDay = (plan: KhatmahPlan): number => (MUSHAF_PAGES - plan.startPage + 1) / plan.days;

export interface KhatmahStatus {
  dayIndex: number; // 0-based day of the plan, today
  targetPage: number; // page you should have reached by the end of today
  todayFrom: number; todayTo: number; // today's portion
  readPage: number; // furthest page recorded
  behindPages: number; // > 0 when behind schedule
  percent: number; // 0..100
  finished: boolean;
  daysLeft: number;
}

/** Where the plan stands today given the furthest page read so far. */
export const khatmahStatus = (plan: KhatmahPlan, readPage: number, today: string): KhatmahStatus => {
  const ppd = pagesPerDay(plan);
  const dayIndex = Math.max(0, dayNumber(today) - dayNumber(plan.startDay));
  const targetPage = Math.min(MUSHAF_PAGES, Math.floor(plan.startPage - 1 + ppd * (dayIndex + 1)));
  const read = Math.max(plan.startPage - 1, Math.min(MUSHAF_PAGES, readPage));
  // Today's portion starts where you are (so a backlog is included) and ends at the schedule target.
  const todayFrom = Math.min(MUSHAF_PAGES, Math.max(plan.startPage, read + 1));
  const todayTo = Math.max(todayFrom, targetPage);
  // Behind means short of where yesterday should have ended; today's portion is not overdue yet.
  const dueByYesterday = Math.min(MUSHAF_PAGES, Math.floor(plan.startPage - 1 + ppd * dayIndex));
  const percent = Math.round(((read - plan.startPage + 1) / (MUSHAF_PAGES - plan.startPage + 1)) * 100);
  return { dayIndex, targetPage, todayFrom, todayTo, readPage: read, behindPages: Math.max(0, dueByYesterday - read), percent: Math.max(0, Math.min(100, percent)), finished: read >= MUSHAF_PAGES, daysLeft: Math.max(0, plan.days - dayIndex) };
};

/** A plan that finishes the day before Ramadan starts, given the days until Ramadan. */
export const planToFinishBefore = (daysUntil: number, startPage = 1, today: string): KhatmahPlan => ({ startDay: today, days: Math.max(1, daysUntil), startPage, createdAt: Date.now() });
