import type { Metadata } from "next";
import { Permanent_Marker, Sedgwick_Ave } from "next/font/google";
import "./globals.css";

const permanentMarker = Permanent_Marker({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-graffiti",
});

const sedgwickAve = Sedgwick_Ave({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-tag",
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
        {children}
      </body>
    </html>
  );
}
