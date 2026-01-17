import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Footer } from "@/components/Footer";
import { AudioProvider } from "@/context/AudioContext";
import { VideoProvider } from "@/context/VideoContext";
import { PersistentPlayer } from "@/components/PersistentPlayer";
import { FloatingVideoPlayer } from "@/components/FloatingVideoPlayer";
import { PageTransition } from "@/components/PageTransition";
import { TacticalBar } from "@/components/navigation/TacticalBar";
import { InstallApp } from "@/components/InstallApp";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { SmoothScroll } from "@/components/SmoothScroll";
import { ScrollRestorationManager } from "@/components/ScrollRestorationManager";
import { ProdRuntimeGuards } from "@/components/ProdRuntimeGuards";
import { LogoIntro } from "@/components/branding/LogoIntro";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { ParticlesBackground } from "@/components/ParticlesBackground";
import { NavBar } from "@/components/layout/NavBar";

// 1. Graffiti Font (Accents & Logos)
const permanentMarker = localFont({
  src: "../../public/fonts/permanent-marker-400.woff2",
  weight: "400",
  variable: "--font-permanent-marker",
  display: "swap",
});

// 2. Tag Font (Subtitles & Artistic Elements)
const sedgwickAve = localFont({
  src: "../../public/fonts/sedgwick-ave-400.woff2",
  weight: "400",
  variable: "--font-sedgwick-ave",
  display: "swap",
});

// 3. Header Font (The "Flyer" Style - Replaces Impact)
const anton = localFont({
  src: "../../public/fonts/anton-400.woff2",
  weight: "400",
  variable: "--font-anton",
  display: "swap",
});

// 4. Industrial Font (Lists, Dates, Tracks - Readable Data)
const barlowCondensed = localFont({
  src: [
    {
      path: "../../public/fonts/barlow-condensed-400.woff2",
      weight: "400",
    },
    {
      path: "../../public/fonts/barlow-condensed-700.woff2",
      weight: "700",
    },
  ],
  variable: "--font-barlow",
  display: "swap",
});

// 5. Cinematic Sans-Serif (Headlines - Replaces monospace)
const inter = localFont({
  src: [
    {
      path: "../../public/fonts/inter-400.woff2",
      weight: "400",
    },
    {
      path: "../../public/fonts/inter-500.woff2",
      weight: "500",
    },
    {
      path: "../../public/fonts/inter-600.woff2",
      weight: "600",
    },
    {
      path: "../../public/fonts/inter-700.woff2",
      weight: "700",
    },
    {
      path: "../../public/fonts/inter-800.woff2",
      weight: "800",
    },
    {
      path: "../../public/fonts/inter-900.woff2",
      weight: "900",
    },
  ],
  variable: "--font-inter",
  display: "swap",
});

// 6. Luxury Sans-Serif (Alternative headline option)
const lexend = localFont({
  src: [
    {
      path: "../../public/fonts/lexend-400.woff2",
      weight: "400",
    },
    {
      path: "../../public/fonts/lexend-500.woff2",
      weight: "500",
    },
    {
      path: "../../public/fonts/lexend-600.woff2",
      weight: "600",
    },
    {
      path: "../../public/fonts/lexend-700.woff2",
      weight: "700",
    },
    {
      path: "../../public/fonts/lexend-800.woff2",
      weight: "800",
    },
    {
      path: "../../public/fonts/lexend-900.woff2",
      weight: "900",
    },
  ],
  variable: "--font-lexend",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Piko Artist V3",
  description: "Professional Mobile DJ Workstation",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Piko V3",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Critical: Prevents pinch-zoom for "App" feel
  viewportFit: "cover", // REMEDIATION: Uses the notch area on iOS
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* PHASE 10: Asset Preloading - Preconnect to audio CDN */}
        <link rel="preconnect" href="https://archive.org" />
        <link rel="dns-prefetch" href="https://archive.org" />
      </head>
      <body
        className={`${permanentMarker.variable} ${sedgwickAve.variable} ${anton.variable} ${barlowCondensed.variable} ${inter.variable} ${lexend.variable} bg-background text-foreground antialiased pt-20 md:pt-24`}
      >
        <ProdRuntimeGuards />
        <ServiceWorkerRegistration />
        <LogoIntro />
        <ParticlesBackground />
        <AudioProvider>
          <VideoProvider>
            <NavBar />
            <SmoothScroll>
              <ScrollRestorationManager />
              <PageTransition>{children}</PageTransition>
            </SmoothScroll>
            <Footer />
            <FloatingVideoPlayer />
            <PersistentPlayer />
            <TacticalBar />
            <InstallApp />
            <InstallPrompt />
          </VideoProvider>
        </AudioProvider>
      </body>
    </html>
  );
}
