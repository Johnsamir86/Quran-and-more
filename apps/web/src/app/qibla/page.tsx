import type { Metadata } from "next";

import QiblaPage from "@/components/worship/qibla-page";

export const metadata: Metadata = { title: "Qibla · Quran and more" };

export default function Page() {
  return <QiblaPage />;
}
