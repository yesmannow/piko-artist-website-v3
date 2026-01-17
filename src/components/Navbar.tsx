"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
} from "framer-motion";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Image from "next/image";
import { useLenis } from "lenis/react";
import { useHaptic } from "@/hooks/useHaptic";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import {
  primaryNavItems,
  type NavItem,
  type NavBadge,
} from "@/config/nav.config";

const NavPill = ({ badge }: { badge: NavBadge }) => {
  const toneStyles =
    badge.tone === "live"
      ? "bg-emerald-500/15 text-emerald-200 border-emerald-400/50"
      : badge.tone === "beta"
        ? "bg-fuchsia-500/10 text-fuchsia-200 border-fuchsia-400/60"
        : "bg-white/10 text-white border-white/20";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] ${toneStyles}`}
    >
      {badge.text}
    </span>
  );
};

// Animated Logo Component - Urban/Hip-Hop Style
const AnimatedLogo = ({
  isScrolled,
  reducedMotion,
  pathname,
  lenis,
}: {
  isScrolled: boolean;
  reducedMotion: boolean;
  pathname: string;
  lenis: ReturnType<typeof useLenis>;
}) => {
  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // If already on home, scroll to top
    if (pathname === "/") {
      e.preventDefault();
      if (lenis) {
        lenis.scrollTo(0, { immediate: false, duration: 1.5 });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  return (
    <motion.div
      className="relative flex items-center"
      whileHover={reducedMotion ? {} : { scale: 1.05 }}
      whileTap={reducedMotion ? {} : { scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <motion.div
        className="relative"
        animate={
          reducedMotion
            ? { scale: isScrolled ? 0.85 : 1 }
            : {
                rotate: [0, 3, -3, 0],
                scale: isScrolled ? 0.85 : 1,
              }
        }
        transition={
          reducedMotion
            ? { duration: 0.3 }
            : {
                rotate: {
                  duration: 0.5,
                  repeat: Infinity,
                  repeatType: "reverse",
                  repeatDelay: 2,
                },
                scale: {
                  duration: 0.3,
                },
              }
        }
      >
        {!reducedMotion && (
          <motion.div
            className="absolute inset-0 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity"
            style={{
              background:
                "radial-gradient(circle, rgba(255,215,0,0.3) 0%, transparent 70%)",
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0, 0.4, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}
        <Link
          href="/"
          className="relative z-10 block"
          aria-label="Navigate to home"
          onClick={handleLogoClick}
        >
          <Image
            src="/images/branding/piko-logo.png"
            alt="Piko Logo"
            width={48}
            height={48}
            className="w-12 h-12 md:w-14 md:h-14 transition-all duration-300 drop-shadow-[0_0_10px_rgba(255,215,0,0.2)]"
            priority
          />
        </Link>
      </motion.div>
    </motion.div>
  );
};

export function Navbar({ items }: { items?: NavItem[] }) {
  const pathname = usePathname() ?? "/";
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { scrollY } = useScroll();
  const navRef = useRef<HTMLElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const lenis = useLenis();
  const { triggerHaptic } = useHaptic();
  const scrollDirection = useScrollDirection(50);
  const [reducedMotion, setReducedMotion] = useState(false);
  const menuItems = useMemo(() => items ?? primaryNavItems, [items]);

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

  // Focus trap for mobile menu
  useFocusTrap(isOpen, mobileMenuRef);

  // Track scroll position and direction for navbar background effect
  useMotionValueEvent(scrollY, "change", (latest) => {
    const scrolled = latest > 50;
    setIsScrolled(scrolled);
  });

  // Ensure navbar remains interactive - force pointer-events-auto on interactive elements
  useEffect(() => {
    // This ensures that even if something goes wrong, interactive elements stay clickable
    const interactiveElements = navRef.current?.querySelectorAll(
      '[class*="pointer-events-auto"]',
    );
    interactiveElements?.forEach((el) => {
      if (el instanceof HTMLElement) {
        el.style.pointerEvents = "auto";
      }
    });
  }, [pathname, isOpen]);

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent scrolling when menu is open (using centralized hook)
  useBodyScrollLock(isOpen);

  // Handle menu toggle with haptic feedback
  const handleMenuToggle = () => {
    triggerHaptic();
    setIsOpen(!isOpen);
  };

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  // Smooth scroll to section helper
  const handleNavClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, item: NavItem) => {
      const targetPath = item.href.split("#")[0] || item.href;
      const targetSection = item.sectionId;

      if (targetSection && pathname === targetPath) {
        const element = document.getElementById(targetSection);
        if (element) {
          e.preventDefault();
          const navHeight = window.innerWidth >= 768 ? 96 : 80;
          if (lenis) {
            lenis.scrollTo(element, {
              offset: -navHeight,
              duration: 1.5,
              easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            });
          } else {
            const elementPosition =
              element.getBoundingClientRect().top + window.scrollY;
            const offsetPosition = elementPosition - navHeight;
            window.scrollTo({
              top: offsetPosition,
              behavior: "smooth",
            });
          }
        }
      }

      setIsOpen(false);
    },
    [pathname, lenis],
  );

  // Check if nav item is active (considering anchors on home page and route matching)
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    // For non-home pages, check if we're on the current route
    if (pathname !== "/") {
      setActiveSection(null);
      return;
    }

    const handleScroll = () => {
      const sections = menuItems
        .filter((item) => item.sectionId)
        .map((item) => ({
          id: item.sectionId!,
          element: document.getElementById(item.sectionId!),
        }))
        .filter((s) => s.element !== null);

      if (sections.length === 0) {
        // If at top of page, set home as active
        if (window.scrollY < 100) {
          setActiveSection("home");
        }
        return;
      }

      // Find the section currently in view
      // Use navbar height offset (80px for desktop, 64px for mobile)
      const navHeight = window.innerWidth >= 768 ? 96 : 80;
      const scrollPosition = window.scrollY + navHeight;

      let activeId: string | null = null;

      // Check sections from bottom to top to find the active one
      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section.element) {
          const rect = section.element.getBoundingClientRect();
          const elementTop = rect.top + window.scrollY;

          if (scrollPosition >= elementTop - navHeight) {
            activeId = section.id;
            break;
          }
        }
      }

      // If at top, set home as active
      if (window.scrollY < 200) {
        activeId = "home";
      }

      setActiveSection(activeId);
    };

    // Use Lenis scroll event if available, otherwise use native scroll
    if (lenis) {
      lenis.on("scroll", handleScroll);
      handleScroll(); // Initial check
      return () => {
        lenis.off("scroll", handleScroll);
      };
    } else {
      handleScroll(); // Initial check
      window.addEventListener("scroll", handleScroll, { passive: true });
      return () => window.removeEventListener("scroll", handleScroll);
    }
  }, [pathname, lenis]);

  const isActive = (item: NavItem) => {
    const targetPath = item.href.split("#")[0] || item.href;
    if (pathname === "/" && item.sectionId) {
      return activeSection === item.sectionId;
    }
    return pathname === targetPath;
  };

  return (
    <>
      <motion.nav
        ref={navRef}
        className="hidden md:flex fixed top-0 left-0 right-0 z-[100] justify-between md:justify-center items-center px-4 md:px-8 py-3 md:py-4 pointer-events-none transition-all duration-300"
        initial={false}
        animate={{
          backgroundColor:
            isScrolled && scrollDirection === "down"
              ? `rgba(10, 10, 10, ${reducedMotion ? 0.95 : 0.9})`
              : isScrolled && scrollDirection === "up"
                ? `rgba(10, 10, 10, ${reducedMotion ? 0.85 : 0.75})`
                : "rgba(0, 0, 0, 0)",
          backdropFilter: isScrolled
            ? reducedMotion
              ? "blur(8px)"
              : "blur(12px)"
            : "blur(0px)",
          borderBottom: isScrolled
            ? "1px solid rgb(204 255 0 / 0.15)"
            : "1px solid transparent",
          boxShadow: isScrolled
            ? scrollDirection === "down"
              ? "0 4px 24px rgba(0, 0, 0, 0.6)"
              : "0 2px 12px rgba(0, 0, 0, 0.3)"
            : "0 0 0 rgba(0, 0, 0, 0)",
        }}
        transition={{ duration: reducedMotion ? 0.1 : 0.3, ease: "easeInOut" }}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Logo - Left side (Desktop only, mobile uses tray nav) */}
        <div
          id="nav-logo-anchor"
          className="hidden md:flex pointer-events-auto touch-manipulation min-h-[44px] min-w-[44px] items-center justify-center"
        >
          <AnimatedLogo
            isScrolled={isScrolled}
            reducedMotion={reducedMotion}
            pathname={pathname}
            lenis={lenis}
          />
        </div>

        {/* Desktop Menu - Chrome Parallel Bar */}
        <div className="hidden md:flex items-center gap-8 pointer-events-auto relative">
          {/* Navigation Links - Chrome Bar */}
          <ul
            className="flex items-center bg-[#050505]/90 backdrop-blur-xl border-2 border-[#E0E0E0]/30 px-6 py-2 skew-x-[-12deg]"
            style={{
              boxShadow: "10px 10px 0px #000",
            }}
            role="menubar"
          >
            {menuItems.map((item) => {
              const active = isActive(item);
              const href = item.sectionId
                ? `${item.href}#${item.sectionId}`
                : item.href;
              return (
                <li
                  key={`${item.href}-${item.sectionId || ""}`}
                  className="relative group skew-x-[12deg]"
                  role="none"
                >
                  <Link
                    href={href}
                    onClick={(e) => handleNavClick(e, item)}
                    className={`px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] transition-colors block ${active ? "text-[#FFD700]" : "text-[#E0E0E0] hover:text-[#FFD700]"}`}
                    style={{
                      fontFamily: "var(--font-lexend), system-ui, sans-serif",
                    }}
                    role="menuitem"
                    aria-current={active ? "page" : undefined}
                    aria-label={`Navigate to ${item.label}${item.sectionId ? ` section` : ""}`}
                  >
                    <span className="flex items-center gap-2">
                      {item.icon && (
                        <motion.span
                          className={`relative inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 ${active ? "shadow-[0_0_18px_rgba(255,215,0,0.35)]" : ""}`}
                          whileHover={
                            reducedMotion
                              ? undefined
                              : { rotate: [0, 8, -8, 0] }
                          }
                          animate={
                            reducedMotion
                              ? {}
                              : active
                                ? { rotate: [0, 4, -4, 0], scale: 1.05 }
                                : { rotate: 0, scale: 1 }
                          }
                          transition={{ duration: 0.5, ease: "easeInOut" }}
                        >
                          {!reducedMotion && (
                            <motion.span
                              className="absolute inset-0 rounded-full bg-[#FFD700]/20 blur-md opacity-0 group-hover:opacity-100"
                              transition={{ duration: 0.3 }}
                            />
                          )}
                          <item.icon className="relative z-10 h-4 w-4" />
                        </motion.span>
                      )}
                      <span className="flex items-center gap-2">
                        {item.label}
                        {item.badge ? <NavPill badge={item.badge} /> : null}
                      </span>
                    </span>
                  </Link>

                  {/* Active indicator */}
                  {active && (
                    <motion.div
                      layoutId="nav-active-indicator"
                      className="absolute -bottom-2 left-1/2 h-1 w-10 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#FFD700]/0 via-[#FFD700] to-[#FFD700]/0 shadow-[0_0_16px_#FFD700]"
                      initial={false}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 28,
                      }}
                    />
                  )}

                  {/* Hover gradient underline effect */}
                  {!reducedMotion && (
                    <motion.div
                      className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-100 w-full"
                      transition={{ duration: 0.3 }}
                      initial={false}
                    />
                  )}
                </li>
              );
            })}
          </ul>

          {/* System Status - Desktop Only */}
          <div className="hidden lg:block ml-4 border-l border-white/10 pl-4 font-mono text-[9px] text-white/30 skew-x-[-12deg]">
            <div className="skew-x-[12deg]">
              SYS_OP: ACTIVE
              <br />
              LOC: SYNDICATE_VAULT
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Full Screen Menu - Hidden on mobile (tray nav is primary) */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-[98] bg-black/80 backdrop-blur-xl"
              onClick={handleMenuToggle}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setIsOpen(false);
                }
              }}
              aria-hidden="true"
            />

            {/* Menu Panel - Urban/Hip-Hop Style */}
            <motion.div
              ref={mobileMenuRef}
              id="mobile-menu"
              initial={
                reducedMotion ? { opacity: 0 } : { opacity: 0, y: "-100%" }
              }
              animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: "-100%" }}
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
              className="fixed inset-0 z-[99] bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 flex flex-col items-center justify-center overflow-y-auto backdrop-blur-2xl"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E")`,
              }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="mobile-menu-title"
              onClick={(e) => {
                // Prevent closing when clicking inside the menu
                e.stopPropagation();
              }}
            >
              {/* Mobile Logo */}
              <motion.div
                initial={
                  reducedMotion
                    ? { opacity: 0 }
                    : { opacity: 0, scale: 0.8, y: -30 }
                }
                animate={
                  reducedMotion
                    ? { opacity: 1 }
                    : { opacity: 1, scale: 1, y: 0 }
                }
                transition={
                  reducedMotion
                    ? { duration: 0.2, delay: 0.1 }
                    : {
                        delay: 0.1,
                        type: "spring",
                        stiffness: 200,
                        damping: 20,
                      }
                }
                className="mb-8 md:mb-12"
              >
                <AnimatedLogo
                  isScrolled={false}
                  reducedMotion={reducedMotion}
                  pathname={pathname}
                  lenis={lenis}
                />
              </motion.div>

              {/* Mobile Menu Title (hidden but for accessibility) */}
              <h2 id="mobile-menu-title" className="sr-only">
                Mobile Navigation Menu
              </h2>

              {/* Mobile Menu Items */}
              <nav
                className="flex flex-col gap-3 text-center w-full max-w-sm px-6"
                aria-label="Mobile navigation"
              >
                {menuItems.map((item, i) => {
                  const active = isActive(item);
                  const href = item.sectionId
                    ? `${item.href}#${item.sectionId}`
                    : item.href;
                  return (
                    <motion.div
                      key={`${item.href}-${item.sectionId || ""}`}
                      initial={
                        reducedMotion
                          ? { opacity: 0 }
                          : { opacity: 0, x: -30, scale: 0.9 }
                      }
                      animate={
                        reducedMotion
                          ? { opacity: 1 }
                          : { opacity: 1, x: 0, scale: 1 }
                      }
                      transition={
                        reducedMotion
                          ? { duration: 0.2, delay: 0.1 + i * 0.03 }
                          : {
                              delay: 0.15 + i * 0.05,
                              type: "spring",
                              stiffness: 300,
                              damping: 25,
                            }
                      }
                    >
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Link
                          href={href}
                          onClick={(e) => {
                            triggerHaptic();
                            handleNavClick(e, item);
                          }}
                          className={`text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tighter py-5 min-h-[64px] flex items-center justify-center touch-manipulation rounded-xl transition-all duration-300 relative overflow-hidden group focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:ring-offset-2 focus:ring-offset-transparent ${
                            active
                              ? "text-[#FFD700] bg-[#FFD700]/15 shadow-[0_0_20px_rgba(255,215,0,0.3)]"
                              : "text-zinc-400 hover:text-white hover:bg-white/10"
                          }`}
                          aria-current={active ? "page" : undefined}
                          aria-label={`Navigate to ${item.label}${item.sectionId ? ` section` : ""}`}
                        >
                          {/* Active indicator background with animated underline */}
                          {active && (
                            <>
                              <motion.div
                                layoutId="mobile-menu-active-bg"
                                className="absolute inset-0 bg-[#FFD700]/10 rounded-xl"
                                initial={false}
                                transition={
                                  reducedMotion
                                    ? { duration: 0.1 }
                                    : {
                                        type: "spring",
                                        stiffness: 500,
                                        damping: 30,
                                      }
                                }
                              />
                              <motion.div
                                layoutId="mobile-menu-active-underline"
                                className="absolute bottom-2 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-[#FFD700] rounded-full shadow-[0_0_12px_#FFD700]"
                                initial={false}
                                transition={
                                  reducedMotion
                                    ? { duration: 0.1 }
                                    : {
                                        type: "spring",
                                        stiffness: 500,
                                        damping: 30,
                                      }
                                }
                              />
                            </>
                          )}

                          {/* Hover effect */}
                          {!reducedMotion && (
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                              initial={{ x: "-100%" }}
                              whileHover={{ x: "100%" }}
                              transition={{ duration: 0.6 }}
                            />
                          )}

                          {/* Text content */}
                          <span className="relative z-10 flex items-center gap-3">
                            {item.icon && (
                              <motion.span
                                className="relative inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5"
                                whileHover={
                                  reducedMotion
                                    ? undefined
                                    : { rotate: [0, 10, -10, 0] }
                                }
                                transition={{ duration: 0.4 }}
                              >
                                {active && (
                                  <motion.span
                                    className="absolute inset-0 rounded-full bg-[#FFD700]/15 blur-md"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                  />
                                )}
                                <item.icon className="relative z-10 h-4 w-4" />
                              </motion.span>
                            )}
                            <span className="flex items-center gap-2">
                              {item.label}
                              {item.badge ? (
                                <NavPill badge={item.badge} />
                              ) : null}
                            </span>
                          </span>

                          {/* Active dot indicator */}
                          {active && (
                            <motion.div
                              className="absolute right-4 w-2 h-2 rounded-full bg-[#FFD700] shadow-[0_0_10px_#FFD700]"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={
                                reducedMotion
                                  ? { duration: 0.1 }
                                  : { delay: 0.2 }
                              }
                            />
                          )}
                        </Link>
                      </motion.div>
                    </motion.div>
                  );
                })}
              </nav>

              {/* Close hint */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-8 text-xs text-zinc-500 uppercase tracking-wider"
              >
                Tap outside to close
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
