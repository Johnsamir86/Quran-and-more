import type { Metadata } from "next";
import PlusGate from "@/components/plus-gate";

import KhatmahPage from "@/components/worship/khatmah-page";

export const metadata: Metadata = { title: "Khatmah · Quran and more" };

export default function Page() {
  return <PlusGate feature="worship"><KhatmahPage /></PlusGate>;
}
