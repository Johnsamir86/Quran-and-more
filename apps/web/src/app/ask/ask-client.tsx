"use client";

import dynamic from "next/dynamic";

const AskPage = dynamic(() => import("@/components/study/ask-page"), { ssr: false });

export default function AskClient() { return <AskPage />; }
