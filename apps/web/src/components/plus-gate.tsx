"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { PLUS_PRICE, type PlusFeature } from "@qam/core";

import StudyShell from "@/components/study/study-shell";
import shell from "@/components/study/study.module.css";
import { useI18n } from "@/lib/i18n";
import { usePlus } from "@/lib/plus";

export function PlusCard({ feature, inline }: { feature?: PlusFeature; inline?: boolean }) {
  const { m } = useI18n();
  const t = m.plus;
  const { plus, setPlus } = usePlus();
  return (
    <div className={shell.card} style={{ borderColor: "var(--accent)" }}>
      <span className={shell.kicker}>{t.badge}</span>
      <h1 className={shell.h1}>{t.title}</h1>
      {feature ? <span className={shell.pill}>🔒 {t.features[feature]} · {t.locked}</span> : null}
      <p>{t.freeIncludes}</p>
      <p>{t.plusIncludes}</p>
      <div className={shell.row}>
        <span className={shell.chip}>{t.monthly} · ${PLUS_PRICE.monthlyUsd} {t.perMonth}</span>
        <span className={shell.chip}>{t.yearly} · ${PLUS_PRICE.yearlyUsd} {t.perYear}</span>
        <span className={shell.chip}>{t.lifetime} · ${PLUS_PRICE.lifetimeUsd} {t.once}</span>
      </div>
      <p className={shell.muted}>{t.webSoon}</p>
      <div className={shell.row}>
        <a className={shell.btn} href="/android.apk">Android</a>
        <a className={shell.btnGhost} href="/ios-simulator.zip">iOS</a>
        {!inline ? <Link className={shell.btnGhost} href="/">{t.notNow}</Link> : null}
      </div>
      <label className={shell.row} style={{ gap: 8 }}><input type="checkbox" checked={plus} onChange={(e) => setPlus(e.target.checked)} /> <span className={shell.muted}>{t.previewPlus} · {t.previewHelp}</span></label>
    </div>
  );
}

/** Children for Plus users, the paywall for everyone else (inside the study shell). */
export default function PlusGate({ feature, children }: { feature: PlusFeature; children: ReactNode }) {
  const { m } = useI18n();
  const { plus, ready } = usePlus();
  if (plus) return <>{children}</>;
  if (!ready) return null;
  return <StudyShell title={m.plus.title}><PlusCard feature={feature} /></StudyShell>;
}
