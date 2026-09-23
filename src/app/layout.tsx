import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import {Provider} from "@/components/provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ProcureAI · Proposal Intelligence",
  description: "공공조달 요구사항 추적 및 제안서 검토 도구",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col"><Provider>{children}</Provider></body>
    </html>
  );
}
