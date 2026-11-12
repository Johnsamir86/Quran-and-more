"use client";

import { usePathname } from "next/navigation";

import StarterShell from "@/components/starter-shell";

/** Full-screen routes render without the starter navigation shell. */
const FULL_SCREEN_PREFIXES = ["/player", "/mushaf", "/family", "/privacy", "/terms"];
const FULL_SCREEN_EXACT = ["/"];

export default function ShellGate() {
  const pathname = usePathname() ?? "/";
  if (FULL_SCREEN_EXACT.includes(pathname) || FULL_SCREEN_PREFIXES.some((p) => pathname.startsWith(p))) return null;
  return <StarterShell />;
}
