"use client";

import { useCallback, useEffect, useState } from "react";
import { Palette } from "lucide-react";

/**
 * Phase 2: Studio Theme Switcher
 * 
 * Allows users to switch between hip-hop inspired Studio themes.
 * Persists theme choice to localStorage.
 * Sets data-studio-theme attribute on .studio-shell element.
 */

const THEMES = [
  { id: "", name: "Midnight Studio", desc: "Default dark blue" },
  { id: "boom-bap", name: "Boom-Bap", desc: "Warm vinyl grit" },
  { id: "trap-neon", name: "Trap Neon", desc: "Electric cyber" },
  { id: "noir", name: "Noir", desc: "Minimal dark" },
  { id: "street-tech", name: "Street Tech", desc: "Urban tactical" },
] as const;

type ThemeId = (typeof THEMES)[number]["id"];

const STORAGE_KEY = "studio_theme";

// Initialize theme from localStorage (SSR-safe)
const getInitialTheme = (): ThemeId => {
  if (globalThis.window === undefined) return "";
  const stored = localStorage.getItem(STORAGE_KEY) as ThemeId | null;
  return stored && THEMES.some((t) => t.id === stored) ? stored : "";
};

export function StudioThemeSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<ThemeId>(getInitialTheme);

  // Apply theme to DOM
  const applyTheme = useCallback((themeId: ThemeId) => {
    const shell = document.querySelector(".studio-shell");
    if (!shell || !(shell instanceof HTMLElement)) return;

    if (themeId === "") {
      delete shell.dataset.studioTheme;
    } else {
      shell.dataset.studioTheme = themeId;
    }
  }, []);

  // Apply initial theme on mount
  useEffect(() => {
    applyTheme(currentTheme);
  }, [applyTheme, currentTheme]);

  // Handle theme selection
  const handleThemeSelect = useCallback(
    (themeId: ThemeId) => {
      setCurrentTheme(themeId);
      localStorage.setItem(STORAGE_KEY, themeId);
      applyTheme(themeId);
      setIsOpen(false);
    },
    [applyTheme]
  );

  const currentThemeName =
    THEMES.find((t) => t.id === currentTheme)?.name ?? "Midnight Studio";

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-(--studio-text-secondary) hover:text-(--studio-text-primary) hover:bg-(--studio-bg-tertiary) rounded-lg transition-colors"
        aria-label="Change studio theme"
        aria-expanded={isOpen}
      >
        <Palette className="w-4 h-4" />
        <span className="hidden sm:inline">{currentThemeName}</span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Menu Panel */}
          <div className="absolute right-0 top-full mt-2 z-50 min-w-60 bg-(--studio-bg-secondary) border border-(--studio-border-normal) rounded-lg shadow-lg overflow-hidden">
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-medium text-(--studio-text-tertiary) uppercase tracking-wide">
                Studio Themes
              </div>

              {THEMES.map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => handleThemeSelect(theme.id)}
                  className={`
                    w-full px-3 py-2 text-left rounded-md transition-colors
                    ${
                      currentTheme === theme.id
                        ? "bg-(--studio-accent-primary) text-black font-medium"
                        : "text-(--studio-text-primary) hover:bg-(--studio-bg-tertiary)"
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">{theme.name}</div>
                      <div
                        className={`text-xs ${
                          currentTheme === theme.id
                            ? "text-black/70"
                            : "text-(--studio-text-secondary)"
                        }`}
                      >
                        {theme.desc}
                      </div>
                    </div>
                    {currentTheme === theme.id && (
                      <div className="w-2 h-2 rounded-full bg-black" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
