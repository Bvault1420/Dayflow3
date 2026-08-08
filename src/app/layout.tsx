import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Syne } from "next/font/google";
import "./globals.css";

const body = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-body",
});

const display = Syne({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Aippy — Scroll & Create Short Games",
  description:
    "TikTok meets Roblox: scroll 10–60s games, remix with AI, and publish your own experiences.",
  applicationName: "Aippy",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#000000",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${body.variable} ${display.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
