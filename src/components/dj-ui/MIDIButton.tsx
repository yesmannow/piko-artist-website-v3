"use client";

import { ReactNode } from "react";
import { useMIDIStore, type MIDIAction } from "@/store/useMIDIStore";
import { Radio } from "lucide-react";

interface MIDIButtonProps {
  children: ReactNode;
  midiAction?: MIDIAction;
  onClick?: () => void;
  className?: string;
  title?: string;
  disabled?: boolean;
}

/**
 * Button component with MIDI Learn support
 */
export function MIDIButton({
  children,
  midiAction,
  onClick,
  className = "",
  title,
  disabled = false,
}: MIDIButtonProps) {
  const { learnMode, startLearn, mappings } = useMIDIStore();

  // Check if this button has a MIDI mapping
  const hasMIDIMapping = midiAction ? Object.values(mappings).some(m => m.action === midiAction) : false;

  const handleClick = () => {
    // If in learn mode and we have a midiAction, start learning
    if (learnMode && midiAction) {
      startLearn(midiAction);
      return;
    }

    // Otherwise, execute the normal click handler
    onClick?.();
  };

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        disabled={disabled}
        className={`relative ${className} ${
          hasMIDIMapping ? 'ring-1 ring-cyan-500/50' : ''
        }`}
        title={title}
      >
        {children}

        {/* MIDI glow effect */}
        {hasMIDIMapping && (
          <div className="absolute inset-0 rounded-lg bg-cyan-500/20 animate-pulse pointer-events-none" />
        )}
      </button>

      {/* MIDI mapping indicator */}
      {midiAction && (
        <div
          className={`absolute -top-2 -right-2 flex items-center gap-1 px-1 py-0.5 rounded text-[10px] font-mono z-10 ${
            hasMIDIMapping
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
              : learnMode
              ? 'bg-cyan-500 text-black animate-pulse'
              : 'bg-gray-700/50 text-gray-400 border border-gray-600/50'
          }`}
          title={hasMIDIMapping ? 'MIDI mapped' : learnMode ? 'Click to learn MIDI mapping' : 'No MIDI mapping'}
        >
          <Radio className="w-2 h-2" />
          <span>{hasMIDIMapping ? 'MIDI' : learnMode ? 'LEARN' : ''}</span>
        </div>
      )}
    </div>
  );
}
