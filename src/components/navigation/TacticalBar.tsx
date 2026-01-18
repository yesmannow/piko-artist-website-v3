"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  labsNavItems,
  primaryNavItems,
  type NavItem,
} from "@/config/nav.config";
import { useUIStore } from "@/store/useUIStore";
import { LabsToggle } from "@/components/ui/LabsToggle";

/**
 * TacticalBar - Bottom-fixed navigation for mobile
 *
 * V3 Urban Syndicate: Brutalist navigation bar with -6deg skew on mobile
 * Features spray-drip accent highlights for active routes.
 */
export function TacticalBar({ labsEnabled = false }: { labsEnabled?: boolean }) {
  const pathname = usePathname();
  const labsFromStore = useUIStore((state) => state.labsEnabled);

  const navConfig: NavItem[] =
    labsEnabled || labsFromStore ? labsNavItems : primaryNavItems;
  const allowed = new Set(["/", "/music", "/videos", "/studio", "/contact"]);
  const navItems = navConfig.filter((item) => allowed.has(item.href));

  if (labsEnabled || labsFromStore) {
    const timeline = navConfig.find((item) => item.href === "/timeline");
    if (timeline) navItems.push(timeline);
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="flex items-center justify-end px-3 py-2 bg-[#050505]/90 border-t border-[#E0E0E0]/10">
        <LabsToggle />
      </div>
      {/* Background with brutalist styling */}
      <div className="bg-[#050505] border-t-4 border-[#E0E0E0]">
        <div className="flex items-center justify-around px-2 py-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            if (!Icon) return null;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex flex-col items-center gap-1 px-3 py-2 transition-all"
                data-urban="skew"
                data-active={isActive ? "true" : "false"}
              >
                {/* Active Indicator - Spray Drip */}
                {isActive && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute -top-1 left-1/2 -translate-x-1/2"
                  >
                    <Image
                      src="/images/branding/spray-drip-accent.svg"
                      alt=""
                      width={12}
                      height={20}
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
                    isActive ? "text-[#FFD700] font-bold drop-shadow-[0_0_8px_rgba(255,215,0,0.45)]" : "text-[#E0E0E0]/50"
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
