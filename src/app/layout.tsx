import type { Metadata, Viewport } from "next";
import { Permanent_Marker, Sedgwick_Ave } from "next/font/google";
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

const permanentMarker = Permanent_Marker({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-permanent-marker",
  display: "swap",
});

const sedgwickAve = Sedgwick_Ave({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-sedgwick-ave",
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
      <body className={`${permanentMarker.variable} ${sedgwickAve.variable}`}>
        <AudioProvider>
          <VideoProvider>
            <Navigation />
            <PageTransition>
              {children}
            </PageTransition>
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
