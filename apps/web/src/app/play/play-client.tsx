"use client";

import dynamic from "next/dynamic";

const PlayPage = dynamic(() => import("@/components/study/play-page"), { ssr: false });

export default function PlayClient() { return <PlayPage />; }
