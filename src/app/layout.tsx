import type { Metadata, Viewport } from "next";
import { Permanent_Marker, Sedgwick_Ave, Anton, Barlow_Condensed, Inter, Lexend } from "next/font/google";
import "./globals.css";
import { ProdRuntimeGuards } from "@/components/ProdRuntimeGuards";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";

// 1. Graffiti Font (Accents & Logos)
const permanentMarker = Permanent_Marker({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-permanent-marker",
  display: "swap",
});

// 2. Tag Font (Subtitles & Artistic Elements)
const sedgwickAve = Sedgwick_Ave({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-sedgwick-ave",
  display: "swap",
});

// 3. Header Font (The "Flyer" Style - Replaces Impact)
const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-anton",
  display: "swap",
});

// 4. Industrial Font (Lists, Dates, Tracks - Readable Data)
const barlowCondensed = Barlow_Condensed({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-barlow",
  display: "swap",
});

// 5. Cinematic Sans-Serif (Headlines - Replaces monospace)
const inter = Inter({
  weight: ["400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// 6. Luxury Sans-Serif (Alternative headline option)
const lexend = Lexend({
  weight: ["400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
  variable: "--font-lexend",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Piko Artist Studio",
  description: "High-performance holographic DJ mixer and artist platform",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Piko Studio",
  },
  icons: {
    icon: "/images/branding/piko-logo.png",
    apple: "/images/branding/piko-logo.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${permanentMarker.variable} ${sedgwickAve.variable} ${anton.variable} ${barlowCondensed.variable} ${inter.variable} ${lexend.variable} bg-background text-foreground antialiased`}
      >
        <ProdRuntimeGuards />
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}
