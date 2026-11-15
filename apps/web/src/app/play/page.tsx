import PlayClient from "./play-client";
import PlusGate from "@/components/plus-gate";

export const metadata = { title: "Play · Quran and More" };

export default function Page() { return <PlusGate feature="play"><PlayClient /></PlusGate>; }
