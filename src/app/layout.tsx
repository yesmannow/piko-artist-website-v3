import type { Metadata } from "next";
import "./globals.css";

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
      <body>
        {children}
      </body>
    </html>
  );
}
