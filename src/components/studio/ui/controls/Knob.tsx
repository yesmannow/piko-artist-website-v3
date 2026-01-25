"use client";

import { useEffect, useRef } from "react";

interface KnobProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  size?: number;
  color?: string;
}

const clamp = (value: number) => Math.max(0, Math.min(1, value));

export function Knob({ label, value, onChange, size = 64, color = "#22d3ee" }: KnobProps) {
  const isDragging = useRef(false);
  const lastY = useRef(0);

  useEffect(() => {
    const handleMove = (event: PointerEvent) => {
      if (!isDragging.current) return;
      const delta = lastY.current - event.clientY;
      lastY.current = event.clientY;
      const nextValue = clamp(value + delta * 0.005);
      onChange(nextValue);
    };

    const handleUp = () => {
      isDragging.current = false;
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [onChange, value]);

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const progress = circumference * value;
  const angle = -135 + value * 270;

  return (
    <div className="flex flex-col items-center gap-2 select-none touch-none">
      <div
        className="flex items-center justify-center touch-none"
        style={{ width: size, height: size }}
        onPointerDown={(event) => {
          isDragging.current = true;
          lastY.current = event.clientY;
        }}
      >
        <svg width={size} height={size} viewBox="0 0 100 100">
          <path
            d="M20,80 A40,40 0 1,1 80,80"
            fill="none"
            stroke="#2a2a2a"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <path
            d="M20,80 A40,40 0 1,1 80,80"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${progress} ${circumference}`}
          />
          <circle cx="50" cy="50" r="30" fill="#1a1a1a" stroke="#444" strokeWidth="2" />
          <line
            x1="50"
            y1="50"
            x2="50"
            y2="20"
            stroke="white"
            strokeWidth="3"
            transform={`rotate(${angle}, 50, 50)`}
          />
        </svg>
      </div>
      <div className="text-[10px] font-mono uppercase tracking-widest text-white/60">{label}</div>
    </div>
  );
}
