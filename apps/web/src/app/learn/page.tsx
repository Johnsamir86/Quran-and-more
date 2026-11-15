import LearnClient from "./learn-client";
import PlusGate from "@/components/plus-gate";

export const metadata = { title: "Learn · Quran and More" };

export default function Page() { return <PlusGate feature="learn"><LearnClient /></PlusGate>; }
