"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export function Navigation() {
  const navLinks = [
    { href: "/#home", label: "Home" },
    { href: "/#bio", label: "About" },
    { href: "/music", label: "Music" },
    { href: "/videos", label: "Videos" },
    { href: "/beatmaker", label: "Beat Maker" },
    { href: "/guestbook", label: "Guestbook" },
    { href: "/#contact", label: "Contact" },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full bg-black/50 backdrop-blur-md border-b border-neon-green/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group relative font-tag text-lg text-foreground transition-colors"
              >
                <motion.span
                  className="inline-block"
                  whileHover={{
                    rotate: -3,
                  }}
                  transition={{ type: "spring", stiffness: 300 }}
                  style={{
                    filter: "drop-shadow(0 0 0px transparent)",
                  }}
                >
                  <motion.span
                    className="inline-block"
                    whileHover={{
                      textShadow: "0 0 10px hsl(var(--neon-green)), 0 0 20px hsl(var(--neon-green)), 0 0 30px hsl(var(--neon-green))",
                      color: "hsl(var(--neon-green))",
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    {link.label}
                  </motion.span>
                </motion.span>
                {/* Underline effect on hover */}
                <motion.div
                  className="absolute bottom-0 left-0 w-0 h-0.5 bg-neon-green"
                  whileHover={{ width: "100%" }}
                  transition={{ duration: 0.3 }}
                />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}

