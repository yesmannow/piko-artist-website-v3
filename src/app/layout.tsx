import type { Metadata, Viewport } from "next";
import { Permanent_Marker, Sedgwick_Ave, Anton, Barlow_Condensed } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AudioProvider } from "@/context/AudioContext";
import { VideoProvider } from "@/context/VideoContext";
import { PersistentPlayer } from "@/components/PersistentPlayer";
import { FloatingVideoPlayer } from "@/components/FloatingVideoPlayer";
import { PageTransition } from "@/components/PageTransition";
import { MobileNav } from "@/components/MobileNav";
import { InstallApp } from "@/components/InstallApp";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { SmoothScroll } from "@/components/SmoothScroll";
import { ScrollRestorationManager } from "@/components/ScrollRestorationManager";
import { ProdRuntimeGuards } from "@/components/ProdRuntimeGuards";
import { LogoIntro } from "@/components/branding/LogoIntro";
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

export const metadata: Metadata = {
  title: "Piko Artist Studio",
  description: "High-performance holographic DJ mixer and artist platform",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Piko Studio",
    startupImage: [
      {
        url: "/icons/apple-touch-startup-image.png",
        media: "(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)",
      },
      {
        url: "/icons/apple-touch-startup-image.png",
        media: "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)",
      },
      {
        url: "/icons/apple-touch-startup-image.png",
        media: "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)",
      },
    ],
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
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
        className={`${permanentMarker.variable} ${sedgwickAve.variable} ${anton.variable} ${barlowCondensed.variable} bg-background text-foreground antialiased pt-20 md:pt-24`}
      >
        <ProdRuntimeGuards />
        <ServiceWorkerRegistration />
        <LogoIntro />
        <AudioProvider>
          <VideoProvider>
            <Navbar />
            <SmoothScroll>
              <ScrollRestorationManager />
              <PageTransition>{children}</PageTransition>
            </SmoothScroll>
            <Footer />
            <FloatingVideoPlayer />
            <PersistentPlayer />
            <MobileNav />
            <InstallApp />
            <InstallPrompt />
          </VideoProvider>
        </AudioProvider>
      </body>
    </html>
  );
}
