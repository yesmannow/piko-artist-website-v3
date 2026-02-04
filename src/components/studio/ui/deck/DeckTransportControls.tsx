/**
 * DeckTransportControls Component
 *
 * Transport control buttons for deck (play/pause/stop/sync/seek)
 */

import { Play, Pause, Square, SkipBack, SkipForward } from 'lucide-react';
import { motion } from 'framer-motion';

interface DeckTransportControlsProps {
  readonly isPlaying: boolean;
  readonly isSynced: boolean;
  readonly isLoaded: boolean;
  readonly hasBpm: boolean;
  readonly complexityMode: 'simple' | 'pro';
  readonly onPlay: () => void;
  readonly onPause: () => void;
  readonly onStop: () => void;
  readonly onSync: () => void;
  readonly onSeekBack: () => void;
  readonly onSeekForward: () => void;
  readonly onTapeStop: () => void;
}

export function DeckTransportControls({
  isPlaying,
  isSynced,
  isLoaded,
  hasBpm,
  complexityMode,
  onPlay,
  onPause,
  onStop,
  onSync,
  onSeekBack,
  onSeekForward,
  onTapeStop,
}: DeckTransportControlsProps) {
  return (
    <div className="flex items-center justify-center gap-3 mt-auto flex-wrap">
      <motion.button
        onClick={onSeekBack}
        className="p-3 rounded-xl bg-linear-to-b from-[#1f1f1f] to-obsidian-900 border border-white/10 hover:border-studio-cyan/40 transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <SkipBack className="w-4 h-4" />
      </motion.button>

      {isPlaying ? (
        <motion.button
          onClick={onPause}
          className="p-5 rounded-2xl bg-linear-to-b from-studio-purple to-[#3b0f6e] text-white font-black uppercase shadow-[0_0_20px_rgba(168,85,247,0.4)]"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Pause className="w-6 h-6" />
        </motion.button>
      ) : (
        <motion.button
          onClick={onPlay}
          className="p-5 rounded-2xl bg-linear-to-b from-studio-cyan to-[#0b5d66] text-white font-black uppercase shadow-[0_0_20px_rgba(34,211,238,0.4)]"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Play className="w-6 h-6" />
        </motion.button>
      )}

      <motion.button
        onClick={onSync}
        disabled={!hasBpm}
        className={`px-4 py-3 rounded-xl border text-xs font-mono uppercase tracking-widest transition-colors ${
          isSynced
            ? 'border-white/80 text-white shadow-[0_0_12px_rgba(255,255,255,0.5)]'
            : 'border-white/10 text-white/60 hover:border-white/40 hover:text-white'
        } disabled:opacity-40 disabled:cursor-not-allowed`}
        whileHover={hasBpm ? { scale: 1.05 } : {}}
        whileTap={hasBpm ? { scale: 0.95 } : {}}
      >
        SYNC
      </motion.button>

      <motion.button
        onClick={onStop}
        className="p-3 rounded-xl bg-linear-to-b from-[#1f1f1f] to-obsidian-900 border border-white/10 hover:border-studio-purple/40 transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Square className="w-4 h-4" />
      </motion.button>

      {complexityMode === 'pro' && (
        <motion.button
          onClick={onTapeStop}
          disabled={!isLoaded}
          className="px-4 py-3 rounded-xl border border-white/12 bg-[#0c0c0f] text-xs font-mono uppercase tracking-[0.22em] text-white/80 hover:border-studio-purple/50 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          whileHover={isLoaded ? { scale: 1.05 } : {}}
          whileTap={isLoaded ? { scale: 0.95 } : {}}
        >
          Tape Stop
        </motion.button>
      )}

      <motion.button
        onClick={onSeekForward}
        className="p-3 rounded-xl bg-linear-to-b from-[#1f1f1f] to-obsidian-900 border border-white/10 hover:border-studio-cyan/40 transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <SkipForward className="w-4 h-4" />
      </motion.button>
    </div>
  );
}
