import type { Metadata } from "next";

import TasbihPage from "@/components/worship/tasbih-page";

export const metadata: Metadata = { title: "Tasbih · Quran and more" };

export default function Page() {
  return <TasbihPage />;
}
