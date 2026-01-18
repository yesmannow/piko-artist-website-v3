"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState, useEffect } from "react";
import { NAV_ITEMS } from "@/config/nav";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function NavBar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const items = useMemo(() => NAV_ITEMS, []);

  // Hydration probe (temporary - remove after verification)
  useEffect(() => {
    console.log("[NavBar] hydrated/mounted");
  }, []);

  // Click-block diagnosis helper (temporary - remove after nav works)
  useEffect(() => {
    const diagnoseClickBlock = () => {
      // Check element at top-right (mobile menu button area)
      const x = window.innerWidth - 24;
      const y = 24;
      const el = document.elementFromPoint(x, y);
      const stack = document.elementsFromPoint(x, y);

      const navHeader = document.querySelector("header[class*='z-[9999]']");
      const menuButton = document.querySelector("button[aria-label='Toggle navigation']");

      console.log("[NavBar] Click-block diagnosis:", {
        elementFromPoint: el ? {
          tag: el.tagName,
          className: el.className,
          id: el.id,
          isNav: navHeader?.contains(el),
          isButton: menuButton === el || menuButton?.contains(el),
        } : null,
        elementsFromPointStack: stack.slice(0, 5).map(e => ({
          tag: e.tagName,
          className: e.className,
          id: e.id,
          zIndex: window.getComputedStyle(e).zIndex,
          pointerEvents: window.getComputedStyle(e).pointerEvents,
          position: window.getComputedStyle(e).position,
        })),
      });

      // If top element is not nav/button, warn about blocking overlay
      if (el && navHeader && !navHeader.contains(el) && menuButton !== el && !menuButton?.contains(el)) {
        const styles = window.getComputedStyle(el);
        console.warn("[NavBar] ⚠️ BLOCKING OVERLAY DETECTED:", {
          element: `${el.tagName}${el.className ? `.${el.className.split(' ').join('.')}` : ''}${el.id ? `#${el.id}` : ''}`,
          zIndex: styles.zIndex,
          pointerEvents: styles.pointerEvents,
          position: styles.position,
          fix: "Add pointer-events-none to this element or lower its z-index below z-[9999]",
        });
      }
    };

    // Run diagnosis after DOM is ready
    const timeoutId = setTimeout(diagnoseClickBlock, 1000);
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <header className="sticky top-0 z-[9999] w-full border-b border-white/10 bg-black/60 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full border border-white/15 bg-white/10" />
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/60">Piko Studio</p>
            <p className="text-sm font-semibold text-white">Hip Hop / Remix</p>
          </div>
        </Link>

        {/* Desktop */}
        <nav className="hidden md:flex items-center gap-2">
          {items.map((it) => {
            const active = isActive(pathname, it.href);
            return (
              <Link
                key={it.href}
                href={it.href}
                className={[
                  "rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition-colors",
                  active ? "text-white" : "text-white/70 hover:text-white",
                ].join(" ")}
              >
                {it.label}
              </Link>
            );
          })}
        </nav>

        {/* Mobile */}
        <button
          className="md:hidden rounded-full border border-white/15 bg-white/5 px-4 py-2 text-white"
          onClick={() => setMobileOpen((v) => !v)}
          aria-expanded={mobileOpen}
          aria-label="Toggle navigation"
        >
          Menu
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 bg-black/80">
          <div className="mx-auto max-w-6xl px-4 py-3">
            <div className="flex flex-col gap-2">
              {items.map((it) => {
                const active = isActive(pathname, it.href);
                return (
                  <Link
                    key={it.href}
                    href={it.href}
                    className={[
                      "rounded-lg px-3 py-3 text-sm font-semibold",
                      active ? "bg-white/10 text-white" : "text-white/80 hover:bg-white/5 hover:text-white",
                    ].join(" ")}
                    onClick={() => setMobileOpen(false)}
                  >
                    {it.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
