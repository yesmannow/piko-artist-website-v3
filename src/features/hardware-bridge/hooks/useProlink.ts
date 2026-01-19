"use client";

import { useEffect, useState, useRef } from 'react';
import { WebSocketClient } from '../lib/websocketClient';
import type { CDJStatus, BridgeConnectionState } from '../types';

/**
 * useProlink - Hook for connecting to Prolink bridge
 *
 * Manages WebSocket connection to the Node.js bridge server and provides
 * real-time CDJ status updates.
 *
 * @param enabled - Whether to connect (default: true)
 * @returns Connection state and latest CDJ status
 */
export function useProlink(enabled: boolean = true) {
  const [connectionState, setConnectionState] = useState<BridgeConnectionState>('disconnected');
  const [latestStatus, setLatestStatus] = useState<CDJStatus | null>(null);
  const clientRef = useRef<WebSocketClient | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Initialize client
    if (!clientRef.current) {
      clientRef.current = new WebSocketClient();

      // Set up callbacks
      clientRef.current.onStatus((status) => {
        setLatestStatus(status);
      });

      clientRef.current.onStateChange((state) => {
        setConnectionState(state);
      });
    }

    // Connect
    clientRef.current.connect();

    // Cleanup
    return () => {
      if (clientRef.current) {
        clientRef.current.disconnect();
      }
    };
  }, [enabled]);

  return {
    connectionState,
    latestStatus,
    isConnected: connectionState === 'connected',
  };
}
