import type { Metadata } from "next";

import "./globals.css";
import { Geist } from "next/font/google";
import localFont from "next/font/local";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans-latin" });
const notoSansThai = localFont({
  src: [
    { path: "./fonts/NotoSansThai-Regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/NotoSansThai-Bold.ttf", weight: "700", style: "normal" }
  ],
  display: "swap",
  variable: "--font-sans-thai"
});

export const metadata: Metadata = {
  title: "เปิดไหว — Thai café launch simulator",
  description: "Stress-test a Thai café business idea with transparent cash-flow calculations."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th" className={cn("font-sans", geist.variable, notoSansThai.variable)}>
      <body>{children}</body>
    </html>
  );
}
