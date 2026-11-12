import { relations } from "drizzle-orm";
import {
  boolean, date, index, integer, jsonb, pgEnum, pgTable, primaryKey, text,
  timestamp, uniqueIndex, uuid, varchar,
} from "drizzle-orm/pg-core";

/* ------------------------------------------------------------------ */
/* Accounts and families                                               */
/* ------------------------------------------------------------------ */

export const roleEnum = pgEnum("profile_role", ["parent", "child", "adult", "senior", "teacher"]);
export const genderEnum = pgEnum("gender", ["male", "female", "unspecified"]);
export const ageBandEnum = pgEnum("age_band", ["0-6", "7-12", "13-17", "18-59", "60+"]);
export const tierEnum = pgEnum("tier", ["free", "plus", "family", "madrasah"]);

/** One row per Quran Foundation login (the parent / account owner). */
export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** `sub` claim from the Quran Foundation id_token. The only stable key. */
  qfSub: varchar("qf_sub", { length: 128 }).notNull().unique(),
  email: varchar("email", { length: 320 }),
  displayName: varchar("display_name", { length: 120 }),
  locale: varchar("locale", { length: 8 }).notNull().default("en"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const families = pgTable("families", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerAccountId: uuid("owner_account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 120 }).notNull(),
  tier: tierEnum("tier").notNull().default("free"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Sub-profiles inside a family. Children never have their own QF account. */
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  familyId: uuid("family_id").notNull().references(() => families.id, { onDelete: "cascade" }),
  /** Set when the profile is backed by its own QF account (parent, adult). */
  accountId: uuid("account_id").references(() => accounts.id, { onDelete: "set null" }),
  role: roleEnum("role").notNull(),
  displayName: varchar("display_name", { length: 120 }).notNull(),
  gender: genderEnum("gender").notNull().default("unspecified"),
  ageBand: ageBandEnum("age_band").notNull().default("18-59"),
  avatar: varchar("avatar", { length: 64 }),
  /** ProfileSettings from @qam/core */
  settings: jsonb("settings").notNull().default({}),
  /** 4-digit PIN hash for switching into parent profiles on shared devices. */
  pinHash: varchar("pin_hash", { length: 128 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("profiles_family_idx").on(t.familyId)]);

/* ------------------------------------------------------------------ */
/* Madrasah (schools) and classes                                       */
/* ------------------------------------------------------------------ */

export const madrasahs = pgTable("madrasahs", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 160 }).notNull(),
  ownerAccountId: uuid("owner_account_id").notNull().references(() => accounts.id),
  tier: tierEnum("tier").notNull().default("free"),
  locale: varchar("locale", { length: 8 }).notNull().default("ar"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const teachers = pgTable("teachers", {
  madrasahId: uuid("madrasah_id").notNull().references(() => madrasahs.id, { onDelete: "cascade" }),
  accountId: uuid("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
  isAdmin: boolean("is_admin").notNull().default(false),
}, (t) => [primaryKey({ columns: [t.madrasahId, t.accountId] })]);

export const classes = pgTable("classes", {
  id: uuid("id").primaryKey().defaultRandom(),
  madrasahId: uuid("madrasah_id").notNull().references(() => madrasahs.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 120 }).notNull(),
  teacherAccountId: uuid("teacher_account_id").references(() => accounts.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** A child profile enrolled in a class. Parents see progress through this link. */
export const enrollments = pgTable("enrollments", {
  id: uuid("id").primaryKey().defaultRandom(),
  classId: uuid("class_id").notNull().references(() => classes.id, { onDelete: "cascade" }),
  profileId: uuid("profile_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  /** Invite code the family redeemed, for audit. */
  inviteCode: varchar("invite_code", { length: 32 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("enrollments_unique").on(t.classId, t.profileId)]);

export const assignmentTypeEnum = pgEnum("assignment_type", ["new_lesson", "revision", "old_review", "qaidah"]);
export const assignmentStatusEnum = pgEnum("assignment_status", ["assigned", "submitted", "passed", "failed"]);

export const assignments = pgTable("assignments", {
  id: uuid("id").primaryKey().defaultRandom(),
  enrollmentId: uuid("enrollment_id").notNull().references(() => enrollments.id, { onDelete: "cascade" }),
  type: assignmentTypeEnum("type").notNull(),
  /** Quran range: "2:1-2:25" or page range "p3-p4" */
  rangeKey: varchar("range_key", { length: 40 }).notNull(),
  dueDate: date("due_date"),
  status: assignmentStatusEnum("status").notNull().default("assigned"),
  grade: integer("grade"),
  teacherNote: text("teacher_note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  gradedAt: timestamp("graded_at", { withTimezone: true }),
});

export const mistakeTypeEnum = pgEnum("mistake_type", ["hesitation", "wrong_word", "skipped", "tajweed", "makhraj", "madd", "other"]);

/** Word-level mistakes marked on the mushaf by a teacher or by speech alignment. */
export const mistakes = pgTable("mistakes", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  assignmentId: uuid("assignment_id").references(() => assignments.id, { onDelete: "set null" }),
  verseKey: varchar("verse_key", { length: 12 }).notNull(),
  wordPosition: integer("word_position").notNull(),
  type: mistakeTypeEnum("type").notNull(),
  source: varchar("source", { length: 16 }).notNull().default("teacher"), // teacher | speech | self
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("mistakes_profile_verse_idx").on(t.profileId, t.verseKey)]);

/* ------------------------------------------------------------------ */
/* Progress for sub-profiles (children have no QF account)             */
/* ------------------------------------------------------------------ */

export const readingLog = pgTable("reading_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  day: date("day").notNull(),
  verseKeyFrom: varchar("verse_key_from", { length: 12 }).notNull(),
  verseKeyTo: varchar("verse_key_to", { length: 12 }).notNull(),
  seconds: integer("seconds").notNull().default(0),
  mode: varchar("mode", { length: 16 }).notNull().default("read"), // read | listen | memorize | game
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("reading_log_profile_day_idx").on(t.profileId, t.day)]);

export const goals = pgTable("goals", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  /** who set it: the profile itself, a parent, or a teacher */
  setByAccountId: uuid("set_by_account_id").references(() => accounts.id),
  kind: varchar("kind", { length: 24 }).notNull(), // daily_minutes | pages_per_day | khatma_by | memorize_range
  target: jsonb("target").notNull(),
  startsOn: date("starts_on").notNull(),
  endsOn: date("ends_on"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Spaced-repetition memorisation cards (one per ayah range). */
export const memoCards = pgTable("memo_cards", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  rangeKey: varchar("range_key", { length: 40 }).notNull(),
  method: varchar("method", { length: 16 }).notNull().default("staged"), // staged | 6446 | 3x3
  stage: integer("stage").notNull().default(0),
  easeFactor: integer("ease_factor").notNull().default(250), // x100
  intervalDays: integer("interval_days").notNull().default(0),
  dueOn: date("due_on").notNull(),
  lapses: integer("lapses").notNull().default(0),
  recitedInPrayerAt: timestamp("recited_in_prayer_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("memo_cards_unique").on(t.profileId, t.rangeKey), index("memo_cards_due_idx").on(t.profileId, t.dueOn)]);

/* ------------------------------------------------------------------ */
/* Learning plans (Arabic first)                                        */
/* ------------------------------------------------------------------ */

export const plans = pgTable("plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: varchar("slug", { length: 80 }).notNull().unique(),
  locale: varchar("locale", { length: 8 }).notNull().default("ar"),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  audience: varchar("audience", { length: 16 }).notNull().default("all"), // kids | teens | adults | seniors | all
  days: integer("days").notNull(),
  /** Scholar review state. Only reviewed plans are shown in production. */
  reviewStatus: varchar("review_status", { length: 16 }).notNull().default("draft"), // draft | in_review | approved
  reviewedBy: varchar("reviewed_by", { length: 120 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const planLessons = pgTable("plan_lessons", {
  id: uuid("id").primaryKey().defaultRandom(),
  planId: uuid("plan_id").notNull().references(() => plans.id, { onDelete: "cascade" }),
  dayNumber: integer("day_number").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  /** verse keys covered, e.g. ["2:255"] or a range "67:1-67:30" */
  verseKeys: jsonb("verse_keys").notNull().default([]),
  /** Lesson body in Markdown. Quranic text is never stored here; it is pulled live by verse key. */
  body: text("body").notNull(),
  /** Citations: tafsir slug + verse key, hadith reference, Answers id. */
  sources: jsonb("sources").notNull().default([]),
  activity: jsonb("activity"), // quiz / reflection prompt / memorise / listen
}, (t) => [uniqueIndex("plan_lessons_unique").on(t.planId, t.dayNumber)]);

export const planEnrollments = pgTable("plan_enrollments", {
  id: uuid("id").primaryKey().defaultRandom(),
  planId: uuid("plan_id").notNull().references(() => plans.id, { onDelete: "cascade" }),
  profileId: uuid("profile_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  currentDay: integer("current_day").notNull().default(1),
  completedDays: jsonb("completed_days").notNull().default([]),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
}, (t) => [uniqueIndex("plan_enrollments_unique").on(t.planId, t.profileId)]);

/* ------------------------------------------------------------------ */
/* Games / entertaining tab                                             */
/* ------------------------------------------------------------------ */

export const gameScores = pgTable("game_scores", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  game: varchar("game", { length: 32 }).notNull(), // next_ayah | blank_ayah | word_match | trivia | ...
  score: integer("score").notNull(),
  accuracy: integer("accuracy"), // percent
  durationSec: integer("duration_sec"),
  playedAt: timestamp("played_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("game_scores_profile_idx").on(t.profileId, t.game)]);

/* ------------------------------------------------------------------ */
/* Subscriptions, AI jobs, public API keys                              */
/* ------------------------------------------------------------------ */

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  accountId: uuid("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
  tier: tierEnum("tier").notNull(),
  provider: varchar("provider", { length: 16 }).notNull(), // stripe | apple | google | manual
  providerRef: varchar("provider_ref", { length: 160 }),
  status: varchar("status", { length: 16 }).notNull().default("active"), // active | past_due | cancelled | expired
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("subscriptions_account_idx").on(t.accountId)]);

export const aiJobs = pgTable("ai_jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  accountId: uuid("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
  profileId: uuid("profile_id").references(() => profiles.id, { onDelete: "set null" }),
  kind: varchar("kind", { length: 32 }).notNull(), // verse_image | verse_video | ask | caption_align | speech_align
  provider: varchar("provider", { length: 32 }).notNull(),
  model: varchar("model", { length: 80 }).notNull(),
  restrictedMode: boolean("restricted_mode").notNull().default(true),
  input: jsonb("input").notNull(),
  output: jsonb("output"),
  /** Result of assertVerbatimQuran: passed | failed | n/a */
  verbatimCheck: varchar("verbatim_check", { length: 8 }).notNull().default("n/a"),
  status: varchar("status", { length: 16 }).notNull().default("queued"),
  error: text("error"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
});

/** API keys for third-party integrations (e.g. VOD platforms). */
export const apiKeys = pgTable("api_keys", {
  id: uuid("id").primaryKey().defaultRandom(),
  accountId: uuid("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 120 }).notNull(),
  /** sha256 of the secret; the plain key is shown once. */
  keyHash: varchar("key_hash", { length: 64 }).notNull().unique(),
  prefix: varchar("prefix", { length: 12 }).notNull(),
  scopes: jsonb("scopes").notNull().default(["content:read"]),
  rateLimitPerMinute: integer("rate_limit_per_minute").notNull().default(600),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const webhooks = pgTable("webhooks", {
  id: uuid("id").primaryKey().defaultRandom(),
  apiKeyId: uuid("api_key_id").notNull().references(() => apiKeys.id, { onDelete: "cascade" }),
  url: varchar("url", { length: 1024 }).notNull(),
  events: jsonb("events").notNull().default([]),
  secret: varchar("secret", { length: 128 }).notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ------------------------------------------------------------------ */
/* Relations                                                            */
/* ------------------------------------------------------------------ */

export const accountsRelations = relations(accounts, ({ many }) => ({
  families: many(families),
  subscriptions: many(subscriptions),
  apiKeys: many(apiKeys),
}));

export const familiesRelations = relations(families, ({ one, many }) => ({
  owner: one(accounts, { fields: [families.ownerAccountId], references: [accounts.id] }),
  profiles: many(profiles),
}));

export const profilesRelations = relations(profiles, ({ one, many }) => ({
  family: one(families, { fields: [profiles.familyId], references: [families.id] }),
  enrollments: many(enrollments),
  goals: many(goals),
  memoCards: many(memoCards),
}));

export const madrasahsRelations = relations(madrasahs, ({ many }) => ({
  teachers: many(teachers),
  classes: many(classes),
}));

export const classesRelations = relations(classes, ({ one, many }) => ({
  madrasah: one(madrasahs, { fields: [classes.madrasahId], references: [madrasahs.id] }),
  enrollments: many(enrollments),
}));

export const enrollmentsRelations = relations(enrollments, ({ one, many }) => ({
  class: one(classes, { fields: [enrollments.classId], references: [classes.id] }),
  profile: one(profiles, { fields: [enrollments.profileId], references: [profiles.id] }),
  assignments: many(assignments),
}));

export const plansRelations = relations(plans, ({ many }) => ({ lessons: many(planLessons) }));
