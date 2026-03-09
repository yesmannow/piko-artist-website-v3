import { create } from 'zustand';
import { db, Track } from '@/lib/db';
import { AudioEngine } from '@/lib/audioEngine';
import { analyzeAudioBuffer } from '@/hooks/analysis/useEssentiaAnalysis';
import { PLACEHOLDER_BPM, PLACEHOLDER_KEY } from '@/lib/constants/analysisPlaceholders';

export interface DeckState {
  track: Track | null;
  isPlaying: boolean;
  currentTime: number;
  ghostTime: number;   // Slip-mode ghost playhead position
  rotation: number;    // Jog wheel rotation in degrees
  duration: number;
  buffer: AudioBuffer | null;
  isLoading: boolean;
  volume: number;
  slipMode: boolean;
  cuePoint: number;
  playbackRate: number; // For pitch faders
  // Phase 8: Quantum Remix — per-deck stem mute toggles
  stems: { vocals: boolean; drums: boolean; inst: boolean; };
  // Phase 8: Asymmetric DSP toggles
  sibilanceTamerActive: boolean; // Deck A: de-esser / sibilance control
  subGeneratorActive: boolean;   // Deck B: low-harmonic sub exciter
}

export interface TelemetryUpdate {
  currentTime?: number;
  ghostTime?: number;
  rotation?: number;
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
  updateTelemetry: (deckId: 'A' | 'B', telemetry: TelemetryUpdate) => void;
  updateTrackAutomation: (deckId: 'A' | 'B', automation: typeof initialDeckState.track extends { automation?: infer U } ? U : never) => void;
  // Phase 8: Quantum Remix actions
  toggleStem: (deckId: 'A' | 'B', stem: 'vocals' | 'drums' | 'inst') => void;
  toggleSibilance: (deckId: 'A' | 'B') => void;
  toggleSub: (deckId: 'A' | 'B') => void;
}

/**
 * Run analysis in the background after a track is loaded into a deck.
 * Persists results to Dexie and refreshes the library store so the UI
 * reflects the analysed bpm/key without blocking audio playback.
 */
async function runDeferredAnalysis(track: Track, buffer: AudioBuffer): Promise<void> {
  try {
    const result = await analyzeAudioBuffer(buffer);

    // Persist to IndexedDB
    if (track.id !== undefined) {
      await db.tracks.update(track.id, {
        bpm: result.bpm,
        key: result.key,
        energy: result.energy,
        status: 'ready',
      });
    } else if (track.audioUrl) {
      await db.tracks.where('audioUrl').equals(track.audioUrl).modify({
        bpm: result.bpm,
        key: result.key,
        energy: result.energy,
        status: 'ready',
      });
    }

    // Refresh library store so UI reflects the updated values
    const { useLibraryStore } = await import('@/store/libraryStore');
    await useLibraryStore.getState().loadTracks();
  } catch (err) {
    console.warn('[deckStore] Deferred analysis failed:', err);
  }
}

/** Returns true when placeholder values indicate the track hasn't been fully analysed yet. */
function needsAnalysis(track: Track): boolean {
  return (
    !track.bpm ||
    track.bpm === PLACEHOLDER_BPM ||
    track.bpm === '0' ||
    !track.key ||
    track.key === PLACEHOLDER_KEY ||
    track.key === '??' ||
    track.status !== 'ready'
  );
}


const initialDeckState: DeckState = {
  track: null,
  isPlaying: false,
  currentTime: 0,
  ghostTime: 0,
  rotation: 0,
  duration: 0,
  buffer: null,
  isLoading: false,
  volume: 1,
  slipMode: false,
  cuePoint: 0,
  playbackRate: 1.0,
  // Phase 8: Quantum Remix — all stems active by default
  stems: { vocals: true, drums: true, inst: true },
  sibilanceTamerActive: false,
  subGeneratorActive: false,
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

      // Trigger background analysis if the track has placeholder or missing metadata
      if (needsAnalysis(track)) {
        runDeferredAnalysis(track, buffer);
      }
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

  updateTelemetry: (deckId: 'A' | 'B', telemetry: TelemetryUpdate) => {
    const deckKey = deckId === 'A' ? 'deckA' : 'deckB';
    set((state) => ({
      [deckKey]: { ...state[deckKey], ...telemetry }
    }));
  },

  updateTrackAutomation: (deckId: 'A' | 'B', automation: typeof initialDeckState.track extends { automation?: infer U } ? U : never) => {
    const deckKey = deckId === 'A' ? 'deckA' : 'deckB';
    set((state) => {
      const currentTrack = state[deckKey].track;
      if (!currentTrack) return state;

      // Persist serialised Bézier points to IndexedDB so automation survives page reload
      if (currentTrack.id != null) {
        db.tracks.update(currentTrack.id, { automation }).catch((err: unknown) => {
          console.warn('[deckStore] Failed to persist automation to IndexedDB:', err);
        });
      }

      return {
        ...state,
        [deckKey]: {
          ...state[deckKey],
          track: { ...currentTrack, automation }
        }
      };
    });
  },

  // Phase 8: Quantum Remix actions

  toggleStem: (deckId: 'A' | 'B', stem: 'vocals' | 'drums' | 'inst') => {
    const deckKey = deckId === 'A' ? 'deckA' : 'deckB';
    set((state) => ({
      [deckKey]: {
        ...state[deckKey],
        stems: {
          ...state[deckKey].stems,
          [stem]: !state[deckKey].stems[stem],
        },
      },
    }));
  },

  toggleSibilance: (deckId: 'A' | 'B') => {
    const deckKey = deckId === 'A' ? 'deckA' : 'deckB';
    set((state) => ({
      [deckKey]: {
        ...state[deckKey],
        sibilanceTamerActive: !state[deckKey].sibilanceTamerActive,
      },
    }));
  },

  toggleSub: (deckId: 'A' | 'B') => {
    const deckKey = deckId === 'A' ? 'deckA' : 'deckB';
    set((state) => ({
      [deckKey]: {
        ...state[deckKey],
        subGeneratorActive: !state[deckKey].subGeneratorActive,
      },
    }));
  },
}));
