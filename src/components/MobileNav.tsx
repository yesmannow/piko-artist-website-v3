"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Home, User, Video, MoreVertical, Music, Wrench, Calendar, Mail, X, Instagram, Youtube, ExternalLink } from "lucide-react";
import { useHaptic } from "@/hooks/useHaptic";
import { useState, useEffect, useRef } from "react";
import Logo from "@/components/branding/Logo";
import { useAudio } from "@/context/AudioContext";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { useFocusTrap } from "@/hooks/useFocusTrap";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/#rap-sheet", label: "About", icon: User },
  { href: "/videos", label: "Videos", icon: Video },
];

const moreItems = [
  { href: "/music", label: "Music", icon: Music },
  { href: "/studio", label: "Studio", icon: Wrench },
  { href: "/#contact", label: "Contact", icon: Mail },
];

// Social links for mobile menu
const socialLinks = [
  {
    name: "Instagram",
    url: "https://www.instagram.com/piko289/",
    icon: Instagram,
  },
  {
    name: "YouTube",
    url: "https://www.youtube.com/channel/UCjHQIImynicoSZuFmt6Rdig",
    icon: Youtube,
  },
  {
    name: "Spotify",
    url: "https://open.spotify.com/artist/piko", // Placeholder - update with actual URL
    icon: Music,
  },
  {
    name: "Apple Music",
    url: "https://music.apple.com/artist/piko", // Placeholder - update with actual URL
    icon: Music,
  },
];

// Grain texture - using CSS class approach
const grainStyle = {
  backgroundImage:
    'url("data:image/svg+xml,%3Csvg%20width%3D%27100%27%20height%3D%27100%27%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%3E%3Cfilter%20id%3D%27noise%27%3E%3CfeTurbulence%20type%3D%27fractalNoise%27%20baseFrequency%3D%270.9%27%20numOctaves%3D%273%27/%3E%3C/filter%3E%3Crect%20width%3D%27100%25%27%20height%3D%27100%25%27%20filter%3D%27url(%23noise)%27%20opacity%3D%270.04%27/%3E%3C/svg%3E")',
};

export function MobileNav() {
  const pathname = usePathname();
  const { triggerHaptic } = useHaptic();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const logoRef = useRef<HTMLDivElement>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const drawerContentRef = useRef<HTMLDivElement>(null);
  const { currentTrack, isPlaying } = useAudio();

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Body scroll lock when drawer is open
  useBodyScrollLock(isMoreOpen);

  // Focus trap for drawer
  useFocusTrap(isMoreOpen, drawerContentRef);

  // Close mobile menu drawer on route change
  useEffect(() => {
    setIsMoreOpen(false);
    setIsAboutOpen(false);
  }, [pathname]);

  const handleClick = () => {
    triggerHaptic();
  };

  // Handle More button click - manually toggle drawer
  const handleMoreClick = () => {
    triggerHaptic();
    setIsMoreOpen(!isMoreOpen);
  };

  // Close drawer on ESC key
  useEffect(() => {
    if (!isMoreOpen) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMoreOpen(false);
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isMoreOpen]);

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
                  <Logo size={32} className="drop-shadow-[0_0_8px_rgba(255,215,0,0.3)]" />
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
                      className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-1 bg-toxic-lime rounded-b-full shadow-[0_0_8px_rgba(255,215,0,0.6)]"
                      initial={false}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}

            {/* More Button */}
            <button
              onClick={handleMoreClick}
              aria-expanded={isMoreOpen}
              aria-controls="mobile-more-menu"
              aria-label="More menu"
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
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-1 bg-toxic-lime rounded-b-full shadow-[0_0_8px_rgba(255,215,0,0.6)]"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>

            {/* More Menu Drawer */}
            <AnimatePresence>
              {isMoreOpen && (
                <>
                  {/* Backdrop Overlay */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: reducedMotion ? 0.1 : 0.2 }}
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm z-overlay md:hidden"
                    onClick={() => setIsMoreOpen(false)}
                    aria-hidden="true"
                  />

                  {/* Drawer Content */}
                  <motion.div
                    ref={drawerContentRef}
                    id="mobile-more-menu"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="more-menu-title"
                    initial={reducedMotion ? { opacity: 0, y: "100%" } : { y: "100%" }}
                    animate={reducedMotion ? { opacity: 1, y: 0 } : { y: 0 }}
                    exit={reducedMotion ? { opacity: 0, y: "100%" } : { y: "100%" }}
                    transition={
                      reducedMotion
                        ? { duration: 0.2 }
                        : {
                            type: "spring",
                            damping: 30,
                            stiffness: 300,
                            mass: 0.8,
                          }
                    }
                    className="fixed bottom-0 left-0 right-0 z-modal md:hidden bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 border-t-2 border-toxic-lime rounded-t-2xl shadow-2xl pb-[env(safe-area-inset-bottom)] max-h-[85vh] flex flex-col"
                    style={grainStyle}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Glow effect at top */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-toxic-lime/50 blur-sm" />

                    {/* Drag Handle */}
                    <div className="relative w-12 h-1.5 mx-auto mt-3 mb-4">
                      <div className="w-12 h-1.5 bg-zinc-700 rounded-full mx-auto border border-zinc-600" />
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto px-6 pb-6">
                      {/* Header */}
                      <h2
                        id="more-menu-title"
                        className="font-header text-2xl font-bold text-toxic-lime mb-6 text-center uppercase tracking-wider"
                      >
                        More
                      </h2>

                      {/* Menu Items */}
                      <div className="space-y-3 mb-6">
                        {moreItems.map((item) => {
                          const Icon = item.icon;
                          const active = isActive(item.href);
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => {
                                handleClick();
                                setIsMoreOpen(false);
                              }}
                              className={`flex items-center gap-4 px-4 py-3 rounded-lg border-2 transition-all touch-manipulation ${
                                active
                                  ? "bg-toxic-lime/20 text-toxic-lime border-toxic-lime shadow-[0_0_12px_rgba(255,215,0,0.3)]"
                                  : "bg-zinc-800/50 text-white border-zinc-700 hover:bg-zinc-700/50 hover:border-toxic-lime/30 active:scale-[0.98]"
                              }`}
                            >
                              <Icon className="w-5 h-5 flex-shrink-0" />
                              <span className="font-bold uppercase tracking-wider">
                                {item.label}
                              </span>
                            </Link>
                          );
                        })}
                      </div>

                      {/* Social Icons Row */}
                      <div className="mb-6">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3 text-center">
                          Connect
                        </h3>
                        <div className="flex items-center justify-center gap-4">
                          {socialLinks.map((link) => {
                            const Icon = link.icon;
                            return (
                              <motion.a
                                key={link.name}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`Follow on ${link.name}`}
                                whileTap={{ scale: 0.9 }}
                                className="group relative p-3 rounded-full bg-zinc-800/50 border border-zinc-700 hover:border-toxic-lime/50 transition-all touch-manipulation"
                              >
                                <div className="absolute inset-0 bg-toxic-lime/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity rounded-full" />
                                <Icon className="w-5 h-5 text-zinc-400 group-hover:text-toxic-lime transition-colors relative z-10" />
                              </motion.a>
                            );
                          })}
                        </div>
                      </div>

                      {/* Secondary Actions */}
                      <div className="space-y-2 border-t border-zinc-800 pt-4">
                        <button
                          onClick={() => {
                            handleClick();
                            setIsMoreOpen(false);
                            // Scroll to contact or open contact modal
                            const contactEl = document.getElementById("contact");
                            if (contactEl) {
                              contactEl.scrollIntoView({ behavior: "smooth" });
                            }
                          }}
                          className="w-full px-4 py-3 rounded-lg border-2 border-toxic-lime/30 bg-zinc-800/30 text-white hover:bg-toxic-lime/10 hover:border-toxic-lime/50 transition-all touch-manipulation active:scale-[0.98]"
                        >
                          <span className="font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2">
                            <Mail className="w-4 h-4" />
                            Book / Contact
                          </span>
                        </button>
                        <button
                          onClick={() => {
                            handleClick();
                            // Placeholder for press kit action
                            window.open("/press-kit", "_blank");
                          }}
                          className="w-full px-4 py-3 rounded-lg border-2 border-zinc-700 bg-zinc-800/30 text-zinc-400 hover:bg-zinc-700/50 hover:text-white transition-all touch-manipulation active:scale-[0.98]"
                        >
                          <span className="font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2">
                            <ExternalLink className="w-4 h-4" />
                            Press Kit
                          </span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
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
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

/*
 * TEST PLAN - Mobile "More" Menu
 *
 * ✅ FUNCTIONALITY
 * - [ ] Tap "More" button → drawer opens from bottom
 * - [ ] Tap backdrop → drawer closes
 * - [ ] Tap menu item → navigates and closes drawer
 * - [ ] Tap social icon → opens in new tab
 * - [ ] Tap "Book / Contact" → scrolls to contact section
 * - [ ] Tap "Press Kit" → opens press kit page
 * - [ ] ESC key → closes drawer
 * - [ ] Route change → drawer closes automatically
 *
 * ✅ VISUAL / POLISH
 * - [ ] Drawer animates smoothly (spring motion)
 * - [ ] Backdrop has blur effect
 * - [ ] Glow effect visible at top of drawer
 * - [ ] Active menu item highlighted with toxic-lime
 * - [ ] Social icons have hover glow effect
 * - [ ] Tap feedback (scale down) on all interactive elements
 * - [ ] Reduced motion preference respected
 *
 * ✅ ACCESSIBILITY
 * - [ ] Focus trap works (Tab cycles through items)
 * - [ ] ESC key closes drawer
 * - [ ] aria-expanded updates on button
 * - [ ] aria-controls links button to drawer
 * - [ ] aria-modal="true" on drawer
 * - [ ] Keyboard navigation works
 * - [ ] Screen reader announces drawer state
 *
 * ✅ PERFORMANCE / STABILITY
 * - [ ] No console errors
 * - [ ] No layout shift when opening
 * - [ ] No infinite re-renders
 * - [ ] Body scroll locked when open
 * - [ ] Z-index correct (above hero/background)
 * - [ ] No memory leaks on route change
 *
 * ✅ MOBILE DEVICES
 * - [ ] iPhone Safari (iOS 15+)
 * - [ ] iPhone Chrome
 * - [ ] Android Chrome
 * - [ ] Safe-area insets work (notch/status bar)
 * - [ ] Touch targets >= 44px
 * - [ ] No horizontal scroll
 * - [ ] Works in landscape orientation
 */
