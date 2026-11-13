"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { GAME_LABELS, bestScores, scoreAnswer, type GameKind, type GameRound } from "@qam/core";

import { useFamily } from "@/components/family/family-provider";

import { useI18n } from "@/lib/i18n";

import StudyShell from "./study-shell";
import styles from "./study.module.css";

export default function PlayPage() {
  const { locale, m, num } = useI18n();
  const t = m.play;
  const family = useFamily();
  const [scope, setScope] = useState<"all" | "juz30" | "short">("juz30");
  const [round, setRound] = useState<GameRound | null>(null);
  const [loading, setLoading] = useState(false);
  const [i, setI] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [left, setLeft] = useState(0);
  const [done, setDone] = useState(false);
  const timer = useRef<number | null>(null);

  const start = async (kind: GameKind) => {
    setLoading(true); setRound(null); setDone(false); setI(0); setScore(0); setCorrect(0); setChosen(null);
    try {
      const res = await fetch(`/api/public/v1/games/round?type=${kind}&count=8&scope=${scope}&language=${locale}&seed=${Date.now()}`);
      const json = (await res.json()) as { round: GameRound };
      setRound(json.round); setLeft(json.round.secondsPerQuestion);
    } finally { setLoading(false); }
  };
  useEffect(() => {
    if (!round || done || chosen !== null) return;
    timer.current = window.setInterval(() => setLeft((s) => { if (s <= 1) { setChosen(-1); return 0; } return s - 1; }), 1000);
    return () => { if (timer.current) window.clearInterval(timer.current); };
  }, [round, i, chosen, done]);

  const q = round?.questions[i];
  const answer = (idx: number) => {
    if (!q || chosen !== null) return;
    setChosen(idx);
    const ok = idx === q.answer;
    if (ok) { setCorrect((c) => c + 1); setScore((s) => s + scoreAnswer(true, left, round!.secondsPerQuestion)); }
  };
  const next = () => {
    if (!round) return;
    if (i + 1 >= round.questions.length) {
      setDone(true);
      if (family.profile) family.dispatch({ type: "game/score", kind: round.kind, score, correct, total: round.questions.length });
      return;
    }
    setI((x) => x + 1); setChosen(null); setLeft(round.secondsPerQuestion);
  };
  const best = bestScores(family.state).slice(0, 8);

  return (
    <StudyShell title={t.title}>
      {!round && !loading ? (<>
        <section className={styles.card}>
          <div className={styles.row} style={{ justifyContent: "space-between" }}>
            <div><div className={styles.kicker}>Quran Arena-style</div><h1 className={styles.h1}>{t.pick}</h1></div>
            <div className={styles.row}><span className={styles.muted}>{t.scope}:</span>{(["juz30", "short", "all"] as const).map((s) => <button key={s} className={`${styles.chip} ${scope === s ? styles.chipActive : ""}`} onClick={() => setScope(s)}>{t[s]}</button>)}</div>
          </div>
          <div className={styles.tiles}>
            {(Object.keys(GAME_LABELS) as GameKind[]).map((k) => <button key={k} className={styles.tile} onClick={() => start(k)}><span className={styles.tileIcon}>{GAME_LABELS[k].icon}</span><strong>{t.games[k].title}</strong><span className={styles.muted}>{t.games[k].sub}</span></button>)}
          </div>
          {!family.profile ? <p className={styles.muted}><Link href="/family">{t.noProfile}</Link></p> : null}
        </section>
        {best.length ? <section className={styles.card}><div className={styles.kicker}>{t.best}</div>{best.map((s) => { const p = family.state.profiles.find((x) => x.id === s.profileId); return <div key={s.id} className={styles.row} style={{ justifyContent: "space-between" }}><span>{(p as { avatar?: string } | undefined)?.avatar ?? "🌙"} {p?.displayName ?? "—"} · {t.games[s.kind as GameKind]?.title}</span><span className={styles.pill}>⭐ {num(s.score)} · {num(s.correct)}/{num(s.total)}</span></div>; })}</section> : null}
      </>) : null}
      {loading ? <p className={styles.muted}>{t.loading}</p> : null}

      {round && q && !done ? (
        <section className={styles.card}>
          <div className={styles.row} style={{ justifyContent: "space-between" }}>
            <span className={styles.kicker}>{t.games[round.kind].title} · {num(i + 1)} / {num(round.questions.length)}</span>
            <span className={styles.row}><span className={styles.pill}>⭐ {num(score)}</span><span className={styles.pill} style={{ background: left <= 5 ? "rgba(185,28,28,0.15)" : undefined }}>⏱ {num(left)}</span></span>
          </div>
          <div className={styles.progress}><div className={styles.progressBar} style={{ width: `${Math.round((left / round.secondsPerQuestion) * 100)}%` }} /></div>
          <p className={`${styles.arabic} ${styles.arabicBig}`} lang="ar" translate="no" style={{ fontSize: q.prompt.length > 200 ? "1.4em" : undefined }}>{q.display ?? q.prompt}</p>
          <div className={styles.options}>
            {q.options.map((o, idx) => <button key={idx} className={`${styles.option} ${/[؀-ۿ]/.test(o) && round.kind !== "guess-surah" ? styles.optionAr : ""} ${chosen === null ? "" : idx === q.answer ? styles.optionOk : chosen === idx ? styles.optionBad : ""}`} lang={/[؀-ۿ]/.test(o) ? "ar" : undefined} disabled={chosen !== null} onClick={() => answer(idx)}>{round.kind === "which-juz" ? `${t.juz} ${num(Number(o))}` : o}</button>)}
          </div>
          {chosen !== null ? <div className={styles.row}><button className={styles.btn} onClick={next}>{t.next}</button><Link className={styles.btnGhost} href={`/study/${q.verseKey}`}>{t.study} {q.verseKey}</Link></div> : null}
        </section>
      ) : null}

      {done && round ? (
        <section className={styles.card} style={{ textAlign: "center" }}>
          <div className={styles.big}>{correct === round.questions.length ? "🏆" : correct >= round.questions.length / 2 ? "🎉" : "💪"}</div>
          <h2 className={styles.h2}>{t.result}: ⭐ {num(score)}</h2>
          <p>{num(correct)} / {num(round.questions.length)} {t.correct}</p>
          <div className={styles.row} style={{ justifyContent: "center" }}><button className={styles.btn} onClick={() => start(round.kind)}>{t.again}</button><button className={styles.btnGhost} onClick={() => setRound(null)}>{t.home}</button></div>
        </section>
      ) : null}
    </StudyShell>
  );
}
