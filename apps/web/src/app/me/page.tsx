import type { Metadata } from "next";

import MePage from "@/components/me/me-page";

export const metadata: Metadata = { title: "Me · Quran and more" };

export default function Page() {
  return <MePage />;
}
