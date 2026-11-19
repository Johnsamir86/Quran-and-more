import type { Metadata } from "next";
import PlusGate from "@/components/plus-gate";

import AzanPage from "@/components/azan/azan-page";

export const metadata: Metadata = { title: "Azan and prayer times · Quran and more" };

export default function Page() {
  return <PlusGate feature="azan"><AzanPage /></PlusGate>;
}
