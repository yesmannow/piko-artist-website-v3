"use client";

import React from 'react';
import { useComplexityMode } from '@/contexts/ComplexityModeContext';

export function ComplexityToggle() {
  const { mode, toggleMode, isPro } = useComplexityMode();

  return (
    <button
      onClick={toggleMode}
      className="complexity-toggle"
      aria-label={`Switch to ${isPro ? 'Simple' : 'Pro'} mode`}
      aria-pressed={isPro}
      style={{
        padding: '6px 12px',
        fontSize: 12,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        background: isPro ? 'rgba(74, 242, 197, 0.2)' : 'rgba(255, 255, 255, 0.1)',
        border: `1px solid ${isPro ? 'rgba(74, 242, 197, 0.5)' : 'rgba(255, 255, 255, 0.2)'}`,
        borderRadius: 6,
        color: isPro ? '#4af2c5' : '#fff',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
    >
      {mode}
    </button>
  );
}
