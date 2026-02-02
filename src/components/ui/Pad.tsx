"use client";

import React, { useState, useRef, useEffect } from 'react';
import { haptic } from '@/utils/haptics';

export type PadProps = {
  label?: string;
  onTrigger?: () => void;
  onLongPress?: () => void;
  onSecondary?: () => void; // shift+click or long-press menu
  ariaLabel?: string;
  className?: string;
};

export function Pad({ label, onTrigger, onLongPress, onSecondary, ariaLabel, className }: PadProps) {
  const [pressed, setPressed] = useState(false);
  const longPressTimerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  function handlePointerDown(_e: React.PointerEvent) {
    setPressed(true);
    haptic('weak');
    longPressTimerRef.current = window.setTimeout(() => {
      onLongPress?.();
      haptic('medium');
      longPressTimerRef.current = undefined;
    }, 600) as unknown as number;
  }

  function handlePointerUp(_e: React.PointerEvent) {
    setPressed(false);
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = undefined;
      // short press
      onTrigger?.();
    }
  }

  function handlePointerCancel() {
    setPressed(false);
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = undefined;
    }
  }

  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault();
    onSecondary?.();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onTrigger?.();
    }
    if (e.shiftKey && e.key.toLowerCase() === 's') {
      onSecondary?.();
    }
  }

  return (
    <button
      className={`pad ${pressed ? 'pad--pressed' : ''} ${className || ''}`}
      aria-label={ariaLabel ?? label}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onContextMenu={handleContextMenu}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
    >
      {label}
    </button>
  );
}
