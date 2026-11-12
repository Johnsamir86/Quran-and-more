"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { AVATARS, bookmarksFor, notesFor, resolveLocale, type AgeBand, type Gender, type ProfileRole } from "@qam/core";

import { useFamily } from "./family-provider";
import styles from "./family.module.css";

const COPY = {
  ar: {
    title: "العائلة", sub: "حساب واحد للوالد، وملف لكل فرد من الطفل إلى الجد. كل ملف له خطه وحجم نصه وعلاماته وملاحظاته وتقدّمه.",
    add: "إضافة فرد", name: "الاسم", role: "الدور", gender: "الجنس", age: "الفئة العمرية", avatar: "الصورة", save: "حفظ", cancel: "إلغاء", remove: "حذف الملف",
    roles: { parent: "والد/ة", adult: "بالغ", child: "طفل", senior: "كبير السن", teacher: "معلّم" } as Record<ProfileRole, string>,
    genders: { male: "ذكر", female: "أنثى", unspecified: "غير محدد" } as Record<Gender, string>,
    ages: { "0-6": "٠–٦", "7-12": "٧–١٢", "13-17": "١٣–١٧", "18-59": "١٨–٥٩", "60+": "٦٠+" } as Record<AgeBand, string>,
    active: "الملف النشط", bookmarks: "العلامات", notes: "الملاحظات", streak: "أيام متتالية", minutes: "دقائق اليوم", continue: "تابع القراءة", none: "لا يوجد بعد",
    open: "فتح", mushaf: "المصحف", player: "المشغّل", noProfiles: "ابدأ بإضافة أول فرد من العائلة.", edit: "تعديل", femaleNote: "ستظهر القارئات للملفات الأنثوية فقط.",
    signin: "تسجيل الدخول بحساب Quran Foundation (للوالد) لمزامنة العلامات والملاحظات مع Quran.com",
  },
  en: {
    title: "Family", sub: "One parent account, one profile per family member from child to grandparent. Each profile keeps its own font, text size, bookmarks, notes and progress.",
    add: "Add member", name: "Name", role: "Role", gender: "Gender", age: "Age group", avatar: "Avatar", save: "Save", cancel: "Cancel", remove: "Remove profile",
    roles: { parent: "Parent", adult: "Adult", child: "Child", senior: "Senior", teacher: "Teacher" } as Record<ProfileRole, string>,
    genders: { male: "Male", female: "Female", unspecified: "Unspecified" } as Record<Gender, string>,
    ages: { "0-6": "0–6", "7-12": "7–12", "13-17": "13–17", "18-59": "18–59", "60+": "60+" } as Record<AgeBand, string>,
    active: "Active profile", bookmarks: "Bookmarks", notes: "Notes", streak: "Day streak", minutes: "Minutes today", continue: "Continue reading", none: "Nothing yet",
    open: "Open", mushaf: "Mushaf", player: "Player", noProfiles: "Start by adding the first family member.", edit: "Edit", femaleNote: "Female reciters are shown to female profiles only.",
    signin: "Sign in with the parent's Quran Foundation account to sync bookmarks and notes with Quran.com",
  },
} as const;

export default function FamilyPage() {
  const { state, dispatch, profile } = useFamily();
  const locale = useMemo(() => resolveLocale(typeof navigator !== "undefined" ? navigator.language : "ar"), []);
  const ar = locale === "ar";
  const t = COPY[ar ? "ar" : "en"];
  const [editing, setEditing] = useState<null | { id?: string; displayName: string; role: ProfileRole; gender: Gender; ageBand: AgeBand; avatar: string }>(null);

  const startAdd = () => setEditing({ displayName: "", role: state.profiles.length ? "child" : "parent", gender: "unspecified", ageBand: state.profiles.length ? "7-12" : "18-59", avatar: AVATARS[state.profiles.length % AVATARS.length] });
  const startEdit = () => profile && setEditing({ id: profile.id, displayName: profile.displayName, role: profile.role, gender: profile.gender, ageBand: profile.ageBand, avatar: profile.avatar ?? AVATARS[0] });
  const save = () => {
    if (!editing || !editing.displayName.trim()) return;
    if (editing.id) dispatch({ type: "profile/update", id: editing.id, patch: { displayName: editing.displayName, role: editing.role, gender: editing.gender, ageBand: editing.ageBand, avatar: editing.avatar } });
    else dispatch({ type: "profile/add", input: { displayName: editing.displayName, role: editing.role, gender: editing.gender, ageBand: editing.ageBand, locale, avatar: editing.avatar } });
    setEditing(null);
  };

  const prog = profile ? state.progress[profile.id] : undefined;
  const today = new Date().toISOString().slice(0, 10);
  const minutesToday = Math.round((prog?.days[today] ?? 0) / 60);
  const bms = profile ? bookmarksFor(state, profile.id) : [];
  const nts = profile ? notesFor(state, profile.id) : [];
  const toPlayer = (verseKey: string) => `/player?surah=${verseKey.split(":")[0]}&ayah=${verseKey.split(":")[1]}`;

  return (
    <div className={styles.root} dir={ar ? "rtl" : "ltr"}>
      <div className={styles.inner}>
        <header>
          <h1 className={styles.h1}>{t.title}</h1>
          <p className={styles.sub}>{t.sub}</p>
          <nav className={styles.nav} style={{ marginTop: 10 }}>
            <Link className={styles.btn} href="/mushaf">📖 {t.mushaf}</Link>
            <Link className={styles.btn} href="/player">▶ {t.player}</Link>
          </nav>
        </header>

        <section className={styles.grid} aria-label={t.active}>
          {state.profiles.map((p) => (
            <button key={p.id} className={`${styles.card} ${p.id === state.activeProfileId ? styles.cardActive : ""}`} onClick={() => dispatch({ type: "profile/select", id: p.id })}>
              <span className={styles.avatar} aria-hidden>{(p as { avatar?: string }).avatar ?? "🌙"}</span>
              <span className={styles.name}>{p.displayName}</span>
              <span className={styles.role}>{t.roles[p.role]} · {t.ages[p.ageBand]}</span>
            </button>
          ))}
          <button className={styles.addCard} onClick={startAdd}><span className={styles.avatar}>＋</span><span>{t.add}</span></button>
        </section>
        {!state.profiles.length && <p className={styles.sub}>{t.noProfiles}</p>}

        {editing && (
          <section className={styles.form}>
            <div className={styles.row}>
              <label className={styles.label}>{t.name}<input className={styles.input} value={editing.displayName} onChange={(e) => setEditing({ ...editing, displayName: e.target.value })} autoFocus /></label>
              <label className={styles.label}>{t.role}
                <select className={styles.input} value={editing.role} onChange={(e) => setEditing({ ...editing, role: e.target.value as ProfileRole })}>
                  {(Object.keys(t.roles) as ProfileRole[]).map((r) => <option key={r} value={r}>{t.roles[r]}</option>)}
                </select>
              </label>
              <label className={styles.label}>{t.gender}
                <select className={styles.input} value={editing.gender} onChange={(e) => setEditing({ ...editing, gender: e.target.value as Gender })}>
                  {(Object.keys(t.genders) as Gender[]).map((g) => <option key={g} value={g}>{t.genders[g]}</option>)}
                </select>
              </label>
              <label className={styles.label}>{t.age}
                <select className={styles.input} value={editing.ageBand} onChange={(e) => setEditing({ ...editing, ageBand: e.target.value as AgeBand })}>
                  {(Object.keys(t.ages) as AgeBand[]).map((a) => <option key={a} value={a}>{t.ages[a]}</option>)}
                </select>
              </label>
            </div>
            <div className={styles.label}>{t.avatar}
              <div className={styles.avatars}>{AVATARS.map((a) => <button key={a} className={`${styles.avatarBtn} ${editing.avatar === a ? styles.avatarOn : ""}`} onClick={() => setEditing({ ...editing, avatar: a })} aria-label={a}>{a}</button>)}</div>
            </div>
            <p className={styles.sub}>{t.femaleNote}</p>
            <div className={styles.actions}>
              {editing.id && <button className={styles.btnDanger} onClick={() => { dispatch({ type: "profile/remove", id: editing.id! }); setEditing(null); }}>{t.remove}</button>}
              <button className={styles.btn} onClick={() => setEditing(null)}>{t.cancel}</button>
              <button className={styles.btnPrimary} onClick={save} disabled={!editing.displayName.trim()}>{t.save}</button>
            </div>
          </section>
        )}

        {profile && !editing && (
          <>
            <section className={styles.stats}>
              <div className={styles.stat}><span className={styles.statNum}>{prog?.streak ?? 0}</span><span className={styles.statLabel}>{t.streak}</span></div>
              <div className={styles.stat}><span className={styles.statNum}>{minutesToday}</span><span className={styles.statLabel}>{t.minutes}</span></div>
              <div className={styles.stat}><span className={styles.statNum}>{bms.length}</span><span className={styles.statLabel}>{t.bookmarks}</span></div>
              <div className={styles.stat}><span className={styles.statNum}>{nts.length}</span><span className={styles.statLabel}>{t.notes}</span></div>
            </section>
            <div className={styles.actions} style={{ justifyContent: "flex-start" }}>
              {prog?.lastVerseKey && <Link className={styles.btnPrimary} href={toPlayer(prog.lastVerseKey)}>▶ {t.continue} · {prog.lastVerseKey}</Link>}
              {prog?.lastPage && <Link className={styles.btn} href={`/mushaf?page=${prog.lastPage}`}>📖 {t.mushaf} · {prog.lastPage}</Link>}
              <button className={styles.btn} onClick={startEdit}>{t.edit}</button>
            </div>

            <section>
              <h2>{t.bookmarks}</h2>
              <div className={styles.list}>
                {bms.length ? bms.map((b) => (
                  <div key={b.id} className={styles.item}>
                    <div className={styles.itemMain}><span className={styles.itemKey}>{b.verseKey}</span><span className={styles.sub}>{new Date(b.createdAt).toLocaleDateString(locale)}</span></div>
                    <span className={styles.actions}><Link className={styles.btn} href={toPlayer(b.verseKey)}>{t.open}</Link><button className={styles.btnDanger} onClick={() => dispatch({ type: "bookmark/remove", id: b.id })}>✕</button></span>
                  </div>
                )) : <p className={styles.sub}>{t.none}</p>}
              </div>
            </section>
            <section>
              <h2>{t.notes}</h2>
              <div className={styles.list}>
                {nts.length ? nts.map((n) => (
                  <div key={n.id} className={styles.item}>
                    <div className={styles.itemMain}><span className={styles.itemKey}>{n.verseKey}</span><span className={styles.itemBody}>{n.body}</span></div>
                    <span className={styles.actions}><Link className={styles.btn} href={toPlayer(n.verseKey)}>{t.open}</Link><button className={styles.btnDanger} onClick={() => dispatch({ type: "note/remove", id: n.id })}>✕</button></span>
                  </div>
                )) : <p className={styles.sub}>{t.none}</p>}
              </div>
            </section>
            <p className={styles.sub}><Link className={styles.link} href="/api/auth/start">{t.signin}</Link></p>
          </>
        )}
      </div>
    </div>
  );
}
