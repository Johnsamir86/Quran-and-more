"use client";

import dynamic from "next/dynamic";

const HifzPage = dynamic(() => import("@/components/study/hifz-page"), { ssr: false });

export default function HifzClient() { return <HifzPage />; }
