import type { Metadata } from "next";

import KhatmahPage from "@/components/worship/khatmah-page";

export const metadata: Metadata = { title: "Khatmah · Quran and more" };

export default function Page() {
  return <KhatmahPage />;
}
