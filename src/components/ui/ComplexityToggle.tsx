"use client";

import React from 'react';
import { useComplexityMode } from '@/contexts/ComplexityModeContext';

export function ComplexityToggle() {
  const { mode, setMode } = useComplexityMode();

  return (
    <div role="group" aria-label="Complexity mode" style={{ display: 'flex', gap: 8 }}>
      <button
        aria-pressed={mode === 'simple'}
        onClick={() => setMode('simple')}
        className="btn-toggle"
        style={{
          padding: '6px 12px',
          fontSize: 12,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          background: mode === 'simple' ? 'rgba(74, 242, 197, 0.2)' : 'rgba(255, 255, 255, 0.1)',
          border: `1px solid ${mode === 'simple' ? 'rgba(74, 242, 197, 0.5)' : 'rgba(255, 255, 255, 0.2)'}`,
          borderRadius: 6,
          color: mode === 'simple' ? '#4af2c5' : '#fff',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        Simple
      </button>
      <button
        aria-pressed={mode === 'pro'}
        onClick={() => setMode('pro')}
        className="btn-toggle"
        style={{
          padding: '6px 12px',
          fontSize: 12,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          background: mode === 'pro' ? 'rgba(74, 242, 197, 0.2)' : 'rgba(255, 255, 255, 0.1)',
          border: `1px solid ${mode === 'pro' ? 'rgba(74, 242, 197, 0.5)' : 'rgba(255, 255, 255, 0.2)'}`,
          borderRadius: 6,
          color: mode === 'pro' ? '#4af2c5' : '#fff',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        Pro
      </button>
    </div>
  );
}
