"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Home, Music, Video, Mail, Radio } from "lucide-react";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/music", label: "Music", icon: Music },
  { href: "/videos", label: "Videos", icon: Video },
  { href: "/contact", label: "Contact", icon: Mail },
];

export function StudioNavMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on ESC key
  useEffect(() => {
    if (!isOpen) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen]);

  // Close menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Hamburger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-2 left-2 z-50 p-2 rounded border border-white/10 bg-black/50 hover:bg-black/70 hover:border-[#FFD700]/50 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
        aria-label="Open navigation menu"
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-[#E0E0E0]" />
        ) : (
          <Menu className="w-6 h-6 text-[#E0E0E0]" />
        )}
      </button>

      {/* Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />

            {/* Menu Panel */}
            <motion.div
              ref={menuRef}
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 left-0 bottom-0 w-64 bg-[#050505] border-r border-[#FFD700]/20 shadow-2xl z-50 flex flex-col"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <h2 className="text-lg font-black uppercase tracking-wider text-[#FFD700]">
                  Navigation
                </h2>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded border border-white/10 hover:border-[#FFD700]/50 hover:bg-black/50 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5 text-[#E0E0E0]" />
                </button>
              </div>

              {/* Nav Items */}
              <nav className="flex-1 overflow-y-auto p-4 space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded border-2 transition-all touch-manipulation min-h-[44px] ${
                        isActive
                          ? "bg-[#FFD700]/10 border-[#FFD700] text-[#FFD700]"
                          : "bg-black/30 border-white/10 text-[#E0E0E0] hover:border-[#FFD700]/50 hover:bg-black/50"
                      }`}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className="font-bold uppercase tracking-wider text-sm">
                        {item.label}
                      </span>
                    </Link>
                  );
                })}

                {/* Studio Link (current page) */}
                <div className="pt-4 border-t border-white/10">
                  <div className="flex items-center gap-3 px-4 py-3 rounded border-2 bg-[#FFD700]/20 border-[#FFD700] text-[#FFD700] min-h-[44px]">
                    <Radio className="w-5 h-5 flex-shrink-0" />
                    <span className="font-bold uppercase tracking-wider text-sm">
                      Studio (Current)
                    </span>
                  </div>
                </div>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
