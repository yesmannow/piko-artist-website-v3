"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { useLenis } from "lenis/react";
import { useHaptic } from "@/hooks/useHaptic";

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
  const [scrollProgress, setScrollProgress] = useState(0);
  const { scrollY } = useScroll();
  const navRef = useRef<HTMLElement>(null);
  const lenis = useLenis();
  const triggerHaptic = useHaptic();

  // Track scroll position for navbar background effect with framer-motion
  useMotionValueEvent(scrollY, "change", (latest) => {
    const scrolled = latest > 50;
    setIsScrolled(scrolled);

    // Calculate scroll progress (0-1) for additional effects
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const maxScroll = documentHeight - windowHeight;
    const progress = maxScroll > 0 ? Math.min(latest / maxScroll, 1) : 0;
    setScrollProgress(progress);
  });

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent scrolling when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      // Prevent background scroll on mobile
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
    } else {
      document.body.style.overflow = "unset";
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
        if (lenis) {
          lenis.scrollTo(element, {
            offset: -80,
            duration: 1.5,
            easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
          });
        } else {
          // Fallback to native smooth scroll
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        setIsOpen(false);
      } else {
        // Navigate to home and then scroll
        router.push("/");
        setTimeout(() => {
          const el = document.getElementById(item.anchor!);
          if (el) {
            if (lenis) {
              lenis.scrollTo(el, { offset: -80, duration: 1.5 });
            } else {
              el.scrollIntoView({ behavior: "smooth", block: "start" });
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

  // Check if nav item is active (considering anchors on home page)
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
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

      if (sections.length === 0) return;

      // Find the section currently in view
      const scrollPosition = window.scrollY + 100; // Offset for navbar

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section.element) {
          const rect = section.element.getBoundingClientRect();
          const elementTop = rect.top + window.scrollY;

          if (scrollPosition >= elementTop - 100) {
            setActiveSection(section.id);
            return;
          }
        }
      }

      // If at top, set home as active
      if (window.scrollY < 200) {
        setActiveSection("home");
      }
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname]);

  const isActive = (item: typeof navItems[0]) => {
    if (item.path !== pathname) return false;
    if (pathname === "/" && item.anchor) {
      return activeSection === item.anchor;
    }
    return pathname === item.path && !item.anchor;
  };

  return (
    <>
      <motion.nav
        ref={navRef}
        className="fixed top-0 left-0 right-0 z-[100] flex justify-between md:justify-center items-center px-4 md:px-6 py-4 md:py-6 pointer-events-none transition-all duration-300"
        initial={false}
        animate={{
          backgroundColor: isScrolled
            ? `rgba(0, 0, 0, ${0.85 + scrollProgress * 0.1})`
            : "rgba(0, 0, 0, 0)",
          backdropFilter: isScrolled ? `blur(${10 + scrollProgress * 5}px)` : "blur(0px)",
          borderBottom: isScrolled
            ? `1px solid rgba(255, 255, 255, ${0.05 + scrollProgress * 0.05})`
            : "1px solid transparent",
          boxShadow: isScrolled
            ? `0 4px 20px rgba(0, 0, 0, ${0.3 + scrollProgress * 0.2})`
            : "0 0 0 rgba(0, 0, 0, 0)",
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
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
        <ul className="hidden md:flex items-center gap-6 lg:gap-8 pointer-events-auto bg-black/50 backdrop-blur-md px-6 lg:px-8 py-3 rounded-full border border-white/10 shadow-lg">
          {navItems.map((item) => {
            const active = isActive(item);
            return (
              <li key={`${item.path}-${item.anchor || ""}`} className="relative">
                <Link
                  href={item.anchor ? `${item.path}#${item.anchor}` : item.path}
                  onClick={(e) => handleNavClick(e, item)}
                  className={`text-xs font-bold uppercase tracking-widest transition-all duration-300 min-h-[44px] flex items-center px-3 py-2 rounded-md touch-manipulation ${
                    active
                      ? "text-[#ccff00]"
                      : "text-zinc-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {item.name}
                </Link>
                {active && (
                  <motion.div
                    layoutId="nav-dot"
                    className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#ccff00] shadow-[0_0_10px_#ccff00]"
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
              className="fixed inset-0 z-[95] bg-black/70 backdrop-blur-md"
              onClick={handleMenuToggle}
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
              className="fixed inset-0 z-[90] bg-gradient-to-b from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a] flex flex-col items-center justify-center overflow-y-auto"
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
                          className={`block text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tighter py-5 min-h-[64px] flex items-center justify-center touch-manipulation rounded-xl transition-all duration-300 relative overflow-hidden group ${
                            active
                              ? "text-[#ccff00] bg-[#ccff00]/15 shadow-[0_0_20px_rgba(204,255,0,0.3)]"
                              : "text-zinc-400 hover:text-white hover:bg-white/10"
                          }`}
                          aria-current={active ? "page" : undefined}
                        >
                          {/* Active indicator background */}
                          {active && (
                            <motion.div
                              layoutId="mobile-menu-active"
                              className="absolute inset-0 bg-[#ccff00]/10 rounded-xl"
                              initial={false}
                              transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            />
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
