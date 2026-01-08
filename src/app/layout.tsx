import type { Metadata, Viewport } from "next";
import { Permanent_Marker, Sedgwick_Ave, Anton, Barlow_Condensed, Inter, Lexend } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AudioProvider } from "@/context/AudioContext";
import { VideoProvider } from "@/context/VideoContext";
import { PersistentPlayer } from "@/components/PersistentPlayer";
import { FloatingVideoPlayer } from "@/components/FloatingVideoPlayer";
import { PageTransition } from "@/components/PageTransition";
import { MobileNav } from "@/components/MobileNav";
import { TacticalBar } from "@/components/navigation/TacticalBar";
import { InstallApp } from "@/components/InstallApp";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { SmoothScroll } from "@/components/SmoothScroll";
import { ScrollRestorationManager } from "@/components/ScrollRestorationManager";
import { ProdRuntimeGuards } from "@/components/ProdRuntimeGuards";
import { LogoIntro } from "@/components/branding/LogoIntro";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { ParticlesBackground } from "@/components/ParticlesBackground";

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
            <Navbar />
            <SmoothScroll>
              <ScrollRestorationManager />
              <PageTransition>{children}</PageTransition>
            </SmoothScroll>
            <Footer />
            <FloatingVideoPlayer />
            <PersistentPlayer />
            <MobileNav />
            <TacticalBar />
            <InstallApp />
            <InstallPrompt />
          </VideoProvider>
        </AudioProvider>
      </body>
    </html>
  );
}
