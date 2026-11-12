import type { Metadata } from "next";

import FamilyClient from "./family-client";

export const metadata: Metadata = { title: "Family · Quran and More", description: "Profiles for every family member with their own bookmarks, notes and progress." };

export default function Page() {
  return <FamilyClient />;
}
