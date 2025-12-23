"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Home, Music, Wrench, Calendar } from "lucide-react";
import { useHaptic } from "@/hooks/useHaptic";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/music", label: "Music", icon: Music },
  { href: "/beatmaker", label: "Studio", icon: Wrench },
  { href: "/events", label: "Tour", icon: Calendar },
];

export function MobileNav() {
  const pathname = usePathname();
  const triggerHaptic = useHaptic();

  const handleClick = () => {
    triggerHaptic();
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-zinc-900 border-t-2 border-toxic-lime shadow-[0_-4px_0_0_rgba(0,0,0,1)]">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href === "/" && pathname === "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleClick}
              className="flex flex-col items-center justify-center flex-1 h-full relative"
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                className="flex flex-col items-center gap-1"
              >
                <Icon
                  className={`w-6 h-6 transition-colors ${
                    isActive ? "text-toxic-lime" : "text-foreground/60"
                  }`}
                />
                <span
                  className={`text-[10px] font-tag uppercase tracking-wider ${
                    isActive ? "text-toxic-lime" : "text-foreground/60"
                  }`}
                >
                  {item.label}
                </span>
              </motion.div>
              {isActive && (
                <motion.div
                  layoutId="mobileNavIndicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-toxic-lime rounded-b-full"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

