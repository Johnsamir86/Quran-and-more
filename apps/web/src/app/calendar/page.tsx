import type { Metadata } from "next";
import PlusGate from "@/components/plus-gate";

import CalendarPage from "@/components/worship/calendar-page";

export const metadata: Metadata = { title: "Hijri calendar · Quran and more" };

export default function Page() {
  return <PlusGate feature="worship"><CalendarPage /></PlusGate>;
}
