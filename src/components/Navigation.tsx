"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useHaptic } from "@/hooks/useHaptic";
import { useState, useEffect } from "react";

export function Navigation() {
  const triggerHaptic = useHaptic();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const navLinks = [
    { href: "/", label: "Home", path: "/" },
    { href: "/#rap-sheet", label: "About", path: "/" },
    { href: "/music", label: "Music", path: "/music" },
    { href: "/videos", label: "Videos", path: "/videos" },
    { href: "/tour", label: "Tour", path: "/tour" },
    { href: "/beatmaker", label: "Studio", path: "/beatmaker" },
    { href: "/#contact", label: "Contact", path: "/" },
  ];

  const isActive = (item: typeof navLinks[0]) => {
    if (item.path === "/" && (item.href === "/#home" || item.href === "/")) {
      return pathname === "/";
    }
    return pathname === item.path || pathname.startsWith(item.path);
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
      {isMounted && (
        <div className="hidden md:block">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center flex-wrap gap-2 sm:gap-4 md:gap-6 lg:space-x-8">
                {navLinks.map((link) => {
                  const active = isActive(link);
                  return (
                    <div key={link.href} className="relative">
                      <Link
                        href={link.href}
                        onClick={() => triggerHaptic()}
                        className={`text-sm sm:text-base md:text-lg font-bold uppercase tracking-widest transition-colors ${
                          active
                            ? "text-white"
                            : "text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        {link.label}
                      </Link>
                      {active && (
                        <motion.div
                          layoutId="nav-underline"
                          className="absolute -bottom-2 left-0 right-0 h-[2px] bg-[#ccff00] shadow-[0_0_10px_#ccff00]"
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

