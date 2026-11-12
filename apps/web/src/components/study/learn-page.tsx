"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { checkOrder, learnFor, levelForXp, type Exercise, type Lesson, type LessonAyah } from "@qam/core";

import { useFamily } from "@/components/family/family-provider";

import StudyShell, { useToday, useUiLocale } from "./study-shell";
import styles from "./study.module.css";

interface Surah { id: number; nameArabic: string; nameSimple: string; translatedName: string; versesCount: number }

const COPY = {
  ar: { title: "تعلّم", pick: "اختر سورة لتبدأ", start: "ابدأ الدرس", xp: "نقاط", level: "المستوى", streak: "أيام متتالية", check: "تحقق", next: "التالي", correct: "صحيح!", wrong: "ليس صحيحًا. الإجابة:", done: "أحسنت! أكملت الدرس", earned: "حصلت على", again: "درس جديد", meaning: "ما معنى هذه الكلمة؟", word: "أي كلمة تعني:", hidden: "أكمل الآية بالكلمة الناقصة", order: "رتّب كلمات الآية", reset: "إعادة", loading: "جارٍ إعداد الدرس…", noProfile: "اختر ملفًا من صفحة العائلة لحفظ تقدّمك", lessonsDone: "دروس مكتملة", juz30: "جزء عمّ", all: "كل السور", listen: "استمع", skip: "تخطَّ", short: "سور قصيرة", stage: "المرحلة" },
  en: { title: "Learn", pick: "Pick a surah to start", start: "Start lesson", xp: "XP", level: "Level", streak: "day streak", check: "Check", next: "Next", correct: "Correct!", wrong: "Not quite. The answer:", done: "Well done! Lesson complete", earned: "You earned", again: "New lesson", meaning: "What does this word mean?", word: "Which word means:", hidden: "Complete the ayah with the missing word", order: "Put the words of the ayah in order", reset: "Reset", loading: "Preparing the lesson…", noProfile: "Choose a profile on the Family page to save your progress", lessonsDone: "lessons done", juz30: "Juz Amma", all: "All surahs", listen: "Listen", skip: "Skip", short: "Short surahs", stage: "Stage" },
};

export default function LearnPage() {
  const locale = useUiLocale();
  const ar = locale === "ar";
  const t = ar ? COPY.ar : COPY.en;
  const family = useFamily();
  const today = useToday();
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [filter, setFilter] = useState<"juz30" | "short" | "all">("juz30");
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [ayahs, setAyahs] = useState<LessonAyah[]>([]);
  const [loading, setLoading] = useState(false);
  const [idx, setIdx] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [orderPick, setOrderPick] = useState<number[]>([]);
  const [checked, setChecked] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => { fetch(`/api/public/v1/chapters?language=${locale}`).then((r) => r.json()).then((j: { chapters: Surah[] }) => setSurahs(j.chapters ?? [])).catch(() => undefined); }, [locale]);
  const progress = family.profile ? learnFor(family.state, family.profile.id) : null;
  const lvl = levelForXp(progress?.xp ?? 0);
  const visible = useMemo(() => surahs.filter((s) => filter === "all" ? true : filter === "juz30" ? s.id >= 78 : s.versesCount <= 30), [surahs, filter]);

  const startLesson = async (chapterId: number) => {
    setLoading(true); setLesson(null); setFinished(false); setIdx(0); setScore(0); setChosen(null); setChecked(null); setOrderPick([]);
    try {
      const res = await fetch(`/api/public/v1/learn/lesson/${chapterId}?language=${locale}&size=10&seed=${today}`);
      const json = (await res.json()) as { lesson: Lesson; ayahs: LessonAyah[] };
      setLesson(json.lesson); setAyahs(json.ayahs);
    } finally { setLoading(false); }
  };
  const ex: Exercise | undefined = lesson?.exercises[idx];
  const play = (url: string | null) => { if (!url) return; audioRef.current ??= new Audio(); audioRef.current.src = url; void audioRef.current.play().catch(() => undefined); };

  const check = () => {
    if (!ex) return;
    let ok = false;
    if (ex.kind === "order") ok = checkOrder(ex, orderPick);
    else ok = chosen === ex.answer;
    setChecked(ok);
    if (ok) setScore((s) => s + 10);
  };
  const next = () => {
    if (!lesson) return;
    if (idx + 1 >= lesson.exercises.length) {
      setFinished(true);
      if (family.profile) family.dispatch({ type: "learn/complete", lessonId: lesson.id, xp: score + (checked ? 0 : 0), day: today });
      return;
    }
    setIdx((i) => i + 1); setChosen(null); setChecked(null); setOrderPick([]);
  };
  const answerText = (e: Exercise): string => e.kind === "meaning" ? e.options[e.answer] : e.kind === "word" ? e.options[e.answer].arabic : e.kind === "hidden" ? e.options[e.answer] : e.ayah.words.map((w) => w.arabic).join(" ");
  const optionClass = (i: number, e: Exercise) => `${styles.option} ${checked === null ? (chosen === i ? styles.chipActive : "") : i === (e.kind === "order" ? -1 : e.answer) ? styles.optionOk : chosen === i ? styles.optionBad : ""}`;

  return (
    <StudyShell title={t.title}>
      <section className={styles.card}>
        <div className={styles.row} style={{ justifyContent: "space-between" }}>
          <div><div className={styles.kicker}>Quranlingo-style</div><h1 className={styles.h1}>{t.title}</h1></div>
          <div className={styles.row}>
            <span className={styles.pill}>⭐ {progress?.xp ?? 0} {t.xp}</span>
            <span className={styles.pill}>🏅 {t.level} {lvl.level}</span>
            <span className={styles.pill}>🔥 {progress?.streak ?? 0} {t.streak}</span>
            <span className={styles.pill}>✅ {progress?.lessonsDone.length ?? 0} {t.lessonsDone}</span>
          </div>
        </div>
        <div className={styles.progress}><div className={styles.progressBar} style={{ width: `${Math.round(lvl.progress * 100)}%` }} /></div>
        {!family.profile ? <p className={styles.muted}><Link href="/family">{t.noProfile}</Link></p> : null}
      </section>

      {!lesson && !loading ? (
        <section className={styles.card}>
          <div className={styles.row} style={{ justifyContent: "space-between" }}>
            <div className={styles.kicker}>{t.pick}</div>
            <div className={styles.row}>{(["juz30", "short", "all"] as const).map((f) => <button key={f} className={`${styles.chip} ${filter === f ? styles.chipActive : ""}`} onClick={() => setFilter(f)}>{t[f === "juz30" ? "juz30" : f === "short" ? "short" : "all"]}</button>)}</div>
          </div>
          <div className={styles.tiles}>
            {visible.map((s, i) => { const done = progress?.lessonsDone.some((id) => id.startsWith(`${s.id}:`)); return (
              <button key={s.id} className={styles.tile} onClick={() => startLesson(s.id)}>
                <span className={styles.row} style={{ justifyContent: "space-between" }}><span className={styles.pill}>{t.stage} {i + 1}</span>{done ? <span>✅</span> : null}</span>
                <span className={styles.wordAr} lang="ar">{s.nameArabic}</span>
                <span className={styles.muted}>{s.translatedName || s.nameSimple} · {s.versesCount}</span>
              </button>
            ); })}
          </div>
        </section>
      ) : null}
      {loading ? <p className={styles.muted}>{t.loading}</p> : null}

      {lesson && ex && !finished ? (
        <section className={styles.card}>
          <div className={styles.row} style={{ justifyContent: "space-between" }}>
            <span className={styles.kicker}>{lesson.title} · {idx + 1} / {lesson.exercises.length}</span>
            <span className={styles.pill}>⭐ {score}</span>
          </div>
          <div className={styles.progress}><div className={styles.progressBar} style={{ width: `${Math.round((idx / lesson.exercises.length) * 100)}%` }} /></div>

          {ex.kind === "meaning" ? (<>
            <h2 className={styles.h2}>{t.meaning}</h2>
            <p className={`${styles.arabic} ${styles.arabicBig}`} lang="ar" translate="no" onClick={() => play(ex.prompt.audioUrl)} style={{ cursor: ex.prompt.audioUrl ? "pointer" : "default" }}>{ex.prompt.arabic} {ex.prompt.audioUrl ? <span style={{ fontSize: "0.4em" }}>🔊</span> : null}</p>
            {ex.prompt.transliteration ? <p className={styles.muted} style={{ textAlign: "center" }}><em>{ex.prompt.transliteration}</em></p> : null}
            <div className={styles.options}>{ex.options.map((o, i) => <button key={i} className={optionClass(i, ex)} disabled={checked !== null} onClick={() => setChosen(i)}>{o}</button>)}</div>
          </>) : null}

          {ex.kind === "word" ? (<>
            <h2 className={styles.h2}>{t.word} <strong>{ex.prompt}</strong></h2>
            <div className={styles.options}>{ex.options.map((o, i) => <button key={i} className={`${optionClass(i, ex)} ${styles.optionAr}`} lang="ar" disabled={checked !== null} onClick={() => { setChosen(i); play(o.audioUrl); }}>{o.arabic}</button>)}</div>
          </>) : null}

          {ex.kind === "hidden" ? (<>
            <h2 className={styles.h2}>{t.hidden}</h2>
            <p className={styles.arabic} lang="ar" translate="no" style={{ textAlign: "center" }}>{ex.ayah.words.map((w) => (w.position === ex.hiddenPosition ? (checked !== null ? <mark key={w.position} className={styles.hl}>{w.arabic}</mark> : <span key={w.position} style={{ borderBottom: "2px solid var(--accent)", minWidth: 60, display: "inline-block" }}> ____ </span>) : <span key={w.position}>{w.arabic} </span>))}</p>
            {ex.ayah.translation ? <p className={styles.translation} style={{ textAlign: "center" }}>{ex.ayah.translation}</p> : null}
            <div className={styles.options}>{ex.options.map((o, i) => <button key={i} className={`${optionClass(i, ex)} ${styles.optionAr}`} lang="ar" disabled={checked !== null} onClick={() => setChosen(i)}>{o}</button>)}</div>
          </>) : null}

          {ex.kind === "order" ? (<>
            <h2 className={styles.h2}>{t.order}</h2>
            <p className={styles.arabic} lang="ar" translate="no" style={{ textAlign: "center", minHeight: "2.2em", border: "1px dashed var(--line)", borderRadius: 12, padding: 8 }}>{orderPick.map((i) => ex.ayah.words[i].arabic).join(" ")}</p>
            <div className={styles.words} style={{ justifyContent: "center" }}>
              {ex.shuffled.filter((i) => !orderPick.includes(i)).map((i) => <button key={i} className={styles.word} onClick={() => setOrderPick((p) => [...p, i])} disabled={checked !== null}><span className={styles.wordAr} lang="ar">{ex.ayah.words[i].arabic}</span></button>)}
            </div>
            <div className={styles.row}><button className={styles.btnGhost} onClick={() => setOrderPick([])} disabled={checked !== null}>{t.reset}</button><Link className={styles.btnGhost} href={`/study/${ex.ayah.verseKey}`}>{ex.ayah.verseKey}</Link></div>
          </>) : null}

          {checked === null ? (
            <div className={styles.row}><button className={styles.btn} onClick={check} disabled={ex.kind === "order" ? orderPick.length !== ex.ayah.words.length : chosen === null}>{t.check}</button><button className={styles.btnGhost} onClick={next}>{t.skip}</button></div>
          ) : (
            <div className={styles.card} style={{ background: checked ? "rgba(29,158,117,0.1)" : "rgba(185,28,28,0.08)" }}>
              <strong>{checked ? `✅ ${t.correct}` : `❌ ${t.wrong}`}</strong>
              {!checked ? <p className={styles.arabic} lang="ar" style={{ fontSize: "1.3em", textAlign: "center" }}>{answerText(ex)}</p> : null}
              <button className={styles.btn} onClick={next}>{t.next}</button>
            </div>
          )}
        </section>
      ) : null}

      {finished && lesson ? (
        <section className={styles.card} style={{ textAlign: "center" }}>
          <div className={styles.big}>🎉</div>
          <h2 className={styles.h2}>{t.done}: {lesson.title}</h2>
          <p>{t.earned} <strong>{score}</strong> {t.xp}</p>
          <div className={styles.row} style={{ justifyContent: "center" }}>
            <button className={styles.btn} onClick={() => startLesson(lesson.chapterId)}>{t.again}</button>
            <button className={styles.btnGhost} onClick={() => setLesson(null)}>{t.pick}</button>
            <Link className={styles.btnGhost} href={`/player?surah=${lesson.chapterId}`}>▶ {t.listen}</Link>
          </div>
          <p className={styles.muted}>{ayahs.length} {ar ? "آيات في هذه السورة" : "ayat in this surah"}</p>
        </section>
      ) : null}
    </StudyShell>
  );
}
