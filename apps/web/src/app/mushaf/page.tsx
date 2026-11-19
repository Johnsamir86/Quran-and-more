import type { Metadata } from "next";

import MushafClient from "./mushaf-client";

export const metadata: Metadata = {
  title: "Mushaf · Quran and More",
  description: "Read the Quran page by page in the printed Madani, Tajweed, KFGQPC or IndoPak layouts with the official fonts.",
  other: { google: "notranslate" },
};

export default async function Page({ searchParams }: { searchParams: Promise<{ page?: string; layout?: string; verse?: string }> }) {
  const sp = await searchParams;
  const page = sp.page ? Number.parseInt(sp.page, 10) : undefined;
  return <MushafClient initialPage={Number.isInteger(page) ? page : undefined} initialLayout={sp.layout} highlightVerse={sp.verse} />;
}
