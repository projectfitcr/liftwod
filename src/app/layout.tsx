import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Thai_Looped } from "next/font/google";
import { RegisterSW } from "@/components/pwa/RegisterSW";
import "./globals.css";

const plexThaiLooped = IBM_Plex_Sans_Thai_Looped({
  variable: "--font-sans",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "LIFTwod",
  description: "Project Fit Chiang Rai — schedule, WODs, scores, membership",
};

export const viewport: Viewport = {
  themeColor: "#0b0b0f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${plexThaiLooped.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
        <RegisterSW />
      </body>
    </html>
  );
}
