"use client";

import dynamic from "next/dynamic";

const SearchPage = dynamic(() => import("@/components/study/search-page"), { ssr: false });

export default function SearchClient() { return <SearchPage />; }
