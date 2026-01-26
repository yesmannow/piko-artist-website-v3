"use client";

import React, { useState, useEffect } from 'react';

const shortcuts = [
  { key: 'Space', description: 'Play/Pause focused deck' },
  { key: 'C', description: 'Cue' },
  { key: 'S', description: 'Sync to master BPM' },
  { key: 'Shift+S', description: 'Secondary action (context menu)' },
  { key: 'L', description: 'Toggle library' },
  { key: 'F', description: 'Toggle FX panel' },
  { key: 'Tab', description: 'Switch between decks' },
  { key: 'Esc', description: 'Close overlays' },
];

export function ShortcutsOverlay() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="shortcuts-overlay"
      role="dialog"
      aria-label="Keyboard shortcuts"
      aria-modal="true"
      onClick={() => setIsOpen(false)}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(8px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'rgba(15, 15, 40, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 12,
          padding: 24,
          maxWidth: 500,
          width: '100%',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: 0 }}>Keyboard Shortcuts</h2>
          <button
            onClick={() => setIsOpen(false)}
            aria-label="Close shortcuts"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#fff',
              fontSize: 24,
              cursor: 'pointer',
              padding: 0,
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {shortcuts.map((shortcut) => (
            <div
              key={shortcut.key}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 0',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <span style={{ color: '#9ca3af', fontSize: 14 }}>{shortcut.description}</span>
              <kbd
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: 4,
                  padding: '4px 8px',
                  fontSize: 12,
                  fontFamily: 'monospace',
                  color: '#fff',
                }}
              >
                {shortcut.key}
              </kbd>
            </div>
          ))}
        </div>
        <p style={{ marginTop: 20, fontSize: 12, color: '#9ca3af', textAlign: 'center' }}>
          Press <kbd style={{ padding: '2px 6px', background: 'rgba(255,255,255,0.1)', borderRadius: 3 }}>?</kbd> to toggle this overlay
        </p>
      </div>
    </div>
  );
}
