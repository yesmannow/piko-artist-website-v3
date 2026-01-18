/** Artist-first nav with Labs toggle and mobile drawer */
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Menu, Headphones, Radio, Waves, Sparkles } from "lucide-react";
import {
  primaryNavItems,
  labsNavItems,
  type NavItem,
} from "@/config/nav.config";
import { useUIStore } from "@/store/useUIStore";
import { LabsToggle } from "@/components/ui/LabsToggle";
import { useIsHydrated } from "@/hooks/useIsHydrated";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

export function NavBar() {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);
  const { labsEnabled, setLabsEnabled } = useUIStore();
  const isHydrated = useIsHydrated();

  // Close sheet on navigation
  useEffect(() => {
    setSheetOpen(false);
  }, [pathname]);

  const items = useMemo(
    () => (labsEnabled ? labsNavItems : primaryNavItems),
    [labsEnabled],
  );

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "s") {
        e.preventDefault();
        router.push("/studio");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [router]);

  const renderLink = (item: NavItem) => {
    const active = isActive(item.href);
    return (
      <motion.li
        key={item.href}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
      >
        <Link
          href={item.href}
          className={`relative inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${
            active
              ? "text-[#c1ff00] shadow-[0_0_18px_rgba(193,255,0,0.35)]"
              : "text-white/70 hover:text-white"
          }`}
          data-active={active ? "true" : "false"}
        >
          {item.label}
          <span
            className={`absolute inset-x-3 -bottom-1 h-[2px] origin-left rounded-full transition-transform duration-300 ${
              active
                ? "scale-x-100 bg-gradient-to-r from-[#c1ff00] via-[#7c3aed] to-transparent"
                : "scale-x-0 bg-white/40"
            }`}
          />
        </Link>
      </motion.li>
    );
  };

  // Prevent hydration mismatch by only rendering after client hydration
  if (!isHydrated) {
    return (
      <header className="fixed top-0 left-0 right-0 z-[101] border-b border-white/10 bg-black/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
          <div className="h-10 w-10" /> {/* Placeholder for logo */}
        </div>
      </header>
    );
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-[101] border-b border-white/10 bg-black/60 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 shadow-[0_0_20px_rgba(193,255,0,0.25)]">
            <Headphones className="h-5 w-5 text-[#c1ff00]" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/60">
              Piko Studio
            </p>
            <p className="text-sm font-semibold text-white">Hip Hop / Remix</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-4 md:flex">
          <ul className="flex items-center gap-2">{items.map(renderLink)}</ul>
          <LabsToggle className="ml-4" />
        </nav>

        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <button
              aria-label="Toggle navigation"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="w-full border-white/10 bg-black/90 text-white sm:max-w-sm"
          >
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between py-3 border-b border-white/10">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/80">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-white/40 bg-black/50 text-[#c1ff00] accent-[#c1ff00]"
                    checked={labsEnabled}
                    onChange={(e) => setLabsEnabled(e.target.checked)}
                  />
                  <span className="flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5 text-[#7c3aed]" />
                    Labs (Studio V2)
                  </span>
                </label>
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-white/60">
                  <Radio className="h-4 w-4 text-[#c1ff00]" />S to open Studio
                </div>
              </div>
              <ul className="grid gap-2 mt-4 flex-1">
                {items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold uppercase tracking-[0.16em] transition ${
                        isActive(item.href)
                          ? "text-[#c1ff00] border-[#c1ff00]/30"
                          : "text-white/80 hover:text-white"
                      }`}
                    >
                      <span>{item.label}</span>
                      {isActive(item.href) && (
                        <motion.span
                          layoutId={`mobile-underline-${item.href}`}
                          className="h-1 w-10 rounded-full bg-gradient-to-r from-[#c1ff00] to-[#7c3aed]"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        />
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-4 grid grid-cols-2 gap-2 text-xs text-white/70">
                <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                  <Headphones className="h-4 w-4 text-[#c1ff00]" />
                  Listen
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                  <Waves className="h-4 w-4 text-[#7c3aed]" />
                  Studio
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
