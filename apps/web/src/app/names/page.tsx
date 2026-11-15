import type { Metadata } from "next";

import NamesPage from "@/components/worship/names-page";

export const metadata: Metadata = { title: "99 names of Allah · Quran and more" };

export default function Page() {
  return <NamesPage />;
}
