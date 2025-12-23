"use client";

import { Youtube, Facebook, Instagram, Music } from "lucide-react";

// Custom TikTok Icon Component (since it's not in standard Lucide)
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );
}

const socialLinks = [
  {
    name: "YouTube",
    url: "https://www.youtube.com/channel/UCjHQIImynicoSZuFmt6Rdig",
    icon: Youtube,
  },
  {
    name: "YouTube Music",
    url: "https://music.youtube.com/channel/UCD2ybRyk6b1pQDfOtq2MYIw",
    icon: Music,
  },
  {
    name: "Instagram",
    url: "https://www.instagram.com/piko289/",
    icon: Instagram,
  },
  {
    name: "TikTok",
    url: "https://www.tiktok.com/@piko_fg",
    icon: TikTokIcon,
  },
  {
    name: "Facebook",
    url: "https://www.facebook.com/Unamasmusic",
    icon: Facebook,
  },
];

export function Footer() {
  return (
    <footer className="relative w-full border-t-2 border-black py-12 mt-20 overflow-hidden">
      {/* Grunge Window Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-black/80" />
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Brand / Copyright */}
          <div className="text-center md:text-left">
            <h2 className="font-header text-2xl text-white mb-2 tracking-wide">
              PIKO<span className="text-toxic-lime">FG</span>
            </h2>
            <p className="font-industrial text-zinc-500 text-sm">
              &copy; {new Date().getFullYear()} All Rights Reserved.
            </p>
          </div>

          {/* Social Icons */}
          <div className="flex items-center gap-6">
            {socialLinks.map((link) => {
              const Icon = link.icon;
              return (
                <a
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Follow on ${link.name}`}
                  className="group relative"
                >
                  <div className="absolute inset-0 bg-toxic-lime blur-md opacity-0 group-hover:opacity-40 transition-opacity duration-300 rounded-full" />
                  <Icon className="w-6 h-6 text-zinc-400 group-hover:text-toxic-lime transition-all duration-300 transform group-hover:scale-110 group-hover:drop-shadow-[0_0_5px_rgba(204,255,0,0.8)]" />
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
}
