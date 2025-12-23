"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Home, User, Video, MoreVertical, Music, Wrench, Calendar, Mail } from "lucide-react";
import { useHaptic } from "@/hooks/useHaptic";
import { Drawer } from "vaul";
import { useState } from "react";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/#rap-sheet", label: "About", icon: User },
  { href: "/videos", label: "Videos", icon: Video },
];

const moreItems = [
  { href: "/music", label: "Music", icon: Music },
  { href: "/beatmaker", label: "Studio", icon: Wrench },
  { href: "/events", label: "Tour", icon: Calendar },
  { href: "/#contact", label: "Contact", icon: Mail },
];

export function MobileNav() {
  const pathname = usePathname();
  const triggerHaptic = useHaptic();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const handleClick = () => {
    triggerHaptic();
  };

  const isActive = (href: string) => {
    if (href === "/#home" || href === "/") {
      return pathname === "/";
    }
    return pathname === href || pathname.startsWith(href.replace("#", ""));
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-zinc-900/95 backdrop-blur-md border-t border-toxic-lime shadow-[0_-4px_0_0_rgba(0,0,0,1)] pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around h-16 px-2 min-h-[44px]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleClick}
                className="flex flex-col items-center justify-center flex-1 h-full relative min-h-[44px]"
              >
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className="flex flex-col items-center gap-1"
                >
                  <Icon
                    className={`w-6 h-6 transition-colors ${
                      active ? "text-toxic-lime" : "text-foreground/60"
                    }`}
                  />
                  <span
                    className={`text-[10px] font-tag uppercase tracking-wider ${
                      active ? "text-toxic-lime" : "text-foreground/60"
                    }`}
                  >
                    {item.label}
                  </span>
                </motion.div>
                {active && (
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

          {/* More Button */}
          <Drawer.Root open={isMoreOpen} onOpenChange={setIsMoreOpen}>
            <Drawer.Trigger asChild>
              <button
                onClick={handleClick}
                className="flex flex-col items-center justify-center flex-1 h-full relative min-h-[44px]"
              >
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className="flex flex-col items-center gap-1"
                >
                  <MoreVertical
                    className={`w-6 h-6 transition-colors ${
                      isMoreOpen ? "text-toxic-lime" : "text-foreground/60"
                    }`}
                  />
                  <span
                    className={`text-[10px] font-tag uppercase tracking-wider ${
                      isMoreOpen ? "text-toxic-lime" : "text-foreground/60"
                    }`}
                  >
                    More
                  </span>
                </motion.div>
                {isMoreOpen && (
                  <motion.div
                    layoutId="mobileNavIndicatorMore"
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-toxic-lime rounded-b-full"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            </Drawer.Trigger>
            <Drawer.Portal>
              <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
              <Drawer.Content
                className="border-t-2 border-toxic-lime flex flex-col rounded-t-[10px] h-[50%] mt-24 fixed bottom-0 left-0 right-0 z-50 focus:outline-none relative"
                style={{
                  backgroundColor: "#2a2a2a",
                  backgroundImage: `
                    linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)),
                    url("https://www.transparenttextures.com/patterns/concrete-wall.png")
                  `,
                  backgroundBlendMode: "overlay",
                }}
              >
                {/* Drag Handle - Fader Cap Style */}
                <div className="relative w-12 h-2 mx-auto mb-6 mt-4">
                  <div className="w-12 h-2 bg-zinc-600 rounded-sm mx-auto relative border border-black shadow-md after:content-[''] after:absolute after:top-0 after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-0.5 after:bg-white" />
                </div>

                <div className="flex-1 overflow-y-auto px-6 pb-8">
                  <h2 className="font-header text-2xl font-bold text-white mb-6 text-center">
                    More
                  </h2>
                  <div className="space-y-3">
                    {moreItems.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.href);
                      return (
                        <Drawer.Close key={item.href} asChild>
                          <Link
                            href={item.href}
                            onClick={handleClick}
                            className={`flex items-center gap-4 px-4 py-3 rounded-lg border-2 border-black transition-colors ${
                              active
                                ? "bg-toxic-lime/20 text-toxic-lime border-toxic-lime"
                                : "bg-zinc-800/50 text-white hover:bg-zinc-700/50"
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                            <span className="font-industrial font-bold uppercase tracking-wider">
                              {item.label}
                            </span>
                          </Link>
                        </Drawer.Close>
                      );
                    })}
                  </div>
                </div>
              </Drawer.Content>
            </Drawer.Portal>
          </Drawer.Root>
        </div>
      </nav>
    </>
  );
}

