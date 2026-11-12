"use client";

import dynamic from "next/dynamic";

/* The player depends on the browser (audio element, locale, localStorage), so it renders client-side only. */
const QuranPlayer = dynamic(() => import("@/components/player/quran-player"), { ssr: false });

export default function PlayerClient({ initialSurah }: { initialSurah?: number }) {
  return <QuranPlayer initialSurah={initialSurah} />;
}
