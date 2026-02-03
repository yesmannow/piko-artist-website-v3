"use client";

/**
 * MacroKnob Component
 * 
 * Simple vertical fader-style knob for FX parameters.
 * Displays percentage value and uses color-coded visualization.
 */

interface MacroKnobProps {
  readonly label: string;
  readonly value: number; // 0-1
  readonly onChange: (value: number) => void;
  readonly color: string;
}

export function MacroKnob({ label, value, onChange, color }: MacroKnobProps) {
  const handleDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const normalized = 1 - Math.max(0, Math.min(1, y / rect.height));
    onChange(normalized);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <label className="text-xs font-mono uppercase text-white/60">{label}</label>
      <div
        className="relative w-12 h-24 bg-obsidian-800 rounded-lg border border-white/10 cursor-pointer touch-none"
        onMouseDown={handleDrag}
        style={{ touchAction: 'none' }}
      >
        <div
          className="absolute bottom-0 left-0 right-0 rounded-b-lg transition-all"
          style={{
            height: `${value * 100}%`,
            backgroundColor: color,
            opacity: 0.6,
          }}
        />
        <div
          className="absolute left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white"
          style={{
            bottom: `${value * 100}%`,
            transform: 'translate(-50%, 50%)',
          }}
        />
      </div>
      <span className="text-xs font-mono text-white/80">{Math.round(value * 100)}%</span>
    </div>
  );
}
