import type { Metadata } from "next";

import CalendarPage from "@/components/worship/calendar-page";

export const metadata: Metadata = { title: "Hijri calendar · Quran and more" };

export default function Page() {
  return <CalendarPage />;
}
