import HifzClient from "./hifz-client";
import PlusGate from "@/components/plus-gate";

export const metadata = { title: "Hifz · Quran and More" };

export default function Page() { return <PlusGate feature="hifz"><HifzClient /></PlusGate>; }
