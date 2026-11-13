import type { PartialMessages } from "./en";

export const he: PartialMessages = {
  common: {
    appName: "קוראן ועוד", loading: "טוען…", close: "סגירה", retry: "נסו שוב", next: "הבא", prev: "הקודם", save: "שמירה", cancel: "ביטול", remove: "הסרה", none: "אין", open: "פתיחה", share: "שיתוף", copy: "העתקה", copied: "הועתק", search: "חיפוש",
    more: "עוד", back: "חזרה", language: "שפה", uiLanguage: "שפת הממשק", of: "מתוך", ayah: "פסוק", ayat: "פסוקים", surah: "סורה", juz: "ג'וז", page: "עמוד", hizb: "חיזב", sajdah: "סג'דה", listen: "האזנה", study: "לימוד", bookmark: "סימנייה",
    bookmarked: "נשמר", notes: "הערות", family: "משפחה", player: "נגן", mushaf: "מוסחף", settings: "הגדרות", unavailable: "לא זמין", today: "היום", tomorrow: "מחר", days: "ימים", minutes: "דק'", done: "בוצע", start: "התחלה", again: "שוב",
    poweredBy: "מופעל על ידי ה-API של Quran Foundation", privacy: "פרטיות", terms: "תנאים", offline: "לא ניתן להגיע לשירות התוכן. בדקו את החיבור ונסו שוב.", noProfile: "בחרו תחילה פרופיל בעמוד המשפחה",
    on: "פועל", off: "כבוי", enable: "הפעלה", disable: "כיבוי", chooseLanguage: "בחרו את שפת הממשק",
  },
  nav: { home: "בית", search: "חיפוש", learn: "לימוד", hifz: "שינון", play: "משחק", ask: "שאלה", player: "נגן", mushaf: "מוסחף", family: "משפחה", azan: "אד'אן", story: "פסוק היום" },
  home: {
    kicker: "הקוראן הנשגב", title: "קוראן ועוד", sub: "חוויית קוראן אחת לכל המשפחה: קריאה רציפה עם סנכרון מילים, המוסחף בכתב הרשמי, תפסיר ותרגומים בכל שפה, ופרופיל לכל בן משפחה.",
    startListening: "התחילו להאזין", openMushaf: "פתחו את המוסחף",
    tiles: {
      player: { title: "נגן", sub: "האזינו, קראו, תרגמו ולמדו תפסיר במסך אחד, עם כל קורא" },
      mushaf: { title: "מוסחף", sub: "עמוד אחר עמוד בגופנים הרשמיים ובמוסחף התג'ויד" },
      family: { title: "משפחה", sub: "פרופיל לכל בן משפחה, מילד ועד סב וסבתא" },
      search: { title: "חיפוש", sub: "מצאו כל מילה, פסוק או סורה בכל הקוראן" },
      study: { title: "לימוד", sub: "מילה במילה, תרגומים ועד שלושה תפסירים זה לצד זה" },
      learn: { title: "לימוד", sub: "שיעורי אוצר מילים בסגנון Quranlingo עם נקודות ניסיון ורצפים" },
      hifz: { title: "שינון", sub: "הסתירו, היזכרו ודרגו את עצמכם, עם חזרה מרווחת ובדיקה במיקרופון" },
      play: { title: "משחק", sub: "איזו סורה? הפסוק הבא? המילה החסרה? איזה ג'וז?" },
      ask: { title: "שאלה", sub: "תשובות רק מפסוקים ומתפסיר, מצוטטות מילה במילה, ממתינות לסקירת חכמים" },
      azan: { title: "אד'אן", sub: "זמני תפילה לעירכם, האד'אן בקול שתבחרו, תזכורת לכל תפילה" },
      story: { title: "פסוק היום", sub: "פסוק אחד ביום במסך מלא, עם משמעותו ורגע של התבוננות" },
      kahf: { title: "סורת אל-כהף", sub: "נקראת ביום שישי" },
    },
  },
  player: {
    kicker: "הקוראן הנשגב", title: "הקוראן הנשגב", surahs: "סורות", reciter: "קורא", translation: "תרגום", tafsir: "תפסיר", settings: "הגדרות", stations: "רדיו", play: "נגן", pause: "השהיה", nextAyah: "הפסוק הבא", prevAyah: "הפסוק הקודם", nextSurah: "הסורה הבאה",
    restart: "מההתחלה", retry: "נסו שוב", close: "סגירה", none: "טקסט ערבי בלבד", textSize: "גודל טקסט", autoAdvance: "מעבר אוטומטי לסורה הבאה", motion: "גלילה אוטומטית ותנועה", small: "קטן", medium: "בינוני", large: "גדול", ayah: "פסוק", of: "מתוך", basmala: "בסמלה",
    basmalaNote: "הבסמלה אינה פסוק בסורה זו, ולכן אין כאן תפסיר.", loading: "טוען…", offline: "לא ניתן להגיע לשירות התוכן. בדקו את החיבור ונסו שוב. ההגדרות שלכם נשמרו.", unavailable: "לא זמין", listenWith: "האזנה בקולו של", riwayah: "ריוואיה",
    allLanguages: "כל השפות", search: "חפשו סורה או קורא…", ended: "הסורה הושלמה", playingStation: "מתנגן כעת", gapless: "קריאה רציפה עם סנכרון מילים", perAyah: "קריאה פסוק אחר פסוק", repeat: "חזרה", repeatOff: "כבוי", repeatAyah: "חזרה על כל פסוק", repeatRange: "חזרה על טווח",
    repeatSurah: "חזרה על הסורה", times: "פעמים", from: "מפסוק", to: "עד פסוק", pauseBetween: "השהיה אחרי כל פסוק (שניות)", speed: "מהירות", sleep: "טיימר שינה", off: "כבוי", minutes: "דק'", wordByWord: "הקישו על מילה למשמעותה", styleMurattal: "מורתל", styleMujawwad: "מוג'ווד",
    styleMuallim: "מועלים", gaplessOnly: "רציף", ayahOnly: "פסוק אחר פסוק", both: "רציף + פסוק אחר פסוק", noSync: "סורה שלמה · טרם סונכרנה", noSyncShort: "סורה שלמה · סנכרון מילים אוטומטי", share: "שיתוף", copied: "הקישור הועתק", remaining: "נותרו", wallpaper: "רקע",
    autoNature: "טבע, משתנה עם הסורה", autoArt: "אמנות אסלאמית, משתנה עם הסורה", autoLive: "חי, משתנה עם הסורה", plainBg: "ללא רקע", fixedBg: "רקע קבוע", internetBg: "תמונות מהאינטרנט (Pexels)", internetOff: "הוסיפו מפתח Pexels בהגדרות כדי להציג תמונות מהאינטרנט",
    focusView: "מסך אחד", listView: "רשימה", language: "שפת הממשק", wbwLanguage: "שפת משמעות המילים", tafsirPick: "בחירת תפסיר", nextUp: "הבא", credit: "צילום", bookmark: "סימנייה", bookmarked: "נשמר", notes: "ההערות שלי", noteHint: "כתבו את ההתבוננות או ההערה שלכם על פסוק זה…",
    saveNote: "שמירת הערה", deleteNote: "מחיקה", family: "משפחה", noProfile: "בחרו פרופיל בעמוד המשפחה כדי לשמור סימניות והערות", library: "שמורים", repeatAyahShort: "חזרה",
  },
  mushaf: { title: "מוסחף", surah: "סורה", juz: "ג'וז", player: "נגן", family: "משפחה", tryAgain: "נסו שוב", listenFromHere: "האזנה מכאן", bookmark: "סימנייה", bookmarked: "נשמר", tafsir: "תפסיר", prev: "הקודם", next: "הבא", page: "עמוד", of: "מתוך", layout: "פריסה" },
  family: {
    title: "משפחה", sub: "חשבון הורה אחד, פרופיל אחד לכל בן משפחה מילד ועד סב וסבתא. כל פרופיל שומר גופן, גודל טקסט, סימניות, הערות והתקדמות משלו.",
    add: "הוספת בן משפחה", name: "שם", role: "תפקיד", gender: "מגדר", age: "קבוצת גיל", avatar: "אווטאר", save: "שמירה", cancel: "ביטול", remove: "הסרת פרופיל",
    roles: { parent: "הורה", adult: "מבוגר", child: "ילד", senior: "קשיש", teacher: "מורה" }, genders: { male: "זכר", female: "נקבה", unspecified: "לא צוין" },
    active: "פרופיל פעיל", bookmarks: "סימניות", notes: "הערות", streak: "ימים ברצף", minutes: "דקות היום", continue: "המשך קריאה", none: "עדיין אין", open: "פתיחה", mushaf: "מוסחף", player: "נגן",
    noProfiles: "התחילו בהוספת בן המשפחה הראשון.", edit: "עריכה", femaleNote: "קוראות מוצגות לפרופילים נשיים בלבד.", signin: "התחברו עם חשבון Quran Foundation של ההורה כדי לסנכרן סימניות והערות עם Quran.com", delete: "מחיקה",
  },
  search: {
    title: "חיפוש", placeholder: "חפשו בקוראן: מילה, פסוק, סורה או 2:255", go: "חיפוש", none: "אין תוצאות", nav: "מעבר אל", verses: "פסוקים", more: "עוד", results: "תוצאות", exact: "התאמה מדויקת", study: "לימוד", play: "האזנה", source: "מקור",
    tip: "נסו: רחמים · אל-כהף · 36:1 · סבלנות", quick: "מהיר", advanced: "מתקדם", hint: "מילה, ביטוי או מפתח פסוק כמו 2:255",
  },
  study: {
    title: "לימוד", words: "מילה במילה", translations: "תרגומים", tafsir: "תפסיר", compare: "השוואת תפסירים", hadith: "חדית'ים קשורים", answers: "שאלות ותשובות", reflections: "התבוננויות", info: "על הסורה", prev: "הקודם", next: "הבא", play: "האזנה", bookmark: "סימנייה",
    bookmarked: "נשמר", share: "שיתוף", copy: "העתקה", copied: "הועתק", juz: "ג'וז", page: "עמוד", hizb: "חיזב", sajdah: "סג'דה", none: "אין", prodOnly: "זמין לאחר הפעלת חשבון הייצור של Quran Foundation", loading: "טוען…", searchWord: "חיפוש מילה זו",
    listenWord: "האזנה למילה", noProfile: "בחרו תחילה פרופיל בעמוד המשפחה", occurrences: "מופעים", pick: "בחרו תפסיר", surah: "סורה", ayah: "פסוק", of: "מתוך",
  },
  learn: {
    title: "לימוד", pick: "בחרו סורה כדי להתחיל", start: "התחלת שיעור", xp: "נק' ניסיון", level: "רמה", streak: "ימים ברצף", check: "בדיקה", next: "הבא", correct: "נכון!", wrong: "לא בדיוק. התשובה:", done: "כל הכבוד! השיעור הושלם", earned: "צברתם", again: "שיעור חדש",
    meaning: "מה פירוש המילה הזו?", word: "איזו מילה פירושה:", hidden: "השלימו את הפסוק במילה החסרה", order: "סדרו את מילות הפסוק", reset: "איפוס", loading: "מכין את השיעור…", noProfile: "בחרו פרופיל בעמוד המשפחה כדי לשמור את ההתקדמות",
    lessonsDone: "שיעורים הושלמו", juz30: "ג'וז עמא", all: "כל הסורות", listen: "האזנה", skip: "דילוג", short: "סורות קצרות", stage: "שלב", ayatInSurah: "פסוקים בסורה זו",
  },
  play: {
    title: "משחק", pick: "בחרו משחק", scope: "היקף", all: "כל הקוראן", juz30: "ג'וז עמא", short: "סורות קצרות", start: "התחלה", loading: "מכין…", score: "ניקוד", time: "זמן", next: "הבא", result: "תוצאה", again: "שחקו שוב", home: "משחקים", best: "השיאים",
    correct: "נכונות", noProfile: "בחרו פרופיל בעמוד המשפחה כדי לשמור את הניקוד", study: "לימוד הפסוק", nextIs: "הפסוק הבא הוא", wrong: "לא נכון. התשובה:", done: "הסיבוב הסתיים", of: "מתוך", leaderboard: "לוח המשפחה", nextQuestion: "איזה פסוק בא אחר כך?", juz: "ג'וז",
    games: { "guess-surah": { title: "איזו סורה?", sub: "קראו את הפסוק ובחרו את הסורה" }, "next-ayah": { title: "הפסוק הבא", sub: "איזה פסוק בא אחר כך?" }, "missing-word": { title: "המילה החסרה", sub: "השלימו את הפסוק במילה הנכונה" }, "which-juz": { title: "איזה ג'וז?", sub: "נחשו את הג'וז" } },
  },
  hifz: {
    title: "שינון", pick: "בחרו סורה וטווח פסוקים", from: "מ", to: "עד", start: "התחלת חזרה", reveal: "הצגה", hide: "הסתרה", grade: "איך הייתה ההיזכרות?", forgot: "שכחתי", hard: "קשה", good: "טוב", easy: "קל", due: "להיום", cards: "כרטיסים", listen: "האזנה", mic: "בדיקה במיקרופון",
    micStop: "עצירה", micUnsupported: "לדפדפן זה אין זיהוי דיבור (נסו Chrome)", accuracy: "דיוק", heard: "נשמע", next: "הבא", done: "סיבוב היום הסתיים", again: "סיבוב נוסף", noProfile: "ההתקדמות נשמרת במכשיר זה", methods: "שיטות שינון",
    method6446: "שיטת 6446: חזרו על כל פסוק 20 פעמים ב-4 סבבים", method3x3: "שיטת 3×3: שלושה פסוקים בנפרד, ואז ברצף", reps: "חזרות", chain: "שרשרת", schedule: "החזרה הבאה", today: "היום", tomorrow: "מחר", days: "ימים", ayah: "פסוק", loading: "טוען…",
  },
  ask: {
    title: "שאלה", placeholder: "שאלו על משמעות פסוק או נושא בקוראן…", ask: "שאלה", sources: "מקורות", retrieval: "פסוקים ותפסיר קשורים (ללא מודל שפה)", model: "תשובת מודל עם ציטוטים מילה במילה", tafsir: "תפסיר", study: "לימוד", report: "דיווח", reported: "תודה, הדיווח נרשם",
    pending: "ממתין לסקירת חכמים", intro: "התשובות נבנות רק מהפסוקים והתפסיר שבמקורות; הפסוקים מצוטטים מילה במילה ולעולם אינם משתנים. ללא פתוות.", examples: ["מה משמעות פסוק הכיסא?", "מה אומר הקוראן על סבלנות?", "סיפור אנשי המערה"],
    nokey: "הגדירו ANTHROPIC_API_KEY בשרת כדי להפעיל תשובות מנוסחות; כרגע המקורות מוצגים ישירות.", today: "פסוק היום", open: "פתיחת הפסוק",
  },
  azan: {
    title: "אד'אן וזמני תפילה", prayers: { fajr: "פג'ר", sunrise: "זריחה", dhuhr: "ד'והר", asr: "עסר", maghrib: "מע'רב", isha: "עשאא'" }, nextPrayer: "התפילה הבאה", inTime: "בעוד", now: "עכשיו", location: "מיקום", useMyLocation: "שימוש במיקום שלי",
    locating: "מאתר את מיקומכם…", locationDenied: "המיקום לא אושר. בחרו את עירכם במקום.", pickCity: "בחירת עיר", country: "מדינה", city: "עיר", method: "שיטת חישוב", methodAuto: "אוטומטי לפי מדינה", muezzin: "קול האד'אן", preview: "השמעת האד'אן", stop: "עצירה",
    notifications: "התראות אד'אן", notificationsHelp: "התראה עם האד'אן בכל זמן תפילה, בקול שבחרתם. פסוק היום נפתח ממנה.", enable: "הפעלת התראות", enabled: "ההתראות פועלות", disabled: "ההתראות כבויות", unsupported: "דפדפן זה אינו תומך בהתראות",
    denied: "ההתראות נחסמו בהגדרות הדפדפן", testNotification: "שליחת בדיקה", todayTimes: "זמני היום", tomorrowTimes: "מחר", playAtAzan: "השמעת האד'אן באפליקציה בזמן התפילה", silentPrayers: "תפילות שקטות", story: "פסוק היום", openStory: "פתיחת פסוק היום",
    settingsSaved: "נשמר", timezone: "אזור זמן", hijri: "תאריך הג'רי", asrHanafi: "עסר (חנפי)", highLat: "כלל קווי רוחב גבוהים", source: "הזמנים מחושבים במכשיר בשיטה האסטרונומית המקובלת במדינתכם; אשרו תמיד מול המסגד המקומי.",
  },
  story: {
    title: "פסוק היום", tapHint: "הקישו להמשך", reflect: "רגע של התבוננות", reflectPrompt: "מה הפסוק הזה אומר לכם היום?", tafsir: "מן התפסיר", listen: "האזנה", openStudy: "לימוד פסוק זה", share: "שיתוף", saveNote: "שמירה כהערה", noteSaved: "ההערה נשמרה",
    nextAyah: "פסוק אחר", wallpaper: "החלפת רקע", goodMorning: "בוקר טוב", goodEvening: "ערב טוב", forPrayer: "לתפילת",
  },
};
