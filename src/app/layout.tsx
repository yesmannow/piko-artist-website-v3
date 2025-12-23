import type { Metadata } from "next";
import { Permanent_Marker, Sedgwick_Ave } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { AudioProvider } from "@/context/AudioContext";
import { PersistentPlayer } from "@/components/PersistentPlayer";
import { SprayCursor } from "@/components/SprayCursor";

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
          <SprayCursor />
          <Navigation />
          {children}
          <Footer />
          <PersistentPlayer />
        </AudioProvider>
      </body>
    </html>
  );
}
