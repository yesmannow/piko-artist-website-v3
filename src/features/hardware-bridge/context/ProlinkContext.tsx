"use client";

import { createContext, useContext, ReactNode } from 'react';
import { useProlink } from '../hooks/useProlink';
import type { CDJStatus, BridgeConnectionState } from '../types';

interface ProlinkContextValue {
  connectionState: BridgeConnectionState;
  latestStatus: CDJStatus | null;
  isConnected: boolean;
}

const ProlinkContext = createContext<ProlinkContextValue | null>(null);

export function ProlinkProvider({ children }: { children: ReactNode }) {
  const prolink = useProlink(true);

  return (
    <ProlinkContext.Provider value={prolink}>
      {children}
    </ProlinkContext.Provider>
  );
}

export function useProlinkContext() {
  const context = useContext(ProlinkContext);
  if (!context) {
    throw new Error('useProlinkContext must be used within ProlinkProvider');
  }
  return context;
}
