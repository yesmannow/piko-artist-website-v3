import { useEffect, useRef, useState, useCallback } from 'react';
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';

/**
 * Collaboration Hook with Yjs & WebRTC
 * 
 * Phase 4: Advanced Features - Collaboration (Optional)
 * 
 * Enables real-time collaborative DJ sessions using:
 * - Yjs CRDT (Conflict-free Replicated Data Type)
 * - WebRTC for peer-to-peer synchronization
 * - Shared state: crossfader, deck positions, effects
 * 
 * Use Case: Two DJs can perform back-to-back sessions
 * - User A moves crossfader → User B's UI updates instantly
 * - No conflicts, no server needed (P2P)
 * - Works across browser windows/devices
 */

export interface Peer {
  id: string;
  name: string;
  cursor?: unknown;
}

export interface CollaborationState {
  // Mixer state (shared)
  crossfader: number;
  masterVolume: number;
  
  // Deck A state
  deckA: {
    isPlaying: boolean;
    position: number;
    volume: number;
    tempo: number;
  };
  
  // Deck B state
  deckB: {
    isPlaying: boolean;
    position: number;
    volume: number;
    tempo: number;
  };
  
  // Effects state
  effects: {
    [key: string]: boolean | number;
  };
  
  // Connected peers
  peers: string[];
}

interface UseCollaborationOptions {
  roomName: string;
  userName?: string;
  enabled?: boolean;
  debug?: boolean;
}

/**
 * useCollaboration Hook
 * 
 * Provides real-time collaborative state management
 */
export function useCollaboration({
  roomName,
  userName = 'Anonymous',
  enabled = false,
  debug = false,
}: UseCollaborationOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [peers, setPeers] = useState<string[]>([]);
  const [syncedState, setSyncedState] = useState<Partial<CollaborationState>>({});
  
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebrtcProvider | null>(null);
  const stateMapRef = useRef<Y.Map<any> | null>(null);
  
  /**
   * Initialize Yjs document and WebRTC provider
   */
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      return;
    }
    
    if (debug) {
      console.log('[Collaboration] Initializing...', { roomName, userName });
    }
    
    // Create Yjs document
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;
    
    // Get shared map for state
    const stateMap = ydoc.getMap('state');
    stateMapRef.current = stateMap;
    
    // Initialize default state if empty
    if (stateMap.size === 0) {
      stateMap.set('crossfader', 0.5);
      stateMap.set('masterVolume', 0.8);
      stateMap.set('deckA', {
        isPlaying: false,
        position: 0,
        volume: 0.8,
        tempo: 1.0,
      });
      stateMap.set('deckB', {
        isPlaying: false,
        position: 0,
        volume: 0.8,
        tempo: 1.0,
      });
      stateMap.set('effects', {});
    }
    
    // Create WebRTC provider for P2P sync
    // @ts-expect-error SharedArrayBuffer Uint8Array compatibility issue
    const provider = new WebrtcProvider(roomName, ydoc, {
      signaling: [
        'wss://signaling.yjs.dev', // Public signaling server
      ],
      password: null as any, // Optional: add password for private rooms
      maxConns: 10, // Max number of peer connections
    });
    
    // Set user awareness data
    // @ts-expect-error SharedArrayBuffer compatibility
    provider.awareness.setLocalStateField('name', userName);
    
    providerRef.current = provider;
    
    // Listen for connection status
    provider.on('synced', ({ synced }: { synced: boolean }) => {
      setIsConnected(synced);
      
      if (debug) {
        console.log('[Collaboration] Synced:', synced);
      }
    });
    
    // Listen for peer changes
    provider.on('peers', (peerUpdate: { added: string[]; removed: string[] }) => {
      const connectedPeers = Array.from(provider.awareness.getStates().keys())
        .map((id) => String(id))
        .filter((id) => id !== String(ydoc.clientID));
      
      setPeers(connectedPeers);
      
      if (debug) {
        console.log('[Collaboration] Peers updated:', {
          added: peerUpdate.added,
          removed: peerUpdate.removed,
          total: connectedPeers.length,
        });
      }
    });
    
    // Listen for state changes
    const observer = () => {
      const state: Partial<CollaborationState> = {};
      
      stateMap.forEach((value: unknown, key: string) => {
        (state as any)[key as keyof CollaborationState] = value;
      });
      
      setSyncedState(state);
      
      if (debug) {
        console.log('[Collaboration] State updated:', state);
      }
    };
    
    stateMap.observe(observer);
    
    // Initial state load
    observer();
    
    if (debug) {
      console.log('[Collaboration] ✅ Initialized', {
        roomName,
        userName,
        clientID: ydoc.clientID,
      });
    }
    
    // Cleanup
    return () => {
      if (debug) {
        console.log('[Collaboration] Disconnecting...');
      }
      
      stateMap.unobserve(observer);
      provider.destroy();
      ydoc.destroy();
      
      ydocRef.current = null;
      providerRef.current = null;
      stateMapRef.current = null;
      
      setIsConnected(false);
      setPeers([]);
    };
  }, [enabled, roomName, userName, debug]);
  
  /**
   * Update shared state
   */
  const updateState = useCallback(<K extends keyof CollaborationState>(
    key: K,
    value: CollaborationState[K]
  ) => {
    if (!stateMapRef.current) {
      console.warn('[Collaboration] Cannot update state: not initialized');
      return;
    }
    
    ydocRef.current?.transact(() => {
      stateMapRef.current?.set(key, value);
    });
    
    if (debug) {
      console.log('[Collaboration] State updated:', key, value);
    }
  }, [debug]);
  
  /**
   * Batch update multiple state values
   */
  const batchUpdate = useCallback((updates: Partial<CollaborationState>) => {
    if (!stateMapRef.current || !ydocRef.current) {
      console.warn('[Collaboration] Cannot batch update: not initialized');
      return;
    }
    
    ydocRef.current.transact(() => {
      Object.entries(updates).forEach(([key, value]) => {
        stateMapRef.current?.set(key, value);
      });
    });
    
    if (debug) {
      console.log('[Collaboration] Batch update:', updates);
    }
  }, [debug]);
  
  /**
   * Get peer info
   */
  const getPeerInfo = useCallback((): Peer[] => {
    if (!providerRef.current) return [];
    
    const awareness = providerRef.current.awareness;
    const states = Array.from(awareness.getStates().entries()) as [number, { name?: string; cursor?: unknown }][];
    
    return states
      .filter(([id]) => id !== ydocRef.current?.clientID)
      .map(([id, state]) => ({
        id: String(id),
        name: state.name || 'Unknown',
        cursor: state.cursor,
      }));
  }, []);
  
  return {
    // Connection state
    isConnected,
    isEnabled: enabled,
    peers,
    peerCount: peers.length,
    
    // Synced state
    state: syncedState,
    
    // State mutation
    updateState,
    batchUpdate,
    
    // Peer info
    getPeerInfo,
  };
}

/**
 * Hook for syncing a specific value with collaboration
 * 
 * Example: const [crossfader, setCrossfader] = useCollaborativeValue('crossfader', 0.5);
 */
export function useCollaborativeValue<K extends keyof CollaborationState>(
  key: K,
  defaultValue: CollaborationState[K],
  collaboration: ReturnType<typeof useCollaboration>
): [CollaborationState[K], (value: CollaborationState[K]) => void] {
  const value = (collaboration.state[key] ?? defaultValue) as CollaborationState[K];
  
  const setValue = useCallback((newValue: CollaborationState[K]) => {
    collaboration.updateState(key, newValue);
  }, [collaboration, key]);
  
  return [value, setValue];
}
