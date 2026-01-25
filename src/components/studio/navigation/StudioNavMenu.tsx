"use client";

/**
 * StudioNavMenu - Hamburger Menu for Studio Navigation
 * 
 * Slide-out drawer from left side with site navigation links
 * Studio-specific dark theme styling
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, Home, Music, Video, Radio, Mail } from 'lucide-react';

interface NavItem {
  name: string;
  path: string;
  icon: typeof Home;
}

const navItems: NavItem[] = [
  { name: 'Home', path: '/', icon: Home },
  { name: 'Music', path: '/music', icon: Music },
  { name: 'Videos', path: '/videos', icon: Video },
  { name: 'Studio', path: '/studio', icon: Radio },
  { name: 'Contact', path: '/contact', icon: Mail },
];

export function StudioNavMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Close menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleNavClick = (path: string) => {
    setIsOpen(false);
    router.push(path);
  };

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
        aria-label="Open navigation menu"
      >
        <Menu className="w-5 h-5 text-white" />
      </button>

      {/* Menu Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200]"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-80 bg-obsidian-900 border-r border-white/10 z-[201] flex flex-col shadow-2xl"
            >
              {/* Header */}
              <div className="glass-panel p-4 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-xl font-black uppercase text-white">Navigation</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5 text-white/80" />
                </button>
              </div>

              {/* Navigation Items */}
              <nav className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.path;

                  return (
                    <button
                      key={item.path}
                      onClick={() => handleNavClick(item.path)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-mono text-sm uppercase transition-colors ${
                        isActive
                          ? 'bg-studio-cyan/20 border-2 border-studio-cyan text-studio-cyan'
                          : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </button>
                  );
                })}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
