"use client";

import React from 'react';
import clsx from 'clsx';

export type BadgeType = 'playing' | 'cueing' | 'stem-ready' | 'sync' | 'idle';

const badgeMap: Record<BadgeType, { label: string; color: string }> = {
  playing: { label: 'Playing', color: '#22c55e' },
  cueing: { label: 'Cueing', color: '#f59e0b' },
  'stem-ready': { label: 'Stem Ready', color: '#4f46e5' },
  sync: { label: 'Sync', color: '#06b6d4' },
  idle: { label: 'Idle', color: '#94a3b8' },
};

export interface StateBadgeProps {
  type?: BadgeType;
  className?: string;
}

export function StateBadge({ type = 'idle', className }: StateBadgeProps) {
  const info = badgeMap[type];
  return (
    <span
      className={clsx('state-badge', className)}
      style={{
        background: info.color,
        color: '#fff',
        padding: '4px 8px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: '0.04em',
      }}
      aria-hidden={false}
      role="status"
    >
      {info.label}
    </span>
  );
}
