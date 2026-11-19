import type { Metadata } from "next";
import {
  Noto_Naskh_Arabic,
  Plus_Jakarta_Sans,
  Space_Mono,
} from "next/font/google";

import { starterConfig } from "../../starter.config";
import { FamilyProvider } from "@/components/family/family-provider";
import ShellGate from "@/components/shell-gate";
import ThemeProvider from "@/components/theme-provider";
import "./globals.css";

const bodyFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  weight: ["400", "500", "600", "700", "800"],
});

const arabicFont = Noto_Naskh_Arabic({
  subsets: ["arabic"],
  variable: "--font-noto-arabic",
  weight: ["400", "500", "600", "700"],
});

const monoFont = Space_Mono({
  subsets: ["latin"],
  variable: "--font-space-mono",
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  description: starterConfig.app.description,
  title: starterConfig.app.name,
  applicationName: "Quran and More",
  icons: { icon: [{ url: "/icon.png", sizes: "32x32" }, { url: "/icon-192.png", sizes: "192x192" }, { url: "/icon-512.png", sizes: "512x512" }], apple: "/apple-touch-icon.png" },
  openGraph: { title: "Quran and More · القرآن وأكثر", description: "Listen, read, learn and pray. One Quran app for the whole family.", images: [{ url: "/og-default.png", width: 1200, height: 630 }] },
  themeColor: "#14805f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${bodyFont.variable} ${arabicFont.variable} ${monoFont.variable}`}
      >
        <FamilyProvider>
          <ThemeProvider />
          <ShellGate />
          {children}
        </FamilyProvider>
      </body>
    </html>
  );
}
