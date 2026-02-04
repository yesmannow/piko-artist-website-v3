/**
 * Phase S8: Match Badge Component
 *
 * Displays match score badge for track compatibility
 */

import React from 'react';
import type { MatchBadge as MatchBadgeType } from '@/features/insights/matchScoring';

interface MatchBadgeProps {
  badge: MatchBadgeType;
  tooltip: string;
  className?: string;
}

export function MatchBadge({ badge, tooltip, className = '' }: MatchBadgeProps) {
  if (!badge) return null;

  const badgeStyles: Record<Exclude<MatchBadgeType, null>, string> = {
    PERFECT: 'bg-green-500/20 text-green-300 border-green-500/30',
    GOOD: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    OK: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${badgeStyles[badge]} ${className}`}
      title={tooltip}
      aria-label={`Match quality: ${badge} - ${tooltip}`}
    >
      {badge}
    </span>
  );
}
