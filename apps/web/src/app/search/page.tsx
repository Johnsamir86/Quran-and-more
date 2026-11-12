import { Suspense } from "react";

import SearchClient from "./search-client";

export const metadata = { title: "Search · Quran and More" };

export default function Page() {
  return <Suspense fallback={null}><SearchClient /></Suspense>;
}
