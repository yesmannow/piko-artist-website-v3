"use client";

import React, { useState } from 'react';
import { haptic } from '@/utils/haptics';

export interface JogWheelPressProps {
  onScratchStart?: () => void;
  onScratchEnd?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export function JogWheelPress({ onScratchStart, onScratchEnd, className, children }: JogWheelPressProps) {
  const [pressed, setPressed] = useState(false);

  function handlePointerDown() {
    setPressed(true);
    haptic('medium');
    onScratchStart?.();
  }
  
  function handlePointerUp() {
    setPressed(false);
    haptic('weak');
    onScratchEnd?.();
  }

  return (
    <div
      className={`jog-wheel ${pressed ? 'touch-jog--pressed' : ''} ${className || ''}`}
      role="application"
      aria-label="Jog wheel"
      tabIndex={0}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {children}
    </div>
  );
}
