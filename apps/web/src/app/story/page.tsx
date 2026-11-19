import type { Metadata } from "next";
import PlusGate from "@/components/plus-gate";
import { Suspense } from "react";

import StoryPage from "@/components/story/story-page";

export const metadata: Metadata = { title: "Ayah of the day · Quran and more" };

export default function Page() {
  return <Suspense fallback={null}><PlusGate feature="story"><StoryPage /></PlusGate></Suspense>;
}
