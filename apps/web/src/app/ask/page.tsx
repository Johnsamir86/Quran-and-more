import AskClient from "./ask-client";
import PlusGate from "@/components/plus-gate";

export const metadata = { title: "Ask · Quran and More" };

export default function Page() { return <PlusGate feature="ask"><AskClient /></PlusGate>; }
