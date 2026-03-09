"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { useLenis } from "lenis/react";
import { useHaptic } from "@/hooks/device/useHaptic";
import { useBodyScrollLock } from "@/hooks/ui/useBodyScrollLock";
import { useScrollDirection } from "@/hooks/ui/useScrollDirection";
import { useFocusTrap } from "@/hooks/ui/useFocusTrap";

const navItems = [
  { name: "Home", path: "/", anchor: "home" },
  { name: "About", path: "/", anchor: "rap-sheet" },
  { name: "Music", path: "/music", anchor: null },
  { name: "Videos", path: "/videos", anchor: null },
  { name: "STUDIO", path: "/studio", anchor: null, isStudio: true },
  { name: "Contact", path: "/contact", anchor: null },
];

type NavItem = (typeof navItems)[0];

const GRAIN_BG_IMAGE = `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E")`;

// --- Helpers ---

/** Returns the navbar height in px, accounting for breakpoint */
function getNavHeight(): number {
  return globalThis.window?.innerWidth >= 768 ? 96 : 80;
}

/** Scroll to an element using Lenis (preferred) or native fallback */
function scrollToElement(
  element: HTMLElement,
  lenis: ReturnType<typeof useLenis>,
  offset?: number,
) {
  const navHeight = offset ?? getNavHeight();
  if (lenis) {
    lenis.scrollTo(element, {
      offset: -navHeight,
      duration: 1.5,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });
  } else {
    const elementPosition = element.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: elementPosition - navHeight, behavior: "smooth" });
  }
}

// --- Hooks ---

/** Hook to track which section is active based on scroll position */
function useActiveSection(pathname: string, lenis: ReturnType<typeof useLenis>) {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  // Reset active section when navigating away from home (during render, not inside an effect)
  const [trackedPath, setTrackedPath] = useState(pathname);
  if (trackedPath !== pathname) {
    setTrackedPath(pathname);
    if (pathname !== "/" && activeSection !== null) {
      setActiveSection(null);
    }
  }

  useEffect(() => {
    if (pathname !== "/") {
      return;
    }

    const handleScroll = () => {
      const sections = navItems
        .filter((item) => item.anchor)
        .map((item) => ({
          id: item.anchor!,
          element: document.getElementById(item.anchor!),
        }))
        .filter((s) => s.element !== null);

      if (sections.length === 0) {
        if (window.scrollY < 100) setActiveSection("home");
        return;
      }

      const navHeight = getNavHeight();
      const scrollPosition = window.scrollY + navHeight;
      let activeId: string | null = null;

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section.element) {
          const elementTop = section.element.getBoundingClientRect().top + window.scrollY;
          if (scrollPosition >= elementTop - navHeight) {
            activeId = section.id;
            break;
          }
        }
      }

      if (window.scrollY < 200) activeId = "home";
      setActiveSection(activeId);
    };

    if (lenis) {
      lenis.on("scroll", handleScroll);
      handleScroll();
      return () => { lenis.off("scroll", handleScroll); };
    }
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname, lenis]);

  return activeSection;
}

/** Hook to track reduced motion preference */
function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return reducedMotion;
}

// --- Sub-Components ---

/** Animated Logo Component - Urban/Hip-Hop Style */
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
        animate={{ scale: isScrolled ? 0.85 : 1 }}
        transition={{ duration: 0.3 }}
      >
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
            className="transition-all duration-300 drop-shadow-[0_0_10px_rgba(255,215,0,0.2)]"
            style={{ width: 'auto', height: '48px' }}
            sizes="48px"
            priority
          />
        </Link>
      </motion.div>
    </motion.div>
  );
};

/** A single desktop nav item inside the chrome bar */
function DesktopNavItem({
  item,
  active,
  reducedMotion,
  onNavClick,
}: {
  item: NavItem;
  active: boolean;
  reducedMotion: boolean;
  onNavClick: (e: React.MouseEvent<HTMLAnchorElement>, item: NavItem) => void;
}) {
  const isStudio = 'isStudio' in item && item.isStudio;

  return (
    <li key={`${item.path}-${item.anchor || ""}`} className="relative group skew-x-12" role="none">
      <Link
        href={item.anchor ? `${item.path}#${item.anchor}` : item.path}
        onClick={(e) => onNavClick(e, item)}
        className={`px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300 block relative ${
          active
            ? isStudio
              ? "text-[#00f2ff]"
              : "text-[#FFD700]"
            : "text-[#E0E0E0] hover:text-[#FFD700]"
        }`}
        style={{
          fontFamily: isStudio
            ? "'JetBrains Mono', monospace"
            : "var(--font-lexend), system-ui, sans-serif",
          letterSpacing: isStudio ? '0.3em' : '0.2em',
          ...(active && isStudio
            ? { textShadow: '0 0 15px #00f2ff, 0 0 30px rgba(0, 242, 255, 0.4)' }
            : {}),
        }}
        role="menuitem"
        aria-current={active ? "page" : undefined}
        aria-label={`Navigate to ${item.name}${item.anchor ? ` section` : ""}`}
      >
        {item.name}
        {/* Neon glow underline for active STUDIO */}
        {active && isStudio && (
          <motion.div
            layoutId="studio-neon-glow"
            className="absolute -bottom-1 left-0 right-0 h-[2px]"
            style={{
              background: '#00f2ff',
              boxShadow: '0 0 8px #00f2ff, 0 0 15px rgba(0, 242, 255, 0.5)',
            }}
          />
        )}
      </Link>
      {/* Hover gradient underline effect */}
      {!reducedMotion && (
        <motion.div
          className="absolute bottom-0 left-0 h-[2px] bg-linear-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-100 w-full"
          transition={{ duration: 0.3 }}
          initial={false}
        />
      )}
    </li>
  );
}

/** Desktop Chrome Parallel Bar navigation */
function DesktopChromeBar({
  isActive,
  reducedMotion,
  onNavClick,
}: {
  isActive: (item: NavItem) => boolean;
  reducedMotion: boolean;
  onNavClick: (e: React.MouseEvent<HTMLAnchorElement>, item: NavItem) => void;
}) {
  return (
    <div className="hidden md:flex items-center gap-8 pointer-events-auto relative">
      <ul
        className="flex items-center bg-obsidian-950/70 backdrop-blur-2xl border border-white/10 px-6 py-2 -skew-x-12 rounded-lg"
        style={{
          boxShadow: "10px 10px 0px #000, inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -1px 0 rgba(0,0,0,0.3)",
          backdropFilter: 'blur(20px) saturate(1.5)',
        }}
        role="menubar"
      >
        {navItems.map((item) => (
          <DesktopNavItem
            key={`${item.path}-${item.anchor || ""}`}
            item={item}
            active={isActive(item)}
            reducedMotion={reducedMotion}
            onNavClick={onNavClick}
          />
        ))}
      </ul>

      {/* System Status - Desktop Only */}
      <div className="hidden lg:block ml-4 border-l border-white/10 pl-4 font-mono text-[9px] text-white/30 -skew-x-12">
        <div className="skew-x-12">
          SYS_OP: ACTIVE<br />
          LOC: SYNDICATE_VAULT
        </div>
      </div>
    </div>
  );
}

/** Mobile menu item inside the fullscreen overlay */
function MobileMenuItem({
  item,
  index,
  active,
  reducedMotion,
  onNavClick,
  triggerHaptic,
}: {
  item: NavItem;
  index: number;
  active: boolean;
  reducedMotion: boolean;
  onNavClick: (e: React.MouseEvent<HTMLAnchorElement>, item: NavItem) => void;
  triggerHaptic: () => void;
}) {
  return (
    <motion.div
      initial={reducedMotion ? { opacity: 0 } : { opacity: 0, x: -30, scale: 0.9 }}
      animate={reducedMotion ? { opacity: 1 } : { opacity: 1, x: 0, scale: 1 }}
      transition={
        reducedMotion
          ? { duration: 0.2, delay: 0.1 + index * 0.03 }
          : { delay: 0.15 + index * 0.05, type: "spring", stiffness: 300, damping: 25 }
      }
    >
      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Link
          href={item.anchor ? `${item.path}#${item.anchor}` : item.path}
          onClick={(e) => {
            triggerHaptic();
            onNavClick(e, item);
          }}
          className={`text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tighter py-5 min-h-[64px] flex items-center justify-center touch-manipulation rounded-xl transition-all duration-300 relative overflow-hidden group focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:ring-offset-2 focus:ring-offset-transparent ${
            active
              ? "text-[#FFD700] bg-[#FFD700]/15 shadow-[0_0_20px_rgba(255,215,0,0.3)]"
              : "text-zinc-400 hover:text-white hover:bg-white/10"
          }`}
          aria-current={active ? "page" : undefined}
          aria-label={`Navigate to ${item.name}${item.anchor ? ` section` : ""}`}
        >
          <MobileMenuActiveIndicators active={active} reducedMotion={reducedMotion} />
          {!reducedMotion && <MobileMenuHoverSheen />}
          <span className="relative z-10">{item.name}</span>
          {active && (
            <motion.div
              className="absolute right-4 w-2 h-2 rounded-full bg-[#FFD700] shadow-[0_0_10px_#FFD700]"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={reducedMotion ? { duration: 0.1 } : { delay: 0.2 }}
            />
          )}
        </Link>
      </motion.div>
    </motion.div>
  );
}

/** Active background + underline for mobile menu items */
function MobileMenuActiveIndicators({ active, reducedMotion }: { active: boolean; reducedMotion: boolean }) {
  if (!active) return null;
  const spring = reducedMotion ? { duration: 0.1 } : { type: "spring" as const, stiffness: 500, damping: 30 };
  return (
    <>
      <motion.div
        layoutId="mobile-menu-active-bg"
        className="absolute inset-0 bg-[#FFD700]/10 rounded-xl"
        initial={false}
        transition={spring}
      />
      <motion.div
        layoutId="mobile-menu-active-underline"
        className="absolute bottom-2 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-[#FFD700] rounded-full shadow-[0_0_12px_#FFD700]"
        initial={false}
        transition={spring}
      />
    </>
  );
}

/** Hover shine sweep for mobile menu items */
function MobileMenuHoverSheen() {
  return (
    <motion.div
      className="absolute inset-0 bg-linear-to-r from-transparent via-white/5 to-transparent"
      initial={{ x: "-100%" }}
      whileHover={{ x: "100%" }}
      transition={{ duration: 0.6 }}
    />
  );
}

/** Full-screen mobile menu overlay */
function MobileMenuOverlay({
  isOpen,
  reducedMotion,
  mobileMenuRef,
  isActive,
  handleMenuToggle,
  handleNavClick,
  pathname,
  lenis,
  triggerHaptic,
}: {
  isOpen: boolean;
  reducedMotion: boolean;
  mobileMenuRef: React.RefObject<HTMLDivElement | null>;
  isActive: (item: NavItem) => boolean;
  handleMenuToggle: () => void;
  handleNavClick: (e: React.MouseEvent<HTMLAnchorElement>, item: NavItem) => void;
  pathname: string;
  lenis: ReturnType<typeof useLenis>;
  triggerHaptic: () => void;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-98 bg-black/80 backdrop-blur-xl"
            onClick={handleMenuToggle}
            onKeyDown={(e) => { if (e.key === "Escape") handleMenuToggle(); }}
            aria-hidden="true"
          />

          {/* Menu Panel */}
          <motion.div
            ref={mobileMenuRef}
            id="mobile-menu"
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: "-100%" }}
            animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: "-100%" }}
            transition={
              reducedMotion
                ? { duration: 0.2 }
                : { type: "spring", damping: 30, stiffness: 300, mass: 0.8 }
            }
            className="fixed inset-0 z-99 bg-linear-to-b from-zinc-950 via-zinc-900 to-zinc-950 flex flex-col items-center justify-center overflow-y-auto backdrop-blur-2xl"
            style={{ backgroundImage: GRAIN_BG_IMAGE }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-menu-title"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Logo */}
            <motion.div
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.8, y: -30 }}
              animate={reducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
              transition={
                reducedMotion
                  ? { duration: 0.2, delay: 0.1 }
                  : { delay: 0.1, type: "spring", stiffness: 200, damping: 20 }
              }
              className="mb-8 md:mb-12"
            >
              <AnimatedLogo isScrolled={false} reducedMotion={reducedMotion} pathname={pathname} lenis={lenis} />
            </motion.div>

            <h2 id="mobile-menu-title" className="sr-only">Mobile Navigation Menu</h2>

            {/* Mobile Menu Items */}
            <nav className="flex flex-col gap-3 text-center w-full max-w-sm px-6" aria-label="Mobile navigation">
              {navItems.map((item, i) => (
                <MobileMenuItem
                  key={`${item.path}-${item.anchor || ""}`}
                  item={item}
                  index={i}
                  active={isActive(item)}
                  reducedMotion={reducedMotion}
                  onNavClick={handleNavClick}
                  triggerHaptic={triggerHaptic}
                />
              ))}
            </nav>

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
  );
}

// --- Navbar background style computation ---

function computeNavBackground(isScrolled: boolean, scrollDirection: string, reducedMotion: boolean) {
  const bgColor = isScrolled && scrollDirection === "down"
    ? `rgba(10, 10, 10, ${reducedMotion ? 0.95 : 0.9})`
    : isScrolled && scrollDirection === "up"
      ? `rgba(10, 10, 10, ${reducedMotion ? 0.85 : 0.75})`
      : "rgba(6, 8, 16, 0.4)";

  const blur = isScrolled
    ? (reducedMotion ? "blur(12px) saturate(1.4)" : "blur(16px) saturate(1.5)")
    : "blur(8px) saturate(1.2)";

  const border = isScrolled
    ? "1px solid rgba(0, 242, 255, 0.15)"
    : "1px solid rgba(255, 255, 255, 0.06)";

  let shadow = "0 0 0 rgba(0, 0, 0, 0)";
  if (isScrolled) {
    shadow = scrollDirection === "down"
      ? "0 4px 24px rgba(0, 0, 0, 0.6), 0 0 40px rgba(0, 242, 255, 0.03)"
      : "0 2px 12px rgba(0, 0, 0, 0.3), 0 0 20px rgba(0, 242, 255, 0.02)";
  }

  return {
    backgroundColor: bgColor,
    backdropFilter: blur,
    borderBottom: border,
    boxShadow: shadow,
  };
}

// --- Main Component ---

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { scrollY } = useScroll();
  const navRef = useRef<HTMLElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const lenis = useLenis();
  const { triggerHaptic } = useHaptic();
  const scrollDirection = useScrollDirection(50);
  const reducedMotion = useReducedMotion();
  const activeSection = useActiveSection(pathname, lenis);

  useFocusTrap(isOpen, mobileMenuRef);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 50);
  });

  // Ensure navbar remains interactive
  useEffect(() => {
    const interactiveElements = navRef.current?.querySelectorAll('[class*="pointer-events-auto"]');
    interactiveElements?.forEach((el) => {
      if (el instanceof HTMLElement) el.style.pointerEvents = 'auto';
    });
  }, [pathname, isOpen]);

  // Close menu when route changes
  const [trackedPathname, setTrackedPathname] = useState(pathname);
  if (trackedPathname !== pathname) {
    setTrackedPathname(pathname);
    if (isOpen) setIsOpen(false);
  }

  useBodyScrollLock(isOpen);

  const handleMenuToggle = () => {
    triggerHaptic();
    setIsOpen(!isOpen);
  };

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) setIsOpen(false);
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  // Smooth scroll to section helper
  const handleNavClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, item: NavItem) => {
      if (pathname === "/" && item.anchor) {
        e.preventDefault();
        const element = document.getElementById(item.anchor);
        if (element) {
          scrollToElement(element, lenis);
          setIsOpen(false);
        } else {
          router.push("/");
          setTimeout(() => {
            const el = document.getElementById(item.anchor!);
            if (el) scrollToElement(el, lenis);
          }, 100);
        }
      } else {
        setIsOpen(false);
      }
    },
    [pathname, router, lenis],
  );

  const isActive = (item: NavItem) => {
    if (pathname === "/" && item.anchor) return activeSection === item.anchor;
    if (item.path !== pathname) return false;
    return pathname === item.path && !item.anchor;
  };

  return (
    <>
      <motion.nav
        ref={navRef}
        className="hidden md:flex fixed top-0 left-0 right-0 z-100 justify-between md:justify-center items-center px-4 md:px-8 py-3 md:py-4 pointer-events-none transition-all duration-300"
        initial={false}
        animate={computeNavBackground(isScrolled, scrollDirection, reducedMotion)}
        transition={{ duration: reducedMotion ? 0.1 : 0.3, ease: "easeInOut" }}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <div
          id="nav-logo-anchor"
          className="hidden md:flex pointer-events-auto touch-manipulation min-h-[44px] min-w-[44px] items-center justify-center"
        >
          <AnimatedLogo isScrolled={isScrolled} reducedMotion={reducedMotion} pathname={pathname} lenis={lenis} />
        </div>

        <DesktopChromeBar isActive={isActive} reducedMotion={reducedMotion} onNavClick={handleNavClick} />
      </motion.nav>

      <MobileMenuOverlay
        isOpen={isOpen}
        reducedMotion={reducedMotion}
        mobileMenuRef={mobileMenuRef}
        isActive={isActive}
        handleMenuToggle={handleMenuToggle}
        handleNavClick={handleNavClick}
        pathname={pathname}
        lenis={lenis}
        triggerHaptic={triggerHaptic}
      />
    </>
  );
}
