"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface FaderProps {
  label?: string;
  value: number; // 0-1
  onChange: (value: number) => void;
  height?: number;
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

export function Fader({ label, value, onChange, height = 192 }: FaderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const [isEngaged, setIsEngaged] = useState(false);
  const cleanupRef = useRef<(() => void) | null>(null);

  const updateFromPointer = useCallback(
    (clientY: number) => {
      const rect = trackRef.current?.getBoundingClientRect();
      if (!rect) return;
      const ratio = 1 - (clientY - rect.top) / rect.height;
      const nextValue = clamp01(ratio);
      onChange(nextValue);
    },
    [onChange]
  );

  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      if (!draggingRef.current) return;
      updateFromPointer(event.clientY);
    },
    [updateFromPointer]
  );

  const handlePointerUp = useCallback(
    (event: PointerEvent) => {
      draggingRef.current = false;
      setIsEngaged(false);
      trackRef.current?.releasePointerCapture?.(event.pointerId);
      // Use cleanup ref to avoid circular dependency
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    },
    []
  );

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      draggingRef.current = true;
      event.preventDefault();
      setIsEngaged(true);
      trackRef.current?.setPointerCapture(event.pointerId);
      updateFromPointer(event.clientY);

      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);

      // Store cleanup function
      cleanupRef.current = () => {
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
      };
    },
    [handlePointerMove, handlePointerUp, updateFromPointer]
  );

  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, []);

  const clamped = clamp01(value);
  const handlePosition = `${(1 - clamped) * 100}%`;
  const handleShadow = isEngaged
    ? "0 10px 18px rgba(0,0,0,0.55), 0 6px 10px rgba(0,0,0,0.4)"
    : "0 16px 28px rgba(0,0,0,0.6), 0 10px 16px rgba(0,0,0,0.45)";

  return (
    <div className="flex flex-col items-center gap-2 select-none touch-none">
      {label && <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-white/60">{label}</div>}
      <div className="relative w-16" style={{ height }}>
        <div
          ref={trackRef}
          className="absolute inset-x-1/2 -translate-x-1/2 top-0 bottom-0 w-3 rounded-full bg-linear-to-b from-[#0c0d12] via-[#06070a] to-[#0c0d12] border border-white/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),inset_0_-10px_22px_rgba(0,0,0,0.75)]"
          onPointerDown={handlePointerDown}
        >
          <div className="absolute inset-x-1 top-4 bottom-4 rounded-full border border-white/5 bg-linear-to-b from-[#11131a] to-[#05060a]" />
          <div className="absolute left-1/2 -translate-x-1/2 top-3 bottom-3 w-px bg-linear-to-b from-white/30 via-white/10 to-white/30 pointer-events-none" />
        </div>
        <div
          className="absolute left-1/2 -translate-x-1/2 w-14 h-12 rounded-lg bg-linear-to-br from-[#1f2330] via-[#0d0f16] to-[#090a0f] border border-white/10 shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)] cursor-grab active:cursor-grabbing transition-[box-shadow,transform] duration-150 will-change-transform"
          style={{
            top: handlePosition,
            transform: `translate(-50%, -50%)${isEngaged ? " translateY(1px)" : ""}`,
            boxShadow: handleShadow,
          }}
          onPointerDown={handlePointerDown}
        >
          <div className="absolute inset-1 rounded-md bg-linear-to-br from-white/8 via-transparent to-white/5" />
          <div className="absolute inset-y-2 left-1.5 right-1.5 rounded-md bg-linear-to-r from-[#0b0d12] via-[#06070c] to-[#0b0d12] border border-white/5" />
          <div className="absolute inset-y-3 left-2 right-2 rounded-sm bg-[#12141c]" />
        </div>
      </div>
      <div className="text-[11px] font-mono text-white/50">{Math.round(clamped * 100)}%</div>
    </div>
  );
}
