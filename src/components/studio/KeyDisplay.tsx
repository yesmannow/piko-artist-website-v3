"use client";

import { useMemo } from 'react';
import { areKeysCompatible, compatibleKeys } from '@/utils/camelot';
import type { KeyAnalysisResult } from '@/engine/rt/analysis/KeyService';

interface KeyDisplayProps {
  keyData: KeyAnalysisResult | null;
  referenceKey?: string | null; // Key to compare against (for compatibility highlighting)
  className?: string;
  showCompatibility?: boolean;
}

/**
 * KeyDisplay - Displays Camelot key with optional compatibility highlighting
 *
 * Phase 9C: Shows key in Camelot notation and highlights if compatible with reference
 */
export function KeyDisplay({
  keyData,
  referenceKey,
  className = '',
  showCompatibility = false,
}: KeyDisplayProps) {
  const isCompatible = useMemo(() => {
    if (!showCompatibility || !keyData?.camelot || !referenceKey) {
      return false;
    }
    return areKeysCompatible(keyData.camelot, referenceKey);
  }, [keyData?.camelot, referenceKey, showCompatibility]);

  if (!keyData || !keyData.available) {
    return (
      <span className={`text-xs text-zinc-500 italic ${className}`}>
        Key N/A
      </span>
    );
  }

  return (
    <span
      className={`
        inline-flex items-center gap-1
        px-2 py-0.5 rounded
        text-xs font-mono font-bold
        transition-colors
        ${
          isCompatible
            ? 'bg-green-500/20 text-green-400 border border-green-500/50'
            : 'bg-zinc-800/50 text-zinc-400 border border-zinc-700/50'
        }
        ${className}
      `}
      title={
        isCompatible
          ? `Compatible with ${referenceKey}`
          : keyData.camelot
            ? `${keyData.camelot} - ${keyData.root} ${keyData.scale}`
            : 'Key information'
      }
    >
      {keyData.camelot || '--'}
    </span>
  );
}

/**
 * Get compatible keys for a given Camelot key
 */
export function getCompatibleKeys(camelot: string | null): string[] {
  if (!camelot) {
    return [];
  }
  return compatibleKeys(camelot);
}
