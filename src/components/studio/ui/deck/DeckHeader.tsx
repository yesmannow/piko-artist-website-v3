/**
 * DeckHeader Component
 *
 * Displays deck status, BPM, key, energy, and control buttons
 */

import { Wand2, Loader2, Scissors } from 'lucide-react';
import { motion } from 'framer-motion';
import type { DeckState } from '@/store/useStore';

interface DeckHeaderProps {
  readonly deckId: 'A' | 'B';
  readonly deckLabel: string;
  readonly isPlaying: boolean;
  readonly trackData: DeckState['trackData'];
  readonly currentBpm: number | null;
  readonly isSynced: boolean;
  readonly isKeyLockActive: boolean;
  readonly energy: number;
  readonly complexityMode: 'simple' | 'pro';
  readonly recommendationsLoading: boolean;
  readonly canGenerateStems: boolean;
  readonly isGeneratingStems: boolean;
  readonly stemButtonTitle: string;
  readonly stemModeEnabled: boolean;
  readonly onMagicWand: () => void;
  readonly onSplitStems: () => void;
  readonly onToggleKeyLock: () => void;
}

export function DeckHeader({
  deckId,
  deckLabel,
  isPlaying,
  trackData,
  currentBpm,
  isSynced,
  isKeyLockActive,
  energy,
  complexityMode,
  recommendationsLoading,
  canGenerateStems,
  isGeneratingStems,
  stemButtonTitle,
  stemModeEnabled,
  onMagicWand,
  onSplitStems,
  onToggleKeyLock,
}: DeckHeaderProps) {
  const deckColor = deckId === 'A' ? 'bg-studio-cyan' : 'bg-studio-purple';
  const energyLevel = Math.min(1, Math.max(0, energy / 1.2));

  const keyLockClass = (() => {
    if (isKeyLockActive) {
      if (deckId === 'A') return 'bg-studio-cyan/20 border-studio-cyan text-studio-cyan shadow-[0_0_10px_rgba(34,211,238,0.5)]';
      return 'bg-studio-purple/20 border-studio-purple text-studio-purple shadow-[0_0_10px_rgba(168,85,247,0.5)]';
    }
    return 'bg-white/5 border-white/10 text-white/60 hover:border-white/30 hover:text-white';
  })();

  const energyFilledClass = (filled: boolean) => {
    if (!filled) return 'bg-white/10';
    return deckId === 'A'
      ? 'bg-studio-cyan shadow-[0_0_8px_rgba(34,211,238,0.6)]'
      : 'bg-studio-purple shadow-[0_0_8px_rgba(168,85,247,0.6)]';
  };

  const renderEnergyBars = () => {
    return [0, 1, 2, 3, 4].map((i) => {
      const filled = energyLevel * 5 > i;
      return (
        <span
          key={i}
          className={`w-1.5 h-3 rounded-sm transition-all duration-300 ${energyFilledClass(filled)}`}
        />
      );
    });
  };

  const renderHeaderButtons = () => {
    if (complexityMode !== 'pro') return null;

    return (
      <div className="flex items-center gap-2">
        <motion.button
          onClick={onMagicWand}
          disabled={recommendationsLoading}
          className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors disabled:opacity-50"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="Get similar track recommendations"
        >
          {recommendationsLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-studio-cyan" />
          ) : (
            <Wand2 className="w-4 h-4 text-studio-cyan" />
          )}
        </motion.button>
        {!stemModeEnabled && (
          <motion.button
            onClick={onSplitStems}
            disabled={!canGenerateStems}
            className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors disabled:opacity-50"
            whileHover={canGenerateStems ? { scale: 1.05 } : {}}
            whileTap={canGenerateStems ? { scale: 0.95 } : {}}
            title={stemButtonTitle}
            data-testid="generate-stems"
          >
            {isGeneratingStems ? (
              <Loader2 className="w-4 h-4 animate-spin text-studio-purple" />
            ) : (
              <Scissors className={`w-4 h-4 ${canGenerateStems ? 'text-studio-purple' : 'text-white/30'}`} />
            )}
          </motion.button>
        )}
      </div>
    );
  };

  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full ${deckColor}`} />
        <h2 className="text-lg font-black uppercase font-mono">{deckLabel}</h2>
        <span className={`text-xs px-2 py-1 rounded ${isPlaying ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/60'}`}>
          {isPlaying ? 'PLAYING' : 'IDLE'}
        </span>
      </div>
      {trackData && (
        <div
          className={`text-xs font-mono flex items-center gap-4 ${
            isSynced ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.65)]' : 'text-white/60'
          }`}
        >
          {/* Phase IX.5: Prominent Camelot Key Display */}
          {trackData.key && (
            <div className="px-3 py-1.5 rounded-lg bg-lime-400/10 border border-lime-400/30">
              <span className="text-[10px] uppercase text-lime-400/70 tracking-wider mr-2">Key</span>
              <span className="text-sm font-bold text-lime-400">{trackData.key}</span>
            </div>
          )}

          {/* BPM Display */}
          <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
            <span className="text-[10px] uppercase text-white/60 tracking-wider mr-2">BPM</span>
            <span className="text-sm font-bold text-white">{currentBpm?.toFixed(1)}</span>
            {isSynced && <span className="ml-1 text-[10px] text-lime-400">(SYNC)</span>}
          </div>

          <button
            onClick={onToggleKeyLock}
            className={`px-2 py-1 rounded-md text-[10px] uppercase tracking-[0.2em] border transition-all ${keyLockClass}`}
            title="Master Tempo / Key Lock"
          >
            MT
          </button>
          <div className="flex items-center gap-1">
            {renderEnergyBars()}
          </div>
          {renderHeaderButtons()}
        </div>
      )}
    </div>
  );
}
