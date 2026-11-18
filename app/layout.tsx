import type { Metadata, Viewport } from "next";
import { Inter_Tight, Geist, Geist_Mono, Kalam } from "next/font/google";
import SmoothScroll from "@/components/SmoothScroll";
import "./globals.css";

const display = Inter_Tight({ subsets: ["latin"], weight: ["500", "600"], variable: "--nf-display" });
const text = Geist({ subsets: ["latin"], variable: "--nf-text" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--nf-mono" });
const hand = Kalam({ subsets: ["latin"], weight: ["700"], variable: "--nf-hand" });

export const metadata: Metadata = {
  title: "Cyoptmic | Engineering the cyberspace",
  description:
    "Cyoptmic is a software company in Lagos building web platforms, mobile apps and custom software for ambitious businesses in emerging markets.",
  openGraph: {
    title: "Cyoptmic | Engineering the cyberspace",
    description: "Web, mobile and custom software from Lagos for ambitious businesses.",
    siteName: "Cyoptmic",
    locale: "en_NG",
    type: "website",
  },
  icons: { icon: "/logo.svg" },
};

export const viewport: Viewport = { themeColor: "#09090c" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${text.variable} ${mono.variable} ${hand.variable}`}>
      <body className="font-sans antialiased">
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}
