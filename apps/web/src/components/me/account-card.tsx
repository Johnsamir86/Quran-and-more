"use client";

import { useEffect, useState } from "react";

import { useI18n } from "@/lib/i18n";
import { AUTH_ENABLED, supabase } from "@/lib/supabase";

import shell from "../study/study.module.css";

/** Account section of /me: Apple, Google, email magic link through Supabase; Quran.com through the existing OAuth route. */
export default function AccountCard() {
  const { m } = useI18n();
  const t = m.settings;
  const [email, setEmail] = useState("");
  const [user, setUser] = useState<{ email: string | null } | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    const sb = supabase();
    if (!sb) return;
    sb.auth.getUser().then(({ data }) => setUser(data.user ? { email: data.user.email ?? null } : null));
    const { data: sub } = sb.auth.onAuthStateChange((_e, session) => setUser(session?.user ? { email: session.user.email ?? null } : null));
    return () => sub.subscription.unsubscribe();
  }, []);
  const oauth = async (provider: "apple" | "google") => {
    const sb = supabase(); if (!sb) return;
    const { error } = await sb.auth.signInWithOAuth({ provider, options: { redirectTo: `${window.location.origin}/auth/callback` } });
    if (error) setMsg(m.common.unavailable);
  };
  const magic = async () => {
    const sb = supabase(); if (!sb || !email.includes("@")) return;
    const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/auth/callback` } });
    setMsg(error ? m.common.unavailable : t.magicLinkSent);
  };
  return (
    <section className={shell.card}>
      <div className={shell.kicker}>{t.account}</div>
      {user ? (
        <div className={shell.row}><span>{t.signedInAs} {user.email}</span><button className={shell.chip} onClick={() => supabase()?.auth.signOut()}>{t.signOut}</button></div>
      ) : (
        <>
          <p className={shell.muted}>{AUTH_ENABLED ? t.signInHelp : t.signInUnavailable}</p>
          <div className={shell.row}>
            <button className={shell.btn} disabled={!AUTH_ENABLED} onClick={() => oauth("apple")}> {t.signInApple}</button>
            <button className={shell.chip} disabled={!AUTH_ENABLED} onClick={() => oauth("google")}>{t.signInGoogle}</button>
            <a className={shell.chip} href="/api/auth/start">{t.signInQuran}</a>
            <span className={shell.pill}>{t.guest}</span>
          </div>
          <div className={shell.row}>
            <input className={shell.input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t.emailPlaceholder} disabled={!AUTH_ENABLED} autoComplete="email" />
            <button className={shell.chip} disabled={!AUTH_ENABLED || !email.includes("@")} onClick={magic}>{t.signInEmail}</button>
          </div>
          {msg ? <p className={shell.muted}>{msg}</p> : null}
        </>
      )}
    </section>
  );
}
