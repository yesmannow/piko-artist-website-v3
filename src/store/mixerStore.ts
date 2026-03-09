import { create } from 'zustand';

interface MixerState {
  crossfader: number; // -1 (Deck A) to 1 (Deck B), 0 is center
  eqA: { high: number; mid: number; low: number }; // -1 to 1
  eqB: { high: number; mid: number; low: number }; // -1 to 1
  quantizeActive: boolean;
  crossfaderReverse: boolean;
  setCrossfader: (value: number) => void;
  setEQ: (deckId: 'A' | 'B', band: 'high' | 'mid' | 'low', value: number) => void;
  toggleQuantize: () => void;
  toggleCrossfaderReverse: () => void;
}

export const useMixerStore = create<MixerState>((set) => ({
  crossfader: 0,
  eqA: { high: 0, mid: 0, low: 0 },
  eqB: { high: 0, mid: 0, low: 0 },
  quantizeActive: true,
  crossfaderReverse: false,
  setCrossfader: (value) => set({ crossfader: value }),
  setEQ: (deckId, band, value) => set((state) => ({
    [deckId === 'A' ? 'eqA' : 'eqB']: {
      ...state[deckId === 'A' ? 'eqA' : 'eqB'],
      [band]: value
    }
  })),
  toggleQuantize: () => set((state) => ({ quantizeActive: !state.quantizeActive })),
  toggleCrossfaderReverse: () => set((state) => ({ crossfaderReverse: !state.crossfaderReverse }))
}));
