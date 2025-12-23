"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useHaptic } from "@/hooks/useHaptic";

export function Navigation() {
  const triggerHaptic = useHaptic();
  const navLinks = [
    { href: "/#home", label: "Home" },
    { href: "/#rap-sheet", label: "About" },
    { href: "/music", label: "Music" },
    { href: "/videos", label: "Videos" },
    { href: "/events", label: "Tour" },
    { href: "/beatmaker", label: "Studio" },
    { href: "/#contact", label: "Contact" },
  ];

  return (
    <nav
      className="sticky top-0 z-50 w-full backdrop-blur-md border-b-2 border-black"
      style={{
        backgroundColor: "rgba(42, 42, 42, 0.85)",
        backgroundImage: "url('https://www.transparenttextures.com/patterns/concrete-wall.png')",
        backgroundBlendMode: "overlay",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center flex-wrap gap-2 sm:gap-4 md:gap-6 lg:space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => triggerHaptic()}
                className="group relative font-tag text-sm sm:text-base md:text-lg text-foreground transition-colors"
              >
                <motion.span
                  className="inline-block"
                  whileHover={{
                    rotate: -3,
                  }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <motion.span
                    className="inline-block"
                    whileHover={{
                      textShadow: "0 0 10px #ccff00, 0 0 20px #ccff00",
                      color: "#ccff00",
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    {link.label}
                  </motion.span>
                </motion.span>
                {/* Underline effect on hover */}
                <motion.div
                  className="absolute bottom-0 left-0 w-0 h-0.5 bg-toxic-lime"
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

