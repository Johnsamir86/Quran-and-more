/** Quran Foundation environments. Tokens are environment-bound: never mix. */
export const QF_ENVIRONMENTS = {
  prelive: {
    oauth2BaseUrl: "https://prelive-oauth2.quran.foundation",
    gatewayUrl: "https://apis-prelive.quran.foundation",
    note: "Sandbox: only Surah 1 and 2, 14 translations, 2 reciters.",
  },
  production: {
    oauth2BaseUrl: "https://oauth2.quran.foundation",
    gatewayUrl: "https://apis.quran.foundation",
    note: "Full dataset.",
  },
} as const;

export type QfEnvironmentName = keyof typeof QF_ENVIRONMENTS;

/** CDN roots for relative audio paths returned by the API. */
export const QF_AUDIO_CDN = {
  verses: "https://verses.quran.foundation/",
  wordByWord: "https://audio.qurancdn.com/",
} as const;

export const absoluteAudioUrl = (relativeOrAbsolute: string, kind: "verse" | "word" = "verse"): string => {
  if (/^https?:\/\//.test(relativeOrAbsolute)) return relativeOrAbsolute;
  if (relativeOrAbsolute.startsWith("//")) return `https:${relativeOrAbsolute}`;
  const base = kind === "word" ? QF_AUDIO_CDN.wordByWord : QF_AUDIO_CDN.verses;
  return base + relativeOrAbsolute.replace(/^\//, "");
};

/** Granular content scopes this project holds on its client. */
export const CONTENT_SCOPES = [
  "content.quran.read",
  "content.translations.read",
  "content.tafsirs.read",
  "content.audio.read",
  "content.metadata.read",
  "content.hadith.read",
  "content.answers.read",
  "content.sync.read",
  "content.reflections.read",
] as const;

/** User (PKCE) scopes requested at sign-in. Parent scopes only. */
export const USER_SCOPES = [
  "openid", "offline_access", "user", "bookmark", "collection", "note",
  "reading_session", "preference", "activity_day", "goal", "streak",
  "post", "comment", "app_state", "sync",
] as const;

export const resolveQfEnvironment = (env: Record<string, string | undefined>) => {
  const name: QfEnvironmentName = env.QF_ENV === "production" ? "production" : "prelive";
  const base = QF_ENVIRONMENTS[name];
  return {
    name,
    oauth2BaseUrl: env.OAUTH2_BASE_URL ?? base.oauth2BaseUrl,
    gatewayUrl: env.GATEWAY_URL ?? base.gatewayUrl,
  };
};
