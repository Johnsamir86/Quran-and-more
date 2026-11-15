import type { Metadata } from "next";
import PlusGate from "@/components/plus-gate";

import QiblaPage from "@/components/worship/qibla-page";

export const metadata: Metadata = { title: "Qibla · Quran and more" };

export default function Page() {
  return <PlusGate feature="worship"><QiblaPage /></PlusGate>;
}
