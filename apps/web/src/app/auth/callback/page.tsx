"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { supabase } from "@/lib/supabase";

/** Supabase OAuth / magic-link landing: the SDK reads the session from the URL, then we go to /me. */
export default function AuthCallback() {
  const router = useRouter();
  useEffect(() => {
    const sb = supabase();
    if (!sb) { router.replace("/me"); return; }
    sb.auth.getSession().finally(() => router.replace("/me"));
  }, [router]);
  return null;
}
