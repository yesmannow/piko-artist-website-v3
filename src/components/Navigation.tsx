"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useHaptic } from "@/hooks/useHaptic";

export function Navigation() {
  const triggerHaptic = useHaptic();
  const pathname = usePathname();
  const navLinks = [
    { href: "/#home", label: "Home" },
    { href: "/#rap-sheet", label: "About" },
    { href: "/music", label: "Music" },
    { href: "/videos", label: "Videos" },
    { href: "/events", label: "Tour" },
    { href: "/beatmaker", label: "Studio" },
    { href: "/#contact", label: "Contact" },
  ];

  const isActive = (href: string) => {
    if (href === "/#home" || href === "/") {
      return pathname === "/";
    }
    return pathname === href || pathname.startsWith(href.replace("#", ""));
  };

  return (
    <nav
      className="sticky top-0 z-50 w-full backdrop-blur-md border-b-2 border-black"
      style={{
        backgroundColor: "rgba(42, 42, 42, 0.85)",
        backgroundImage: "url('https://www.transparenttextures.com/patterns/concrete-wall.png')",
        backgroundBlendMode: "overlay",
      }}
    >
      {/* Mobile Header - Logo Only */}
      <div className="md:hidden flex items-center justify-center h-16 px-4">
        <Link href="/" onClick={() => triggerHaptic()}>
          <Image
            src="/images/branding/piko-logo.png"
            alt="Piko Logo"
            width={120}
            height={48}
            className="h-10 w-auto"
          />
        </Link>
      </div>

      {/* Desktop Navigation - Hidden on Mobile */}
      <div className="hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center flex-wrap gap-2 sm:gap-4 md:gap-6 lg:space-x-8">
              {navLinks.map((link) => {
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => triggerHaptic()}
                    className="group relative transition-colors"
                  >
                    <motion.span
                      className={`inline-block text-sm sm:text-base md:text-lg transition-colors ${
                        active
                          ? "font-header text-toxic-lime"
                          : "font-industrial text-zinc-400 font-medium tracking-normal"
                      }`}
                      whileHover={{
                        color: "#ccff00",
                      }}
                      transition={{ duration: 0.2 }}
                    >
                      {link.label}
                    </motion.span>
                    {/* Underline effect on hover/active */}
                    <motion.div
                      className="absolute bottom-0 left-0 h-0.5 bg-toxic-lime"
                      initial={{ width: active ? "100%" : "0%" }}
                      whileHover={{ width: "100%" }}
                      transition={{ duration: 0.3 }}
                    />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

