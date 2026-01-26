"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";

interface KnobProps {
  label: string;
  value: number; // expected 0-1
  onChange: (value: number) => void;
  size?: number;
  color?: string;
  bipolar?: boolean;
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

export function Knob({
  label,
  value,
  onChange,
  size = 88,
  color = "#22d3ee",
  bipolar = false,
}: KnobProps) {
  const dragRef = useRef(false);
  const lastYRef = useRef(0);
  const valueRef = useRef(clamp01(value));
  const knobRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    valueRef.current = clamp01(value);
  }, [value]);

  const ringRadius = 38;
  const circumference = 2 * Math.PI * ringRadius;
  const progress = clamp01(value) * circumference;
  const angle = useMemo(() => -135 + clamp01(value) * 270, [value]);

  const snapValue = useCallback(
    (next: number) => {
      if (!bipolar) return clamp01(next);
      const snapped = clamp01(next);
      return Math.abs(snapped - 0.5) < 0.025 ? 0.5 : snapped;
    },
    [bipolar]
  );

  const updateValue = useCallback(
    (clientY: number) => {
      const delta = lastYRef.current - clientY;
      lastYRef.current = clientY;
      const sensitivity = bipolar ? 0.0042 : 0.005;
      const proposed = valueRef.current + delta * sensitivity;
      const nextValue = snapValue(proposed);
      valueRef.current = nextValue;
      onChange(nextValue);
    },
    [onChange, snapValue, bipolar]
  );

  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      if (!dragRef.current) return;
      updateValue(event.clientY);
    },
    [updateValue]
  );

  const handlePointerUp = useCallback((event: PointerEvent) => {
    dragRef.current = false;
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", handlePointerUp);
    knobRef.current?.releasePointerCapture?.(event.pointerId);
  }, [handlePointerMove]);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      dragRef.current = true;
      lastYRef.current = event.clientY;
      knobRef.current?.setPointerCapture(event.pointerId);
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
    },
    [handlePointerMove, handlePointerUp]
  );

  useEffect(() => {
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  const idBase = useMemo(() => label.replace(/\s+/g, "-").toLowerCase(), [label]);
  const ringGradientId = `${idBase}-ring`;
  const bezelGradientId = `${idBase}-bezel`;
  const centerGradientId = `${idBase}-center`;

  const accent = color;

  return (
    <div className="flex flex-col items-center gap-2 select-none touch-none">
      <div
        ref={knobRef}
        className="relative rounded-full cursor-grab active:cursor-grabbing"
        style={{ width: size, height: size }}
        onPointerDown={handlePointerDown}
        role="slider"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(clamp01(value) * 100)}
        aria-label={label}
      >
        <svg viewBox="0 0 120 120" className="absolute inset-0 drop-shadow-[0_4px_12px_rgba(0,0,0,0.35)]">
          <defs>
            <linearGradient id={ringGradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={accent} stopOpacity="0.7" />
              <stop offset="100%" stopColor={accent} stopOpacity="1" />
            </linearGradient>
            <radialGradient id={bezelGradientId} cx="50%" cy="50%" r="70%">
              <stop offset="0%" stopColor="#17181c" />
              <stop offset="60%" stopColor="#0d0d0f" />
              <stop offset="100%" stopColor="#050507" />
            </radialGradient>
            <linearGradient id={centerGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1c1e24" />
              <stop offset="50%" stopColor="#0f1014" />
              <stop offset="100%" stopColor="#181a20" />
            </linearGradient>
          </defs>
          {/* Outer bezel */}
          <circle cx="60" cy="60" r="56" fill={`url(#${bezelGradientId})`} />
          {/* Base track */}
          <circle
            cx="60"
            cy="60"
            r={ringRadius}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="8"
            strokeLinecap="round"
            transform="rotate(-135 60 60)"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset="0"
          />
          {/* Progress ring */}
          <circle
            cx="60"
            cy="60"
            r={ringRadius}
            fill="none"
            stroke={`url(#${ringGradientId})`}
            strokeWidth="8"
            strokeLinecap="round"
            transform="rotate(-135 60 60)"
            strokeDasharray={`${progress} ${circumference}`}
            strokeDashoffset="0"
            style={{ filter: "drop-shadow(0 0 6px rgba(34,211,238,0.6))" }}
          />
          {/* Detent marker */}
          <circle cx="60" cy="60" r="22" fill="#0c0d10" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />
          <circle cx="60" cy="60" r="18" fill={`url(#${centerGradientId})`} />
          {/* Indicator line */}
          <line
            x1="60"
            y1="24"
            x2="60"
            y2="40"
            stroke={accent}
            strokeWidth="4"
            strokeLinecap="round"
            transform={`rotate(${angle} 60 60)`}
          />
          {/* Center detent tick */}
          {bipolar && (
            <line
              x1="60"
              y1="22"
              x2="60"
              y2="30"
              stroke="rgba(255,255,255,0.4)"
              strokeWidth="2"
              strokeLinecap="round"
              transform="rotate(0 60 60)"
            />
          )}
        </svg>
        <div className="absolute inset-0 rounded-full pointer-events-none shadow-[inset_0_1px_0_rgba(255,255,255,0.12),inset_0_-6px_18px_rgba(0,0,0,0.55)]" />
      </div>
      <div className="flex flex-col items-center leading-tight">
        <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-white/60">{label}</div>
        <div className="text-[11px] font-mono text-white/50">{Math.round(clamp01(value) * 100)}%</div>
      </div>
    </div>
  );
}
