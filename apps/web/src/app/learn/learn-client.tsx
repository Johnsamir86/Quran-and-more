"use client";

import dynamic from "next/dynamic";

const LearnPage = dynamic(() => import("@/components/study/learn-page"), { ssr: false });

export default function LearnClient() { return <LearnPage />; }
