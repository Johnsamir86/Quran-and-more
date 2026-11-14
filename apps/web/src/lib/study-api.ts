import "server-only";

import { absoluteAudioUrl, splitUthmaniWords, stripHtml, type LessonAyah, type LessonWord } from "@qam/core";

import { contentGet, contentGetAll, hasQfCredentials, qfGet } from "@/lib/content";
import { listTafsirs, listTranslations, toPlayerSurah, type TafsirResource } from "@/lib/player-api";

/* ---------- Study bundle: everything about one ayah in one call ---------- */

export interface StudyWord { position: number; text: string; translation: string | null; transliteration: string | null; audioUrl: string | null }
export interface StudyTranslation { id: number; name: string; language: string; text: string }
export interface StudyHadith { collection: string; book: string | null; number: string | null; text: string; grade: string | null; url: string | null }
export interface StudyAnswer { id: string; question: string; answers: { body: string; by: string | null }[] }
export interface StudyReflection { id: string; author: string; body: string; likes: number; url: string | null; verified: boolean }
export interface StudyBundle {
  verseKey: string; chapter: { number: number; arabicName: string; latinName: string; verseCount: number }; verse: number;
  text: string; words: StudyWord[]; translations: StudyTranslation[]; tafsirs: TafsirResource[]; defaultTafsirs: number[];
  juz: number | null; page: number | null; hizb: number | null; sajdah: boolean;
  chapterInfo: { shortText: string; source: string | null } | null;
  hadith: StudyHadith[] | null; answers: StudyAnswer[] | null; reflections: StudyReflection[] | null;
  availability: { hadith: "ok" | "empty" | "unavailable"; answers: "ok" | "empty" | "unavailable"; reflections: "ok" | "empty" | "unavailable" };
  prev: string | null; next: string | null;
}

interface VerseRaw { verseKey: string; verseNumber: number; textUthmani?: string; juzNumber?: number; pageNumber?: number; hizbNumber?: number; sajdahNumber?: number | null; words?: { position: number; charTypeName?: string; textUthmani?: string; text?: string; translation?: { text?: string }; transliteration?: { text?: string }; audioUrl?: string }[]; translations?: { resourceId: number; resourceName?: string; text: string }[] }

const DEFAULT_TAFSIR_BY_LANG: Record<string, number[]> = { ar: [16, 14, 91], en: [169, 168, 817], ur: [160, 157, 159], bn: [381, 165, 164], ru: [170], ku: [804] };

export const translationIdsForLanguage = async (language: string, limit = 3): Promise<number[]> => {
  const all = await listTranslations();
  const langName = new Intl.DisplayNames(["en"], { type: "language" }).of(language.split("-")[0])?.toLowerCase();
  const preferred: Record<string, number[]> = { en: [85, 20, 149], ar: [], ur: [234, 97, 158], fr: [136, 31], tr: [77, 210], id: [33, 134], es: [83, 140], de: [27, 208], ru: [78, 79], bn: [161, 163] };
  const ids = (preferred[language] ?? []).filter((id) => all.some((t) => t.apiId === id));
  for (const t of all) if (t.apiId !== null && ids.length < limit && t.languageName.toLowerCase() === langName && !ids.includes(t.apiId)) ids.push(t.apiId);
  if (!ids.length && language !== "ar") ids.push(85);
  return ids.slice(0, limit);
};

export const loadStudy = async (verseKey: string, language: string, translationIds?: number[]): Promise<StudyBundle | null> => {
  const [c, n] = verseKey.split(":").map(Number);
  if (!c || !n) return null;
  const trIds = translationIds?.length ? translationIds : await translationIdsForLanguage(language);
  const [chapterRaw, verseRaw, tafsirs, allTr] = await Promise.all([
    contentGet(`chapters/${c}`, { language }, 24 * 3600 * 1000) as Promise<{ chapter?: { id: number; nameArabic?: string; nameSimple?: string; versesCount?: number; bismillahPre?: boolean; translatedName?: { name?: string } } }>,
    contentGet(`verses/by_key/${encodeURIComponent(verseKey)}`, { words: true, language, translations: trIds, fields: "text_uthmani,juz_number,page_number,hizb_number,sajdah_number", word_fields: "text_uthmani", translation_fields: "resource_name" }, 24 * 3600 * 1000) as Promise<{ verse?: VerseRaw }>,
    listTafsirs(),
    listTranslations(),
  ]);
  const chapter = chapterRaw.chapter; const v = verseRaw.verse;
  if (!chapter || !v) return null;
  const surah = toPlayerSurah(chapter);
  const words: StudyWord[] = (v.words ?? []).filter((w) => (w.charTypeName ?? "word") === "word").map((w) => ({ position: w.position, text: w.textUthmani ?? w.text ?? "", translation: w.translation?.text ?? null, transliteration: w.transliteration?.text ?? null, audioUrl: w.audioUrl ? absoluteAudioUrl(w.audioUrl, "word") : null }));
  const trName = new Map(allTr.map((t) => [t.apiId, t]));
  const translations: StudyTranslation[] = (v.translations ?? []).map((t) => ({ id: t.resourceId, name: t.resourceName ?? trName.get(t.resourceId)?.label ?? String(t.resourceId), language: trName.get(t.resourceId)?.languageName ?? "", text: stripHtml(t.text) }));

  // Optional Quran Foundation extras (need the gateway; prelive only covers Surah 1-2).
  const availability: StudyBundle["availability"] = { hadith: "unavailable", answers: "unavailable", reflections: "unavailable" };
  let hadith: StudyHadith[] | null = null, answers: StudyAnswer[] | null = null, reflections: StudyReflection[] | null = null, chapterInfo: StudyBundle["chapterInfo"] = null;
  const infoRaw = await contentGet(`chapters/${c}/info`, { language }, 24 * 3600 * 1000).catch(() => null) as { chapterInfo?: { shortText?: string; text?: string; source?: string } } | null;
  if (infoRaw?.chapterInfo?.shortText || infoRaw?.chapterInfo?.text) chapterInfo = { shortText: stripHtml(infoRaw.chapterInfo.shortText ?? infoRaw.chapterInfo.text ?? ""), source: infoRaw.chapterInfo.source ?? null };
  if (hasQfCredentials()) {
    await Promise.all([
      qfGet<{ hadiths?: { urn?: string; collection?: string; bookNumber?: string; hadithNumber?: string; hadith?: { lang?: string; body?: string; grades?: { grade?: string }[] }[] }[] }>("content/api/v4", `hadith_references/by_ayah/${encodeURIComponent(verseKey)}/hadiths`, { limit: 10, language }, 3600 * 1000)
        .then((r) => { const list = r.hadiths ?? []; availability.hadith = list.length ? "ok" : "empty"; hadith = list.map((h) => { const body = h.hadith?.find((x) => x.lang === language) ?? h.hadith?.find((x) => x.lang === "en") ?? h.hadith?.[0]; return { collection: h.collection ?? "", book: h.bookNumber ?? null, number: h.hadithNumber ?? null, text: stripHtml(body?.body ?? ""), grade: body?.grades?.[0]?.grade ?? null, url: h.collection && h.hadithNumber ? `https://sunnah.com/${h.collection}:${h.hadithNumber}` : null }; }); })
        .catch(() => undefined),
      qfGet<{ questions?: { id: string; body: string; answers?: { body: string; answeredBy?: string }[] }[] }>("content/api/v4", `answers/by_ayah/${encodeURIComponent(verseKey)}`, { pageSize: 10, language }, 3600 * 1000)
        .then((r) => { const list = r.questions ?? []; availability.answers = list.length ? "ok" : "empty"; answers = list.map((q) => ({ id: String(q.id), question: stripHtml(q.body), answers: (q.answers ?? []).map((a) => ({ body: stripHtml(a.body), by: a.answeredBy ?? null })) })); })
        .catch(() => undefined),
      qfGet<{ posts?: { id: number | string; body?: string; text?: string; author?: { name?: string; username?: string; verified?: boolean }; likesCount?: number; likes?: number }[]; data?: unknown[] }>("content/quran-reflect/v1", "posts/feed", { limit: 10, "filter[references][0][chapterId]": c, "filter[references][0][from]": n, "filter[references][0][to]": n }, 3600 * 1000)
        .then((r) => { const list = (r.posts ?? (r.data as typeof r.posts) ?? []); availability.reflections = list.length ? "ok" : "empty"; reflections = list.map((p) => ({ id: String(p.id), author: p.author?.name ?? p.author?.username ?? "", body: stripHtml(p.body ?? p.text ?? ""), likes: p.likesCount ?? p.likes ?? 0, url: `https://quranreflect.com/posts/${p.id}`, verified: Boolean(p.author?.verified) })); })
        .catch(() => undefined),
    ]);
  }
  const prev = n > 1 ? `${c}:${n - 1}` : c > 1 ? null : null;
  const next = n < surah.verseCount ? `${c}:${n + 1}` : c < 114 ? `${c + 1}:1` : null;
  return {
    verseKey, chapter: { number: surah.number, arabicName: surah.arabicName, latinName: surah.latinName, verseCount: surah.verseCount }, verse: n,
    text: (v.textUthmani ?? "").trim(), words: words.length ? words : splitUthmaniWords(v.textUthmani ?? "").map((w) => ({ position: w.position, text: w.text, translation: null, transliteration: null, audioUrl: null })),
    translations, tafsirs, defaultTafsirs: (DEFAULT_TAFSIR_BY_LANG[language] ?? DEFAULT_TAFSIR_BY_LANG.en).filter((id) => tafsirs.some((t) => t.id === id)),
    juz: v.juzNumber ?? null, page: v.pageNumber ?? null, hizb: v.hizbNumber ?? null, sajdah: Boolean(v.sajdahNumber),
    chapterInfo, hadith, answers, reflections, availability, prev, next,
  };
};

/* ---------- Lesson source: a surah's words with meanings ---------- */
export const loadLessonAyahs = async (chapterId: number, language: string, translationId: number | null): Promise<{ title: string; ayahs: LessonAyah[] }> => {
  const [chapterRaw, verses] = await Promise.all([
    contentGet(`chapters/${chapterId}`, { language: "ar" }, 24 * 3600 * 1000) as Promise<{ chapter?: { id: number; nameArabic?: string } }>,
    contentGetAll<VerseRaw>(`verses/by_chapter/${chapterId}`, "verses", { words: true, language, translations: translationId ?? undefined, fields: "text_uthmani", word_fields: "text_uthmani" }, 50, 24 * 3600 * 1000),
  ]);
  const ayahs: LessonAyah[] = verses.map((v) => ({
    verseKey: v.verseKey,
    translation: v.translations?.[0]?.text ? stripHtml(v.translations[0].text) : null,
    words: (v.words ?? []).filter((w) => (w.charTypeName ?? "word") === "word").map<LessonWord>((w) => ({ verseKey: v.verseKey, position: w.position, arabic: w.textUthmani ?? w.text ?? "", meaning: w.translation?.text ?? "", transliteration: w.transliteration?.text ?? null, audioUrl: w.audioUrl ? absoluteAudioUrl(w.audioUrl, "word") : null })),
  }));
  return { title: chapterRaw.chapter?.nameArabic ?? String(chapterId), ayahs };
};

/* ---------- Random ayat for games and "ayah of the day" ---------- */
export const CHAPTER_VERSE_COUNTS = [7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98, 135, 112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85, 54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52, 52, 44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15, 21, 11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6];

export const randomVerseKeys = (count: number, rnd: () => number, within?: number[]): string[] => {
  const chapters = within?.length ? within : Array.from({ length: 114 }, (_, i) => i + 1);
  const out = new Set<string>();
  let guard = 0;
  while (out.size < count && guard++ < count * 20) {
    const c = chapters[Math.floor(rnd() * chapters.length)];
    const n = 1 + Math.floor(rnd() * CHAPTER_VERSE_COUNTS[c - 1]);
    out.add(`${c}:${n}`);
  }
  return [...out];
};

export const loadVersesByKeys = async (keys: string[], translationId: number | null): Promise<{ verseKey: string; text: string; translation: string | null; juz: number | null; words: string[] }[]> => {
  const rows = await Promise.all(keys.map(async (k) => {
    try {
      const raw = (await contentGet(`verses/by_key/${encodeURIComponent(k)}`, { words: false, fields: "text_uthmani,juz_number", translations: translationId ?? undefined }, 24 * 3600 * 1000)) as { verse?: VerseRaw };
      const v = raw.verse; if (!v) return null;
      const text = (v.textUthmani ?? "").trim();
      return { verseKey: k, text, translation: v.translations?.[0]?.text ? stripHtml(v.translations[0].text) : null, juz: v.juzNumber ?? null, words: splitUthmaniWords(text).map((w) => w.text) };
    } catch { return null; }
  }));
  return rows.filter((r): r is NonNullable<typeof r> => !!r);
};
