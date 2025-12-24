"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Home, User, Video, MoreVertical, Music, Wrench, Calendar, Mail, X } from "lucide-react";
import { useHaptic } from "@/hooks/useHaptic";
import { Drawer } from "vaul";
import { useState, useEffect, useRef } from "react";
import Logo from "@/components/branding/Logo";
import { useAudio } from "@/context/AudioContext";

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

// Grain texture - using CSS class approach
const grainStyle = {
  backgroundImage:
    'url("data:image/svg+xml,%3Csvg%20width%3D%27100%27%20height%3D%27100%27%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%3E%3Cfilter%20id%3D%27noise%27%3E%3CfeTurbulence%20type%3D%27fractalNoise%27%20baseFrequency%3D%270.9%27%20numOctaves%3D%273%27/%3E%3C/filter%3E%3Crect%20width%3D%27100%25%27%20height%3D%27100%25%27%20filter%3D%27url(%23noise)%27%20opacity%3D%270.04%27/%3E%3C/svg%3E")',
};

export function MobileNav() {
  const pathname = usePathname();
  const triggerHaptic = useHaptic();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const logoRef = useRef<HTMLDivElement>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { currentTrack, isPlaying } = useAudio();

  // Close mobile menu drawer on route change
  useEffect(() => {
    setIsMoreOpen(false);
    setIsAboutOpen(false);
  }, [pathname]);

  const handleClick = () => {
    triggerHaptic();
  };

  const isActive = (href: string) => {
    if (href === "/#home" || href === "/") {
      return pathname === "/";
    }
    return pathname === href || pathname.startsWith(href.replace("#", ""));
  };

  // Long press handler for About Piko panel
  const handleLogoPressStart = () => {
    longPressTimerRef.current = setTimeout(() => {
      triggerHaptic();
      setIsAboutOpen(true);
    }, 500); // 500ms long press
  };

  const handleLogoPressEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  // Set data-modal-open on About panel
  useEffect(() => {
    if (isAboutOpen) {
      const panel = document.getElementById("about-piko-panel");
      if (panel) {
        panel.setAttribute("data-modal-open", "true");
      }
    } else {
      const panel = document.getElementById("about-piko-panel");
      if (panel) {
        panel.removeAttribute("data-modal-open");
      }
    }
  }, [isAboutOpen]);

  return (
    <>
      {/* Now Playing Pill */}
      {currentTrack && isPlaying && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          className="fixed bottom-20 left-4 right-4 z-40 md:hidden"
        >
          <Link
            href="/music"
            onClick={handleClick}
            className="block bg-zinc-900/95 backdrop-blur-md border border-toxic-lime/30 rounded-full px-4 py-2 shadow-lg"
            style={grainStyle}
          >
            <div className="flex items-center gap-2 text-xs text-toxic-lime">
              <div className="w-2 h-2 bg-toxic-lime rounded-full animate-pulse" />
              <span className="font-bold uppercase tracking-wider truncate">
                Now Playing: {currentTrack.title}
              </span>
            </div>
          </Link>
        </motion.div>
      )}

      {/* Main Tray Nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-gradient-to-t from-zinc-950 via-zinc-900 to-zinc-950 border-t border-toxic-lime/20 shadow-[0_-4px_20px_rgba(0,0,0,0.8)] pb-[env(safe-area-inset-bottom)]"
        style={grainStyle}
      >
        <div className="flex items-center h-16 px-2 min-h-[44px] gap-2">
          {/* Logo - Left side with long press */}
          <div id="nav-logo-anchor" className="flex-shrink-0">
            <div
              ref={logoRef}
              onTouchStart={handleLogoPressStart}
              onTouchEnd={handleLogoPressEnd}
              onMouseDown={handleLogoPressStart}
              onMouseUp={handleLogoPressEnd}
              onMouseLeave={handleLogoPressEnd}
              className="relative"
            >
              <Link
                href="/"
                onClick={(e) => {
                  if (longPressTimerRef.current) {
                    e.preventDefault();
                  }
                  handleClick();
                }}
                className="flex items-center justify-center min-h-[44px] min-w-[44px] touch-manipulation"
                aria-label="Go to Home"
              >
                <motion.div whileTap={{ scale: 0.9 }}>
                  <Logo size={32} className="drop-shadow-[0_0_8px_rgba(204,255,0,0.3)]" />
                </motion.div>
              </Link>
            </div>
          </div>

          {/* Nav items - Right side with even spacing */}
          <div className="flex items-center justify-end flex-1 gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleClick}
                  className="flex flex-col items-center justify-center h-full relative min-h-[44px] px-3 flex-1 touch-manipulation"
                >
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                    className="flex flex-col items-center gap-1"
                  >
                    <Icon
                      className={`w-6 h-6 transition-colors ${
                        active ? "text-toxic-lime" : "text-zinc-400"
                      }`}
                    />
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider ${
                        active ? "text-toxic-lime" : "text-zinc-500"
                      }`}
                    >
                      {item.label}
                    </span>
                  </motion.div>
                  {/* Active indicator - animated pill */}
                  {active && (
                    <motion.div
                      layoutId="mobileNavIndicator"
                      className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-1 bg-toxic-lime rounded-b-full shadow-[0_0_8px_rgba(204,255,0,0.6)]"
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
                  className="flex flex-col items-center justify-center h-full relative min-h-[44px] px-3 flex-1 touch-manipulation"
                >
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                    className="flex flex-col items-center gap-1"
                  >
                    <MoreVertical
                      className={`w-6 h-6 transition-colors ${
                        isMoreOpen ? "text-toxic-lime" : "text-zinc-400"
                      }`}
                    />
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider ${
                        isMoreOpen ? "text-toxic-lime" : "text-zinc-500"
                      }`}
                    >
                      More
                    </span>
                  </motion.div>
                  {isMoreOpen && (
                    <motion.div
                      layoutId="mobileNavIndicatorMore"
                      className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-1 bg-toxic-lime rounded-b-full shadow-[0_0_8px_rgba(204,255,0,0.6)]"
                      initial={false}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </button>
              </Drawer.Trigger>
              <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 bg-black/60 z-50" />
                <Drawer.Content
                  className="border-t-2 border-toxic-lime flex flex-col rounded-t-[10px] h-[50%] mt-24 fixed bottom-0 left-0 right-0 z-50 focus:outline-none relative bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950"
                  style={grainStyle}
                >
                  {/* Drag Handle */}
                  <div className="relative w-12 h-2 mx-auto mb-6 mt-4">
                    <div className="w-12 h-2 bg-zinc-700 rounded-sm mx-auto border border-zinc-600" />
                  </div>

                  <div className="flex-1 overflow-y-auto px-6 pb-8">
                    <h2 className="font-header text-2xl font-bold text-toxic-lime mb-6 text-center uppercase tracking-wider">
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
                              className={`flex items-center gap-4 px-4 py-3 rounded-lg border-2 transition-colors ${
                                active
                                  ? "bg-toxic-lime/20 text-toxic-lime border-toxic-lime shadow-[0_0_12px_rgba(204,255,0,0.3)]"
                                  : "bg-zinc-800/50 text-white border-zinc-700 hover:bg-zinc-700/50 hover:border-zinc-600"
                              }`}
                            >
                              <Icon className="w-5 h-5" />
                              <span className="font-bold uppercase tracking-wider">
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
        </div>
      </nav>

      {/* About Piko Panel */}
      <AnimatePresence>
        {isAboutOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[60] md:hidden"
              onClick={() => setIsAboutOpen(false)}
            />
            <motion.div
              id="about-piko-panel"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[61] md:hidden bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 border-t-2 border-toxic-lime rounded-t-2xl shadow-2xl pb-[env(safe-area-inset-bottom)]"
              style={grainStyle}
            >
              <div className="px-6 pt-4 pb-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-toxic-lime uppercase tracking-wider">
                    PIKO FG
                  </h2>
                  <button
                    onClick={() => setIsAboutOpen(false)}
                    className="p-2 text-zinc-400 hover:text-toxic-lime transition-colors touch-manipulation"
                    aria-label="Close"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Quick Links */}
                <div className="space-y-3">
                  <Link
                    href="/music"
                    onClick={() => {
                      setIsAboutOpen(false);
                      handleClick();
                    }}
                    className="flex items-center gap-4 px-4 py-3 rounded-lg border-2 border-zinc-700 bg-zinc-800/50 text-white hover:bg-zinc-700/50 hover:border-toxic-lime/50 transition-colors touch-manipulation"
                  >
                    <Music className="w-5 h-5" />
                    <span className="font-bold uppercase tracking-wider">Listen</span>
                  </Link>
                  <Link
                    href="/videos"
                    onClick={() => {
                      setIsAboutOpen(false);
                      handleClick();
                    }}
                    className="flex items-center gap-4 px-4 py-3 rounded-lg border-2 border-zinc-700 bg-zinc-800/50 text-white hover:bg-zinc-700/50 hover:border-toxic-lime/50 transition-colors touch-manipulation"
                  >
                    <Video className="w-5 h-5" />
                    <span className="font-bold uppercase tracking-wider">Videos</span>
                  </Link>
                  <Link
                    href="/events"
                    onClick={() => {
                      setIsAboutOpen(false);
                      handleClick();
                    }}
                    className="flex items-center gap-4 px-4 py-3 rounded-lg border-2 border-zinc-700 bg-zinc-800/50 text-white hover:bg-zinc-700/50 hover:border-toxic-lime/50 transition-colors touch-manipulation"
                  >
                    <Calendar className="w-5 h-5" />
                    <span className="font-bold uppercase tracking-wider">Tour</span>
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
