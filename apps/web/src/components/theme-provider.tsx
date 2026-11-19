"use client";

import { useTheme } from "@/lib/theme";

/** Applies the saved brand theme to <html> as early as possible on the client; renders nothing. */
export default function ThemeProvider() {
  useTheme();
  return null;
}
