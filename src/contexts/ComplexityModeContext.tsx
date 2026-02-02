"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type ComplexityMode = 'simple' | 'pro';

interface ComplexityModeContextType {
  mode: ComplexityMode;
  setMode: (mode: ComplexityMode) => void;
  toggleMode: () => void;
  isPro: boolean;
  isSimple: boolean;
}

const ComplexityModeContext = createContext<ComplexityModeContextType | undefined>(undefined);

const STORAGE_KEY = 'piko-complexity-mode';

export function ComplexityModeProvider({ children }: { readonly children: React.ReactNode }) {
  const [mode, setModeState] = useState<ComplexityMode>(() => {
    if (typeof globalThis === 'undefined') return 'simple';
    const ls = (globalThis as unknown as { localStorage?: Storage }).localStorage;
    if (!ls) return 'simple';
    const stored = ls.getItem(STORAGE_KEY);
    return (stored === 'pro' || stored === 'simple') ? stored : 'simple';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  const setMode = useCallback((newMode: ComplexityMode) => {
    setModeState(newMode);
  }, []);

  const toggleMode = useCallback(() => {
    setModeState((prev) => (prev === 'simple' ? 'pro' : 'simple'));
  }, []);

  // Note: autoSwitchToPro helper intentionally removed to avoid unused variable lint.

  const value = React.useMemo<ComplexityModeContextType>(() => ({
    mode,
    setMode,
    toggleMode,
    isPro: mode === 'pro',
    isSimple: mode === 'simple',
  }), [mode, setMode, toggleMode]);

  return (
    <ComplexityModeContext.Provider value={value}>
      {children}
    </ComplexityModeContext.Provider>
  );
}

export function useComplexityMode() {
  const context = useContext(ComplexityModeContext);
  if (context === undefined) {
    throw new Error('useComplexityMode must be used within a ComplexityModeProvider');
  }
  return context;
}
