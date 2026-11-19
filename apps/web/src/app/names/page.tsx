import type { Metadata } from "next";
import PlusGate from "@/components/plus-gate";

import NamesPage from "@/components/worship/names-page";

export const metadata: Metadata = { title: "99 names of Allah · Quran and more" };

export default function Page() {
  return <PlusGate feature="names"><NamesPage /></PlusGate>;
}
