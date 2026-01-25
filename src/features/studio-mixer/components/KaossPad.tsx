"use client";

import { useCallback, useMemo, useRef } from "react";

export interface KaossPadProps {
  x01: number;
  y01: number;
  onChange: (x01: number, y01: number) => void;
  label?: string;
  xLabel?: string;
  yLabel?: string;
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export function KaossPad({ x01, y01, onChange, label = "KAOSS_FX", xLabel = "FILTER", yLabel = "REVERB" }: KaossPadProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  const handlePointer = useCallback(
    (clientX: number, clientY: number) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const nx = clamp01((clientX - r.left) / Math.max(1, r.width));
      const ny = clamp01((clientY - r.top) / Math.max(1, r.height));
      onChange(nx, ny);
    },
    [onChange]
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      handlePointer(e.clientX, e.clientY);
    },
    [handlePointer]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (e.buttons === 0) return;
      handlePointer(e.clientX, e.clientY);
    },
    [handlePointer]
  );

  const crosshairStyle = useMemo(() => {
    return {
      left: `${x01 * 100}%`,
      top: `${y01 * 100}%`,
      transform: "translate(-50%, -50%)",
    } as const;
  }, [x01, y01]);

  return (
    <div className="col-span-2 md:col-span-2 lg:col-span-2 flex flex-col items-center justify-center gap-3 border-2 border-[#E0E0E0]/70 p-3 bg-[#050505]">
      <div className="flex flex-col gap-2 w-full max-w-[220px]">
        <div className="flex justify-between items-end px-1">
          <span className="text-xs font-black italic text-toxic-lime uppercase tracking-wider">
            {label}
          </span>
          <div className="flex gap-2 text-[9px] font-mono text-zinc-500">
            <span>X: {xLabel}</span>
            <span>Y: {yLabel}</span>
          </div>
        </div>

        <div
          ref={ref}
          className="relative w-full aspect-square bg-[#080808] border-2 border-zinc-800 overflow-hidden touch-none cursor-crosshair active:border-toxic-lime transition-colors duration-200"
          style={{
            backgroundImage:
              "linear-gradient(rgb(204 255 0 / 0.03) 1px, transparent 1px), linear-gradient(90deg, rgb(204 255 0 / 0.03) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
            touchAction: "none",
            minWidth: 44,
            minHeight: 44,
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
        >
          <div
            className="absolute w-6 h-6 border-2 border-toxic-lime z-10 pointer-events-none"
            style={crosshairStyle}
          >
            <div className="absolute top-1/2 left-0 right-0 h-px bg-toxic-lime/50" />
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-toxic-lime/50" />
          </div>

          <div className="absolute bottom-2 right-2 text-[10px] font-mono text-toxic-lime opacity-50 pointer-events-none">
            {x01.toFixed(2)}, {y01.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
}

