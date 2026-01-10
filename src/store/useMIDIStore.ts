import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * PHASE 7: MIDI Mapping Store
 * 
 * Stores MIDI control mappings and learn mode state.
 * Allows users to map physical MIDI controls to app actions.
 */

export type MIDIAction = 
  | 'deckA_play'
  | 'deckA_pause'
  | 'deckA_cue'
  | 'deckA_volume'
  | 'deckB_play'
  | 'deckB_pause'
  | 'deckB_cue'
  | 'deckB_volume'
  | 'crossfader'
  | 'masterVolume';

interface MIDIMapping {
  action: MIDIAction;
  label: string;
}

interface MIDIStore {
  // MIDI connection state
  isConnected: boolean;
  deviceName: string | null;
  lastActivity: number; // Timestamp of last MIDI message
  
  // MIDI mappings: "statusByte:dataByte" -> action
  // e.g., "144:50" (Note On, note 50) -> "deckA_play"
  mappings: Record<string, MIDIMapping>;
  
  // Learn mode: when true, next MIDI input will be mapped to target action
  learnMode: boolean;
  learnTarget: MIDIAction | null;
  
  // Actions
  setConnected: (connected: boolean, deviceName?: string) => void;
  setActivity: () => void;
  setMapping: (midiKey: string, action: MIDIAction, label: string) => void;
  removeMapping: (midiKey: string) => void;
  startLearn: (action: MIDIAction) => void;
  stopLearn: () => void;
  clearMappings: () => void;
}

// localStorage key for MIDI mappings
const MIDI_STORAGE_KEY = 'piko-dj-midi-mappings';

export const useMIDIStore = create<MIDIStore>()(
  persist(
    (set, get) => ({
      // Initial state
      isConnected: false,
      deviceName: null,
      lastActivity: 0,
      mappings: {},
      learnMode: false,
      learnTarget: null,
      
      // Actions
      setConnected: (connected, deviceName) => 
        set({ isConnected: connected, deviceName: deviceName || null }),
      
      setActivity: () => 
        set({ lastActivity: Date.now() }),
      
      setMapping: (midiKey, action, label) => 
        set((state) => ({
          mappings: {
            ...state.mappings,
            [midiKey]: { action, label }
          }
        })),
      
      removeMapping: (midiKey) => 
        set((state) => {
          const newMappings = { ...state.mappings };
          delete newMappings[midiKey];
          return { mappings: newMappings };
        }),
      
      startLearn: (action) => 
        set({ learnMode: true, learnTarget: action }),
      
      stopLearn: () => 
        set({ learnMode: false, learnTarget: null }),
      
      clearMappings: () => 
        set({ mappings: {} }),
    }),
    {
      name: MIDI_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      // Only persist mappings, not connection state or learn mode
      partialize: (state) => ({
        mappings: state.mappings,
      }),
      // On rehydrate, ensure learn mode is reset
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Reset learn mode on app restart
          state.learnMode = false;
          state.learnTarget = null;
          state.isConnected = false;
          state.deviceName = null;
          state.lastActivity = 0;
        }
      },
    }
  )
);
