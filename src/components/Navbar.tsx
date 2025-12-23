"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

const navItems = [
  { name: "Home", path: "/" },
  { name: "About", path: "/about" },
  { name: "Music", path: "/music" },
  { name: "Videos", path: "/videos" },
  { name: "Tour", path: "/tour" },
  { name: "Studio", path: "/beatmaker" },
  { name: "Contact", path: "/contact" },
];

export function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  useEffect(() => {
    if (!isMobile) {
      setIsOpen(false);
    }
  }, [isMobile]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const isActive = (itemPath: string) => pathname === itemPath;

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between md:justify-center px-6 py-6 pointer-events-none bg-gradient-to-b from-black/90 to-transparent">
        <div className="md:hidden pointer-events-auto">
          <span className="font-header text-xl text-white tracking-widest">PIKO</span>
        </div>

        <ul className="hidden md:flex items-center gap-8 pointer-events-auto bg-black/50 backdrop-blur-md px-8 py-3 rounded-full border border-white/10">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <li key={item.path} className="relative">
                <Link
                  href={item.path}
                  className={`text-xs font-bold uppercase tracking-widest transition-colors ${
                    active ? "text-[#ccff00]" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {item.name}
                </Link>
                {active && (
                  <motion.div
                    layoutId="nav-dot"
                    className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#ccff00] shadow-[0_0_10px_#ccff00]"
                  />
                )}
              </li>
            );
          })}
        </ul>

        <div className="md:hidden pointer-events-auto">
          <button
            onClick={() => setIsOpen((prev) => !prev)}
            className="p-2 text-white hover:text-[#ccff00] transition-colors"
            aria-label={isOpen ? "Close menu" : "Open menu"}
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {isOpen && isMobile && (
          <motion.div
            initial={{ opacity: 0, y: "-100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[90] bg-black/80 backdrop-blur-3xl flex flex-col items-center justify-center"
          >
            <div className="flex flex-col gap-6 text-center">
              {navItems.map((item, index) => (
                <motion.div
                  key={item.path}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                >
                  <Link
                    href={item.path}
                    className={`text-4xl font-black uppercase tracking-tighter transition-colors ${
                      isActive(item.path) ? "text-[#ccff00]" : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    {item.name}
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
