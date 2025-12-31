"use client";

import Link from "next/link";
import { Home, Music, Video, Calendar, Settings } from "lucide-react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

/**
 * TacticalBar - Bottom-fixed navigation for mobile
 *
 * V3 Urban Syndicate: Brutalist navigation bar with -6deg skew on mobile
 * Features spray-drip accent highlights for active routes.
 */
export function TacticalBar() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", icon: Home, label: "HOME" },
    { href: "/music", icon: Music, label: "MUSIC" },
    { href: "/videos", icon: Video, label: "VIDEOS" },
    { href: "/tour", icon: Calendar, label: "TOUR" },
    { href: "/studio", icon: Settings, label: "STUDIO" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Background with brutalist styling */}
      <div className="bg-[#050505] border-t-4 border-[#E0E0E0]">
        <div className="flex items-center justify-around px-2 py-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex flex-col items-center gap-1 px-3 py-2 transition-all"
                data-urban="skew"
              >
                {/* Active Indicator - Spray Drip */}
                {isActive && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute -top-1 left-1/2 -translate-x-1/2"
                  >
                    <img
                      src="/images/branding/spray-drip-accent.svg"
                      alt=""
                      className="w-3 h-5"
                    />
                  </motion.div>
                )}

                {/* Icon */}
                <div className="relative">
                  <Icon
                    size={20}
                    className={`transition-colors ${
                      isActive ? "text-[#FFD700]" : "text-[#E0E0E0]/60"
                    }`}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </div>

                {/* Label */}
                <span
                  className={`text-[8px] font-mono uppercase tracking-wider transition-colors ${
                    isActive
                      ? "text-[#FFD700] font-bold"
                      : "text-[#E0E0E0]/50"
                  }`}
                >
                  {item.label}
                </span>

                {/* Active Border Bottom */}
                {isActive && (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    className="absolute bottom-0 left-0 h-0.5 bg-[#FFD700]"
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Safe area spacer for iOS */}
      <div className="h-safe-area-inset-bottom bg-[#050505]" />
    </nav>
  );
}

