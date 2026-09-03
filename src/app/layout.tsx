import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "landing-forge studio — build landing pages visually",
  description:
    "Generate beautiful landing pages from one YAML file or an AI prompt. Visual builder, A/B testing, privacy-friendly analytics, one-click deploy.",
  keywords: ["landing page", "builder", "no-code", "AI", "A/B testing", "analytics", "YAML", "landing-forge"],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "landing-forge studio",
    description:
      "Beautiful landing pages from one YAML file or AI prompt. Built-in analytics, A/B testing, SEO.",
    siteName: "landing-forge",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-950 text-zinc-100`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
