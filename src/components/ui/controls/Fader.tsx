import { useRef, useState, useEffect } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";

interface FaderProps {
  label?: string;
  value: number; // 0-1
  onChange: (value: number) => void;
  height?: number;
}

export function Fader({ label, value, onChange, height = 192 }: FaderProps) {
  const [isEngaged, setIsEngaged] = useState(false);

  // Create a motion value for the pixel position (relative to bottom-up)
  const yMotion = useMotionValue((1 - value) * height);

  // Map pixel Y back to 0-1 normalized value
  const normalizedValue = useTransform(yMotion, [0, height], [1, 0]);

  // Sync internal motion value with external prop changes (e.g., from other controllers)
  useEffect(() => {
    yMotion.set((1 - value) * height);
  }, [value, height, yMotion]);

  useEffect(() => {
    // Listen for changes and propagate to store
    return normalizedValue.on("change", (latest) => {
      // Small dead-zone or snapping could be added here
      onChange(latest);
    });
  }, [normalizedValue, onChange]);

  const handleShadow = isEngaged
    ? "0 10px 18px rgba(0,0,0,0.55), 0 6px 10px rgba(0,0,0,0.4)"
    : "0 16px 28px rgba(0,0,0,0.6), 0 10px 16px rgba(0,0,0,0.45)";

  return (
    <div className="flex flex-col items-center gap-2 select-none touch-none">
      {label && <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-white/60">{label}</div>}
      <div className="relative w-16" style={{ height }}>
        {/* Track Background */}
        <div
          className="absolute inset-x-1/2 -translate-x-1/2 top-0 bottom-0 w-3 rounded-full bg-linear-to-b from-[#0c0d12] via-[#06070a] to-[#0c0d12] border border-white/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),inset_0_-10px_22px_rgba(0,0,0,0.75)]"
        >
          <div className="absolute inset-x-1 top-4 bottom-4 rounded-full border border-white/5 bg-linear-to-b from-[#11131a] to-[#05060a]" />
          <div className="absolute left-1/2 -translate-x-1/2 top-3 bottom-3 w-px bg-linear-to-b from-white/30 via-white/10 to-white/30 pointer-events-none" />
        </div>

        {/* Floating Handle (Fader Cap) */}
        <motion.div
          drag="y"
          dragConstraints={{ top: 0, bottom: height }}
          dragElastic={0.05}
          dragMomentum={true}
          style={{
            y: yMotion,
            boxShadow: handleShadow,
            touchAction: 'none'
          }}
          onPointerDown={() => setIsEngaged(true)}
          onPointerUp={() => setIsEngaged(false)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
          className="absolute left-1/2 -translate-x-1/2 w-14 h-12 rounded-lg bg-linear-to-br from-[#1f2330] via-[#0d0f16] to-[#090a0f] border border-white/10 shadow-[0_8px_24px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)] cursor-grab active:cursor-grabbing transition-[box-shadow,transform] duration-150 will-change-transform z-10"
        >
          <div className="absolute inset-1 rounded-md bg-linear-to-br from-white/8 via-transparent to-white/5" />
          <div className="absolute inset-y-2 left-1.5 right-1.5 rounded-md bg-linear-to-r from-[#0b0d12] via-[#06070c] to-[#0b0d12] border border-white/5" />
          <div className="absolute inset-y-3 left-2 right-2 rounded-sm bg-[#12141c]" />
          {/* Central Grip Indicator */}
          <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-8 h-[2px] bg-[#00F2FF]/20 shadow-[0_0_8px_rgba(0,242,255,0.2)]" />
        </motion.div>
      </div>
      <div className="text-[11px] font-mono text-white/50">{Math.round(value * 100)}%</div>
    </div>
  );
}
