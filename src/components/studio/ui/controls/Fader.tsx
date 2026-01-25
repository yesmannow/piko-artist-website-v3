"use client";

import { useEffect, useRef } from "react";

interface FaderProps {
  label?: string;
  value: number;
  onChange: (value: number) => void;
  height?: number;
}

const clamp = (value: number) => Math.max(0, Math.min(1, value));

export function Fader({ label, value, onChange, height = 256 }: FaderProps) {
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

  return (
    <div className="flex flex-col items-center gap-2 select-none touch-none">
      {label && <div className="text-[10px] font-mono uppercase tracking-widest text-white/60">{label}</div>}
      <div className="relative w-12 flex items-center justify-center touch-none" style={{ height }}>
        <div className="absolute inset-y-0 w-2 bg-black/60 rounded-full shadow-inner" />
        <div
          className="absolute w-12 h-8 bg-gradient-to-b from-gray-700 to-gray-900 border-t border-white/20 shadow-xl rounded-md"
          style={{ bottom: `${value * 100}%`, transform: "translateY(50%)" }}
          onPointerDown={(event) => {
            isDragging.current = true;
            lastY.current = event.clientY;
          }}
        />
      </div>
    </div>
  );
}
