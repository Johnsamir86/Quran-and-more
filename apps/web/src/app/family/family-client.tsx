"use client";

import dynamic from "next/dynamic";

const FamilyPage = dynamic(() => import("@/components/family/family-page"), { ssr: false });

export default function FamilyClient() {
  return <FamilyPage />;
}
