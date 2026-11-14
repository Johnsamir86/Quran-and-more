/**
 * Content review state shown by the Sources badge. Empty until a reviewer has
 * gone through the app's tafsir/translation selections and the AI guardrails;
 * see docs/CONTENT-REVIEW.md for the process.
 */
export interface Reviewer { name: string; credential: string; reviewedOn: string }
export const REVIEWERS: Reviewer[] = [];
export const reviewStatus = (): { reviewed: boolean; latest: Reviewer | null } => ({ reviewed: REVIEWERS.length > 0, latest: REVIEWERS[REVIEWERS.length - 1] ?? null });
