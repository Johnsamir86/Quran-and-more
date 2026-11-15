import type { Metadata } from "next";
import { Suspense } from "react";

import StoryVideoPage from "@/components/story/story-video-page";

export const metadata: Metadata = { title: "Share the ayah as a video · Quran and more" };

export default function Page() {
  return <Suspense fallback={null}><StoryVideoPage /></Suspense>;
}
