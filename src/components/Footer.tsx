"use client";

import {
  Youtube,
  Facebook,
  Instagram,
  Music,
  ExternalLink,
  Mail,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

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

const quickLinks = [
  { name: "Home", href: "/" },
  { name: "Studio", href: "/studio" },
  { name: "Music", href: "/music" },
  { name: "Contact", href: "/contact" },
];

export function Footer() {
  return (
    <footer className="relative w-full border-t-4 border-[#FFD700] bg-black overflow-hidden mt-20">
      {/* Animated Grid Background */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255, 215, 0, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 215, 0, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      {/* Graffiti Texture Overlay */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.15 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          {/* Brand Section */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Image
                src="/images/branding/piko-logo.png"
                alt="Piko Logo"
                width={120}
                height={120}
                className="w-32 h-auto"
              />
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-[#E0E0E0]/70 text-sm leading-relaxed max-w-xs"
            >
              Urban beats, raw talent, and authentic hip-hop culture. Experience
              the sound of the streets.
            </motion.p>
          </div>

          {/* Quick Links */}
          <div>
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-[#FFD700] font-black italic uppercase text-lg mb-6 tracking-wider"
              style={{
                fontFamily: "var(--font-lexend), system-ui, sans-serif",
              }}
            >
              Navigate
            </motion.h3>
            <ul className="space-y-3">
              {quickLinks.map((link, idx) => (
                <motion.li
                  key={link.name}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: idx * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Link
                    href={link.href}
                    className="text-[#E0E0E0]/70 hover:text-[#FFD700] transition-colors duration-300 text-sm font-mono uppercase tracking-wider group flex items-center gap-2"
                  >
                    <span className="w-0 group-hover:w-2 h-0.5 bg-[#FFD700] transition-all duration-300" />
                    {link.name}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Connect Section */}
          <div className="lg:col-span-2">
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-[#FFD700] font-black italic uppercase text-lg mb-6 tracking-wider"
              style={{
                fontFamily: "var(--font-lexend), system-ui, sans-serif",
              }}
            >
              Connect
            </motion.h3>
            <div className="flex gap-3 flex-wrap md:flex-nowrap">
              {socialLinks.map((link, idx) => {
                const Icon = link.icon;
                return (
                  <motion.a
                    key={link.name}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Follow on ${link.name}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: idx * 0.1 }}
                    viewport={{ once: true }}
                    whileHover={{ scale: 1.08, rotate: 3 }}
                    whileTap={{ scale: 0.96 }}
                    className="group relative w-10 h-10 flex items-center justify-center bg-[#1a1a1a] border-2 border-[#E0E0E0]/20 hover:border-[#FFD700] transition-all duration-300"
                  >
                    <Icon className="w-4 h-4 text-[#E0E0E0]/70 group-hover:text-[#FFD700] transition-colors duration-300" />
                    <div className="absolute inset-0 bg-[#FFD700]/0 group-hover:bg-[#FFD700]/10 transition-all duration-300" />
                  </motion.a>
                );
              })}
            </div>
          </div>

          {/* Contact/Newsletter */}
          <div>
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-[#FFD700] font-black italic uppercase text-lg mb-6 tracking-wider"
              style={{
                fontFamily: "var(--font-lexend), system-ui, sans-serif",
              }}
            >
              Contact / Collab
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-[#E0E0E0]/70 text-sm mb-4"
            >
              Business inquiries, features, beats, and collaborations.
            </motion.p>
            <motion.a
              href="/contact"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#FFD700] text-black font-bold italic uppercase text-sm border-2 border-black"
              style={{
                fontFamily: "var(--font-lexend), system-ui, sans-serif",
                transform: "skewX(-12deg)",
                boxShadow: "4px 4px 0px #000",
              }}
            >
              <span
                style={{ transform: "skewX(12deg)", display: "inline-block" }}
              >
                <Mail className="w-4 h-4 inline mr-1" />
                Contact / Collab
              </span>
            </motion.a>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t-2 border-[#E0E0E0]/10 mb-8" />

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Copyright */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center md:text-left"
          >
            <p className="text-[#E0E0E0]/60 text-sm font-mono">
              &copy; {new Date().getFullYear()} PIKO. All Rights Reserved.
            </p>
          </motion.div>

          {/* Built By Credit */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="flex items-center gap-2"
          >
            <span className="text-[#E0E0E0]/60 text-sm font-mono">
              Site Built by
            </span>
            <a
              href="https://www.bearcavemarketing.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-1 text-[#FFD700] hover:text-[#FFD700]/80 transition-colors duration-300 font-bold text-sm"
            >
              Jacob Darling
              <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" />
            </a>
          </motion.div>
        </div>

        {/* Decorative Corner Accents */}
        <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-[#FFD700]/30 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-[#FFD700]/30 pointer-events-none" />
      </div>
    </footer>
  );
}
