import type { Metadata } from "next";

import AdhkarPage from "@/components/worship/adhkar-page";

export const metadata: Metadata = { title: "Adhkar · Quran and more" };

export default function Page() {
  return <AdhkarPage />;
}
