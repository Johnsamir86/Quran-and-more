"use client";

import dynamic from "next/dynamic";

const StudyPage = dynamic(() => import("@/components/study/study-page"), { ssr: false });

export default function StudyClient({ verseKey }: { verseKey: string }) { return <StudyPage verseKey={verseKey} />; }
