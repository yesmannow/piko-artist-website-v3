"use client";

import Link from "next/link";
import Image from "next/image";
import { Youtube, Instagram, Facebook } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative w-full border-t border-neon-green/20 py-12 mt-20 overflow-hidden">
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
          {/* Social Links */}
          <div className="flex items-center gap-6">
            <Link
              href="https://www.youtube.com/channel/UCjHQIImynicoSZuFmt6Rdig"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 text-muted-foreground hover:text-neon-green transition-colors font-tag"
            >
              <Youtube className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>YouTube</span>
            </Link>
            <Link
              href="https://www.instagram.com/piko289/"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 text-muted-foreground hover:text-neon-pink transition-colors font-tag"
            >
              <Instagram className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>Instagram</span>
            </Link>
            <Link
              href="https://www.facebook.com/Unamasmusic"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 text-muted-foreground hover:text-neon-green transition-colors font-tag"
            >
              <Facebook className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>Facebook</span>
            </Link>
          </div>

          {/* Copyright */}
          <div className="text-sm text-foreground font-tag">
            © 2025 Una Mas Music.
          </div>
        </div>
      </div>
    </footer>
  );
}

