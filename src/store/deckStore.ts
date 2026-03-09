import { create } from 'zustand';
import { Track } from '@/lib/db';
import { AudioEngine } from '@/lib/audioEngine';

export interface DeckState {
  track: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  buffer: AudioBuffer | null;
  isLoading: boolean;
  volume: number;
  slipMode: boolean;
  cuePoint: number;
  playbackRate: number; // For pitch faders
}

interface DeckStore {
  deckA: DeckState;
  deckB: DeckState;
  loadTrack: (deckId: 'A' | 'B', track: Track) => Promise<void>;
  togglePlay: (deckId: 'A' | 'B') => void;
  setVolume: (deckId: 'A' | 'B', volume: number) => void;
  setCurrentTime: (deckId: 'A' | 'B', time: number) => void;
  toggleSlipMode: (deckId: 'A' | 'B') => void;
  setCuePoint: (deckId: 'A' | 'B', time: number) => void;
  setPlaybackRate: (deckId: 'A' | 'B', rate: number) => void;
  updateTrackAutomation: (deckId: 'A' | 'B', automation: typeof initialDeckState.track extends { automation?: infer U } ? U : never) => void;
}

const initialDeckState: DeckState = {
  track: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  buffer: null,
  isLoading: false,
  volume: 1,
  slipMode: false,
  cuePoint: 0,
  playbackRate: 1.0,
};

export const useDeckStore = create<DeckStore>((set) => ({
  deckA: { ...initialDeckState },
  deckB: { ...initialDeckState },

  loadTrack: async (deckId: 'A' | 'B', track: Track) => {
    const deckKey = deckId === 'A' ? 'deckA' : 'deckB';
    
    set((state) => ({
      [deckKey]: { ...state[deckKey], isLoading: true, track }
    }));

    try {
      const engine = AudioEngine.getInstance();
      await engine.resume();
      
      let buffer: AudioBuffer;
      if (track.fileBlob) {
        buffer = await engine.loadBuffer(track.fileBlob);
      } else if (track.audioUrl) {
        // Load seeded tracks via URL
        buffer = await engine.loadBuffer(track.audioUrl);
      } else {
        throw new Error("No fileBlob or audioUrl provided for track");
      }

      set((state) => ({
        [deckKey]: { 
          ...state[deckKey], 
          isLoading: false, 
          buffer,
          duration: buffer.duration,
          currentTime: 0,
          isPlaying: false
        }
      }));
    } catch (error) {
      console.error(`Failed to load track to Deck ${deckId}:`, error);
      set((state) => ({
        [deckKey]: { ...state[deckKey], isLoading: false, track: null, buffer: null }
      }));
    }
  },

  togglePlay: (deckId: 'A' | 'B') => {
    const deckKey = deckId === 'A' ? 'deckA' : 'deckB';
    set((state) => ({
      [deckKey]: { ...state[deckKey], isPlaying: !state[deckKey].isPlaying }
    }));
  },

  setVolume: (deckId: 'A' | 'B', volume: number) => {
    const deckKey = deckId === 'A' ? 'deckA' : 'deckB';
    set((state) => ({
      [deckKey]: { ...state[deckKey], volume }
    }));
  },

  setCurrentTime: (deckId: 'A' | 'B', time: number) => {
    const deckKey = deckId === 'A' ? 'deckA' : 'deckB';
    set((state) => ({
      [deckKey]: { ...state[deckKey], currentTime: time }
    }));
  },

  toggleSlipMode: (deckId: 'A' | 'B') => {
    const deckKey = deckId === 'A' ? 'deckA' : 'deckB';
    set((state) => ({
      [deckKey]: { ...state[deckKey], slipMode: !state[deckKey].slipMode }
    }));
  },

  setCuePoint: (deckId: 'A' | 'B', time: number) => {
    const deckKey = deckId === 'A' ? 'deckA' : 'deckB';
    set((state) => ({
      [deckKey]: { ...state[deckKey], cuePoint: time }
    }));
  },

  setPlaybackRate: (deckId: 'A' | 'B', rate: number) => {
    const deckKey = deckId === 'A' ? 'deckA' : 'deckB';
    set((state) => ({
      [deckKey]: { ...state[deckKey], playbackRate: Math.max(0.5, Math.min(2.0, rate)) }
    }));
  },

  updateTrackAutomation: (deckId: 'A' | 'B', automation: typeof initialDeckState.track extends { automation?: infer U } ? U : never) => {
    const deckKey = deckId === 'A' ? 'deckA' : 'deckB';
    set((state) => {
      const currentTrack = state[deckKey].track;
      if (!currentTrack) return state;
      return {
        ...state,
        [deckKey]: {
          ...state[deckKey],
          track: { ...currentTrack, automation }
        }
      };
    });
  }
}));
