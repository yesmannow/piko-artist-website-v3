"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { useLenis } from "lenis/react";
import { useHaptic } from "@/hooks/useHaptic";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";

const navItems = [
  { name: "Home", path: "/", anchor: "home" },
  { name: "About", path: "/", anchor: "rap-sheet" },
  { name: "Music", path: "/music", anchor: null },
  { name: "Videos", path: "/videos", anchor: null },
  { name: "Tour", path: "/tour", anchor: null },
  { name: "Studio", path: "/beatmaker", anchor: null },
  { name: "Contact", path: "/", anchor: "contact" },
];

// Animated Logo Component
const AnimatedLogo = ({ isScrolled }: { isScrolled: boolean }) => {
  return (
    <motion.div
      className="relative flex items-center"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <motion.div
        className="relative"
        animate={{
          rotate: [0, 5, -5, 0],
          scale: isScrolled ? 0.8 : 1,
        }}
        transition={{
          rotate: {
            duration: 0.5,
            repeat: Infinity,
            repeatType: "reverse",
            repeatDelay: 2,
          },
          scale: {
            duration: 0.3,
          },
        }}
      >
        <motion.div
          className="absolute inset-0 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity"
          style={{
            background: "radial-gradient(circle, rgba(204,255,0,0.4) 0%, transparent 70%)",
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <Image
          src="/images/branding/piko-logo.png"
          alt="Piko Logo"
          width={48}
          height={48}
          className="relative z-10 w-12 h-12 md:w-14 md:h-14 transition-all duration-300 drop-shadow-[0_0_15px_rgba(204,255,0,0.3)]"
          priority
        />
      </motion.div>
    </motion.div>
  );
};

// Animated Hamburger Icon Component
const HamburgerIcon = ({ isOpen }: { isOpen: boolean }) => {
  return (
    <div className="relative w-6 h-5 flex flex-col justify-between">
      <motion.span
        className="block w-full h-0.5 bg-current rounded-full"
        animate={{
          rotate: isOpen ? 45 : 0,
          y: isOpen ? 8 : 0,
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      />
      <motion.span
        className="block w-full h-0.5 bg-current rounded-full"
        animate={{
          opacity: isOpen ? 0 : 1,
          x: isOpen ? -10 : 0,
        }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
      />
      <motion.span
        className="block w-full h-0.5 bg-current rounded-full"
        animate={{
          rotate: isOpen ? -45 : 0,
          y: isOpen ? -8 : 0,
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      />
    </div>
  );
};

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { scrollY } = useScroll();
  const navRef = useRef<HTMLElement>(null);
  const lenis = useLenis();
  const triggerHaptic = useHaptic();

  // Track scroll position for navbar background effect with framer-motion
  // Smooth transition at 50px threshold
  useMotionValueEvent(scrollY, "change", (latest) => {
    const scrolled = latest > 50;
    setIsScrolled(scrolled);

    // Scroll progress calculation removed (was unused)
  });

  // Ensure navbar remains interactive - force pointer-events-auto on interactive elements
  useEffect(() => {
    // This ensures that even if something goes wrong, interactive elements stay clickable
    const interactiveElements = navRef.current?.querySelectorAll('[class*="pointer-events-auto"]');
    interactiveElements?.forEach((el) => {
      if (el instanceof HTMLElement) {
        el.style.pointerEvents = 'auto';
      }
    });
  }, [pathname, isOpen]);

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent scrolling when menu is open (using centralized hook)
  useBodyScrollLock(isOpen);

  // Additional mobile-specific positioning to prevent background scroll
  useEffect(() => {
    if (isOpen) {
      // Prevent background scroll on mobile
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
    } else {
      document.body.style.position = "";
      document.body.style.width = "";
    }
  }, [isOpen]);

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
  const handleNavClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, item: typeof navItems[0]) => {
    // If on home page and has anchor, scroll to section
    if (pathname === "/" && item.anchor) {
      e.preventDefault();
      const element = document.getElementById(item.anchor);
      if (element) {
        // Use Lenis smooth scroll if available (preferred method)
        // Offset accounts for navbar height (80px mobile, 96px desktop)
        const navHeight = window.innerWidth >= 768 ? 96 : 80;
        if (lenis) {
          lenis.scrollTo(element, {
            offset: -navHeight,
            duration: 1.5,
            easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
          });
        } else {
          // Fallback to native smooth scroll with offset
          const elementPosition = element.getBoundingClientRect().top + window.scrollY;
          const offsetPosition = elementPosition - navHeight;
          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth"
          });
        }
        setIsOpen(false);
      } else {
        // Navigate to home and then scroll
        router.push("/");
        setTimeout(() => {
          const el = document.getElementById(item.anchor!);
          if (el) {
            const navHeight = window.innerWidth >= 768 ? 96 : 80;
            if (lenis) {
              lenis.scrollTo(el, { offset: -navHeight, duration: 1.5 });
            } else {
              const elementPosition = el.getBoundingClientRect().top + window.scrollY;
              const offsetPosition = elementPosition - navHeight;
              window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
              });
            }
          }
        }, 100);
      }
    } else if (item.path !== pathname) {
      // Regular navigation
      setIsOpen(false);
    } else {
      // Same page, just close menu
      setIsOpen(false);
    }
  }, [pathname, router, lenis]);

  // Check if nav item is active (considering anchors on home page and route matching)
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    // For non-home pages, check if we're on the current route
    if (pathname !== "/") {
      setActiveSection(null);
      return;
    }

    const handleScroll = () => {
      const sections = navItems
        .filter(item => item.anchor)
        .map(item => ({
          id: item.anchor!,
          element: document.getElementById(item.anchor!),
        }))
        .filter(s => s.element !== null);

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

  const isActive = (item: typeof navItems[0]) => {
    // For pages with anchors (home page sections)
    if (pathname === "/" && item.anchor) {
      return activeSection === item.anchor;
    }
    // For regular pages, check if we're on that route
    if (item.path !== pathname) return false;
    // If it's a regular page route without anchor, it's active
    return pathname === item.path && !item.anchor;
  };

  return (
    <>
      <motion.nav
        ref={navRef}
        className="fixed top-0 left-0 right-0 z-[100] flex justify-between md:justify-center items-center px-4 md:px-8 py-3 md:py-4 pointer-events-none transition-all duration-300"
        initial={false}
        animate={{
          backgroundColor: isScrolled
            ? `rgba(0, 0, 0, ${0.9})`
            : "rgba(0, 0, 0, 0)",
          backdropFilter: isScrolled ? "blur(12px)" : "blur(0px)",
          borderBottom: isScrolled
            ? "1px solid rgba(255, 255, 255, 0.1)"
            : "1px solid transparent",
          boxShadow: isScrolled
            ? "0 4px 24px rgba(0, 0, 0, 0.5)"
            : "0 0 0 rgba(0, 0, 0, 0)",
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Logo - Left side (Mobile & Desktop) */}
        <Link
          href="/"
          className="pointer-events-auto touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
          onClick={(e) => {
            if (pathname === "/") {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
          }}
        >
          <AnimatedLogo isScrolled={isScrolled} />
        </Link>

        {/* Desktop Menu */}
        <ul className="hidden md:flex items-center gap-6 lg:gap-8 pointer-events-auto bg-black/50 backdrop-blur-md px-6 lg:px-8 py-3 rounded-full border border-white/10 shadow-lg" role="menubar">
          {navItems.map((item) => {
            const active = isActive(item);
            return (
              <li key={`${item.path}-${item.anchor || ""}`} className="relative" role="none">
                <Link
                  href={item.anchor ? `${item.path}#${item.anchor}` : item.path}
                  onClick={(e) => handleNavClick(e, item)}
                  className={`text-xs font-bold uppercase tracking-widest transition-all duration-300 min-h-[44px] flex items-center px-3 py-2 rounded-md touch-manipulation relative group focus:outline-none focus:ring-2 focus:ring-[#ccff00] focus:ring-offset-2 focus:ring-offset-black ${
                    active
                      ? "text-[#ccff00]"
                      : "text-zinc-400 hover:text-white hover:bg-white/5"
                  }`}
                  role="menuitem"
                  aria-current={active ? "page" : undefined}
                  aria-label={`Navigate to ${item.name}${item.anchor ? ` section` : ""}`}
                >
                  {item.name}
                  {/* Hover gradient underline effect */}
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#ccff00] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                    initial={false}
                  />
                </Link>
                {/* Active section indicator with animated underline */}
                {active && (
                  <motion.div
                    layoutId="nav-active-indicator"
                    className="absolute -bottom-2 left-0 right-0 h-1 bg-[#ccff00] rounded-full shadow-[0_0_12px_#ccff00]"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </li>
            );
          })}
        </ul>

        {/* Mobile Hamburger (Right) */}
        <div className="md:hidden pointer-events-auto">
          <motion.button
            onClick={handleMenuToggle}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2.5 text-white hover:text-[#ccff00] transition-colors touch-manipulation rounded-lg hover:bg-white/10 active:bg-white/20 relative"
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.05 }}
            aria-label={isOpen ? "Close menu" : "Open menu"}
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
          >
            <HamburgerIcon isOpen={isOpen} />
          </motion.button>
        </div>
      </motion.nav>

      {/* Mobile Full Screen Menu */}
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

            {/* Menu Panel */}
            <motion.div
              id="mobile-menu"
              initial={{ opacity: 0, y: "-100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "-100%" }}
              transition={{
                type: "spring",
                damping: 30,
                stiffness: 300,
                mass: 0.8
              }}
              className="fixed inset-0 z-[99] bg-gradient-to-b from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a] flex flex-col items-center justify-center overflow-y-auto backdrop-blur-2xl"
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
                initial={{ opacity: 0, scale: 0.8, y: -30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{
                  delay: 0.1,
                  type: "spring",
                  stiffness: 200,
                  damping: 20
                }}
                className="mb-8 md:mb-12"
              >
                <AnimatedLogo isScrolled={false} />
              </motion.div>

              {/* Mobile Menu Title (hidden but for accessibility) */}
              <h2 id="mobile-menu-title" className="sr-only">Mobile Navigation Menu</h2>

              {/* Mobile Menu Items */}
              <nav className="flex flex-col gap-3 text-center w-full max-w-sm px-6" aria-label="Mobile navigation">
                {navItems.map((item, i) => {
                  const active = isActive(item);
                  return (
                    <motion.div
                      key={`${item.path}-${item.anchor || ""}`}
                      initial={{ opacity: 0, x: -30, scale: 0.9 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      transition={{
                        delay: 0.15 + i * 0.05,
                        type: "spring",
                        stiffness: 300,
                        damping: 25
                      }}
                    >
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Link
                          href={item.anchor ? `${item.path}#${item.anchor}` : item.path}
                          onClick={(e) => {
                            triggerHaptic();
                            handleNavClick(e, item);
                          }}
                          className={`block text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tighter py-5 min-h-[64px] flex items-center justify-center touch-manipulation rounded-xl transition-all duration-300 relative overflow-hidden group focus:outline-none focus:ring-2 focus:ring-[#ccff00] focus:ring-offset-2 focus:ring-offset-transparent ${
                            active
                              ? "text-[#ccff00] bg-[#ccff00]/15 shadow-[0_0_20px_rgba(204,255,0,0.3)]"
                              : "text-zinc-400 hover:text-white hover:bg-white/10"
                          }`}
                          aria-current={active ? "page" : undefined}
                          aria-label={`Navigate to ${item.name}${item.anchor ? ` section` : ""}`}
                        >
                          {/* Active indicator background with animated underline */}
                          {active && (
                            <>
                              <motion.div
                                layoutId="mobile-menu-active-bg"
                                className="absolute inset-0 bg-[#ccff00]/10 rounded-xl"
                                initial={false}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                              />
                              <motion.div
                                layoutId="mobile-menu-active-underline"
                                className="absolute bottom-2 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-[#ccff00] rounded-full shadow-[0_0_12px_#ccff00]"
                                initial={false}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                              />
                            </>
                          )}

                          {/* Hover effect */}
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                            initial={{ x: "-100%" }}
                            whileHover={{ x: "100%" }}
                            transition={{ duration: 0.6 }}
                          />

                          {/* Text content */}
                          <span className="relative z-10">{item.name}</span>

                          {/* Active dot indicator */}
                          {active && (
                            <motion.div
                              className="absolute right-4 w-2 h-2 rounded-full bg-[#ccff00] shadow-[0_0_10px_#ccff00]"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.2 }}
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
