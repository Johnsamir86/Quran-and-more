import type { Metadata } from "next";

import PlayerClient from "./player-client";

export const metadata: Metadata = {
  title: "Quran Player · Quran and More",
  description: "Listen, read, translate and study tafsir in one player, with any reciter.",
  other: { google: "notranslate" },
};

export default async function PlayerPage({ searchParams }: { searchParams: Promise<{ surah?: string }> }) {
  const sp = await searchParams;
  const initialSurah = sp.surah ? Number.parseInt(sp.surah, 10) : undefined;
  return <PlayerClient initialSurah={Number.isInteger(initialSurah) ? initialSurah : undefined} />;
}
