"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export function SectionHeader({ title, subtitle, className = "" }: SectionHeaderProps) {
  const navLinks = [
    { href: "/music", label: "Music" },
    { href: "/videos", label: "Videos" },
    { href: "/#bio", label: "About" },
    { href: "/#contact", label: "Contact" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
      className={`text-center mb-12 ${className}`}
    >
      {/* Logo with Neon Glow effect */}
      <motion.div
        className="relative inline-block group cursor-default mb-4"
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <Image
          src="/images/branding/piko-logo.png"
          alt="Piko Logo"
          width={200}
          height={80}
          className="relative z-10 transition-all duration-300 group-hover:drop-shadow-[0_0_10px_hsl(var(--neon-pink)),0_0_20px_hsl(var(--neon-pink)),0_0_30px_hsl(var(--neon-green)),0_0_40px_hsl(var(--neon-green))]"
        />
      </motion.div>

      {/* Title text (if title prop is provided and different from logo) */}
      {title && title !== "Piko" && (
        <motion.h2
          className="text-4xl md:text-5xl font-bold mb-4 font-graffiti relative inline-block group cursor-default"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <span className="relative z-10 bg-gradient-to-r from-neon-pink to-neon-green bg-clip-text text-transparent">
            {title}
          </span>

          {/* Wet paint glow effect */}
          <motion.span
            className="absolute inset-0 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{
              textShadow: `
                0 0 10px hsl(var(--neon-pink)),
                0 0 20px hsl(var(--neon-pink)),
                0 0 30px hsl(var(--neon-green)),
                0 0 40px hsl(var(--neon-green))
              `,
            }}
          >
            <span className="bg-gradient-to-r from-neon-pink to-neon-green bg-clip-text text-transparent">
              {title}
            </span>
          </motion.span>

          {/* Drip effect on hover */}
          <motion.div
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-0 bg-gradient-to-b from-neon-pink to-transparent opacity-0 group-hover:opacity-100 group-hover:h-8 transition-all duration-500"
          />
          <motion.div
            className="absolute -bottom-2 left-1/2 translate-x-2 w-1 h-0 bg-gradient-to-b from-neon-green to-transparent opacity-0 group-hover:opacity-100 group-hover:h-6 transition-all duration-500 delay-100"
          />
        </motion.h2>
      )}

      {subtitle && (
        <motion.p
          className="text-lg text-muted-foreground max-w-2xl mx-auto font-tag"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
        >
          {subtitle}
        </motion.p>
      )}

      {/* Quick links (Hybrid navigation) */}
      <div className="mt-6 flex flex-wrap justify-center gap-x-8 gap-y-3">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="font-tag text-lg text-foreground/80 hover:text-neon-green transition-colors"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </motion.div>
  );
}
