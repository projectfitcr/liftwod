import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { RegisterSW } from "@/components/pwa/RegisterSW";
import "./globals.css";

const thSarabunPsk = localFont({
  src: [
    {
      path: "./fonts/th-sarabun-psk-regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/th-sarabun-psk-bold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "./fonts/th-sarabun-psk-italic.ttf",
      weight: "400",
      style: "italic",
    },
    {
      path: "./fonts/th-sarabun-psk-bold-italic.ttf",
      weight: "700",
      style: "italic",
    },
  ],
  variable: "--font-sans",
  display: "swap",
  fallback: ["Tahoma", "ui-sans-serif", "system-ui", "sans-serif"],
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
    <html lang="th" className={`${thSarabunPsk.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
        <RegisterSW />
      </body>
    </html>
  );
}
