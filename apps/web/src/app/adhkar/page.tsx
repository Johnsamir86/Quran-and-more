import type { Metadata } from "next";
import PlusGate from "@/components/plus-gate";

import AdhkarPage from "@/components/worship/adhkar-page";

export const metadata: Metadata = { title: "Adhkar · Quran and more" };

export default function Page() {
  return <PlusGate feature="worship"><AdhkarPage /></PlusGate>;
}
