import type { Metadata } from "next";
import PlusGate from "@/components/plus-gate";

import TasbihPage from "@/components/worship/tasbih-page";

export const metadata: Metadata = { title: "Tasbih · Quran and more" };

export default function Page() {
  return <PlusGate feature="worship"><TasbihPage /></PlusGate>;
}
