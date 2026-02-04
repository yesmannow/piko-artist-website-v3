/**
 * ThemeContext.tsx - Dynamic theme provider for studio
 *
 * Provides theme context that updates UI colors based on track energy/BPM.
 * Uses CSS variables for zero-render performance.
 */

"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getThemePreset, type ThemePreset } from '../lib/theme-engine';

interface ThemeContextValue {
  currentTheme: ThemePreset;
  updateTheme: (energy: number, bpm: number) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const defaultTheme: ThemePreset = {
  primary: 'rgba(147, 51, 234, 1)',
  glow: 'rgba(147, 51, 234, 0.4)',
  accent: 'fuchsia',
  speed: 1.5,
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<ThemePreset>(defaultTheme);

  const updateTheme = useCallback((energy: number, bpm: number) => {
    const newTheme = getThemePreset(energy, bpm);
    setCurrentTheme(newTheme);

    // Inject CSS variables into document root for zero-render updates
    const root = document.documentElement;
    root.style.setProperty('--theme-primary', newTheme.primary);
    root.style.setProperty('--theme-glow', newTheme.glow);
    root.style.setProperty('--pulse-speed', `${newTheme.speed}s`);

    // Smooth transition (1s duration)
    root.style.setProperty('--theme-transition', 'all 1s ease-in-out');
  }, []);

  // Initialize with default theme on mount
  useEffect(() => {
    // Schedule initial theme update asynchronously to avoid cascade
    const initTheme = async () => {
      updateTheme(0.5, 128); // Default neutral theme
    };
    void initTheme();
  }, [updateTheme]);

  return (
    <ThemeContext.Provider value={{ currentTheme, updateTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to access theme context
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
