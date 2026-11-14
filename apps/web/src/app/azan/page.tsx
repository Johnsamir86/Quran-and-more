import type { Metadata } from "next";

import AzanPage from "@/components/azan/azan-page";

export const metadata: Metadata = { title: "Azan and prayer times · Quran and more" };

export default function Page() {
  return <AzanPage />;
}
