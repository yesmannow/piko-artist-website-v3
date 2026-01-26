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

export function ComplexityModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ComplexityMode>(() => {
    if (typeof window === 'undefined') return 'simple';
    const stored = localStorage.getItem(STORAGE_KEY);
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

  // Auto-switch to Pro if user interacts with advanced features
  const autoSwitchToPro = useCallback(() => {
    if (mode === 'simple') {
      setModeState('pro');
    }
  }, [mode]);

  const value: ComplexityModeContextType = {
    mode,
    setMode,
    toggleMode,
    isPro: mode === 'pro',
    isSimple: mode === 'simple',
  };

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
