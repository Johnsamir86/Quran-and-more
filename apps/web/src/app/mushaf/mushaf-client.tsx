"use client";

import dynamic from "next/dynamic";

const MushafPage = dynamic(() => import("@/components/mushaf/mushaf-page"), { ssr: false });

export default function MushafClient(props: { initialPage?: number; initialLayout?: string; highlightVerse?: string }) {
  return <MushafPage {...props} />;
}
