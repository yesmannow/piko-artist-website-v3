"use client";

import Link from "next/link";
import Image from "next/image";
import { Youtube, Instagram, Facebook } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative w-full border-t-2 border-black py-12 mt-20 overflow-hidden">
      {/* Grunge Window Background */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/bg/grunge-window.jpg"
          alt="Grunge Window Background"
          fill
          className="object-cover"
        />
        {/* Heavy Dark Overlay */}
        <div className="absolute inset-0 bg-black/80" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Social Links - Overlapping Circular Stickers */}
          <div className="flex items-center gap-2">
            <Link
              href="https://www.youtube.com/channel/UCjHQIImynicoSZuFmt6Rdig"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative w-14 h-14 rounded-full bg-red-600 border-2 border-black flex items-center justify-center shadow-hard transition-all hover:scale-110 hover:rotate-6"
              style={{
                boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)",
                zIndex: 3,
              }}
            >
              <Youtube className="w-6 h-6 text-white" fill="currentColor" />
            </Link>
            <Link
              href="https://www.instagram.com/piko289/"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 border-2 border-black flex items-center justify-center shadow-hard transition-all hover:scale-110 hover:-rotate-6"
              style={{
                boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)",
                zIndex: 2,
                marginLeft: "-8px",
              }}
            >
              <Instagram className="w-6 h-6 text-white" fill="currentColor" />
            </Link>
            <Link
              href="https://www.facebook.com/Unamasmusic"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative w-14 h-14 rounded-full bg-blue-600 border-2 border-black flex items-center justify-center shadow-hard transition-all hover:scale-110 hover:rotate-6"
              style={{
                boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)",
                zIndex: 1,
                marginLeft: "-8px",
              }}
            >
              <Facebook className="w-6 h-6 text-white" fill="currentColor" />
            </Link>
          </div>

          {/* Copyright */}
          <div className="text-sm text-foreground font-industrial font-bold">
            © 2025 Una Mas Music.
          </div>
        </div>
      </div>
    </footer>
  );
}

