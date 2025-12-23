import type { Metadata, Viewport } from "next";
import { Permanent_Marker, Sedgwick_Ave, Anton, Barlow_Condensed } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { AudioProvider } from "@/context/AudioContext";
import { VideoProvider } from "@/context/VideoContext";
import { PersistentPlayer } from "@/components/PersistentPlayer";
import { FloatingVideoPlayer } from "@/components/FloatingVideoPlayer";
import { PageTransition } from "@/components/PageTransition";
import { MobileNav } from "@/components/MobileNav";
import { InstallApp } from "@/components/InstallApp";
import { PullSoundHandler } from "@/components/PullSoundHandler";
import { SmoothScroll } from "@/components/SmoothScroll";

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

export const metadata: Metadata = {
  title: "Piko Artist Portfolio",
  description: "Music artist portfolio and showcase",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Piko",
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
        className={`${permanentMarker.variable} ${sedgwickAve.variable} ${anton.variable} ${barlowCondensed.variable} bg-background text-foreground antialiased`}
      >
        <AudioProvider>
          <VideoProvider>
            <PullSoundHandler />
            <Navigation />
            <SmoothScroll>
              <PageTransition>{children}</PageTransition>
            </SmoothScroll>
            <Footer />
            <FloatingVideoPlayer />
            <PersistentPlayer />
            <MobileNav />
            <InstallApp />
          </VideoProvider>
        </AudioProvider>
      </body>
    </html>
  );
}