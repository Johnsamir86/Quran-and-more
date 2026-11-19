"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** Browser Supabase client for accounts; null when NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY are not set. */
let client: SupabaseClient | null | undefined;
export const supabase = (): SupabaseClient | null => {
  if (client !== undefined) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  client = url && key ? createClient(url, key) : null;
  return client;
};
export const AUTH_ENABLED = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
