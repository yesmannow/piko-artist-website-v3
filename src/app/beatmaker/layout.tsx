import { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "PIKO | Pro DJ Console",
  description: "Mix and scratch Piko's tracks in a professional 3D virtual environment.",
};

// Crucial: Prevents 'Pinch-to-Zoom' which ruins knob control on phones
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#121212",
};

export default function BeatmakerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

