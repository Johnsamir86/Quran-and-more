import type { Metadata } from "next";

import StudyClient from "./study-client";

export async function generateMetadata({ params }: { params: Promise<{ verseKey: string }> }): Promise<Metadata> {
  const { verseKey } = await params;
  const key = decodeURIComponent(verseKey);
  return { title: `${key} · Quran and More`, openGraph: { images: [`/api/og/${key}`] } };
}

export default async function Page({ params }: { params: Promise<{ verseKey: string }> }) {
  const { verseKey } = await params;
  return <StudyClient verseKey={decodeURIComponent(verseKey)} />;
}
