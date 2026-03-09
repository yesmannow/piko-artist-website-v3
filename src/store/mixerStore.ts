import { create } from 'zustand';

export interface FxModuleDef {
  id: string;
  type: 'saturator' | 'filter' | 'reverb';
  enabled: boolean;
  params: Record<string, number>;
}

interface MixerState {
  crossfader: number; // -1 (Deck A) to 1 (Deck B), 0 is center
  eqA: { high: number; mid: number; low: number }; // -1 to 1
  eqB: { high: number; mid: number; low: number }; // -1 to 1
  fxA: FxModuleDef[];
  fxB: FxModuleDef[];
  quantizeActive: boolean;
  crossfaderReverse: boolean;
  setCrossfader: (value: number) => void;
  setEQ: (deckId: 'A' | 'B', band: 'high' | 'mid' | 'low', value: number) => void;
  addFx: (deckId: 'A' | 'B', type: FxModuleDef['type']) => void;
  removeFx: (deckId: 'A' | 'B', id: string) => void;
  toggleFx: (deckId: 'A' | 'B', id: string) => void;
  setFxParam: (deckId: 'A' | 'B', id: string, param: string, value: number) => void;
  reorderFx: (deckId: 'A' | 'B', startIndex: number, endIndex: number) => void;
  toggleQuantize: () => void;
  toggleCrossfaderReverse: () => void;
}

export const useMixerStore = create<MixerState>((set) => ({
  crossfader: 0,
  eqA: { high: 0, mid: 0, low: 0 },
  eqB: { high: 0, mid: 0, low: 0 },
  fxA: [],
  fxB: [],
  quantizeActive: true,
  crossfaderReverse: false,
  setCrossfader: (value) => set({ crossfader: value }),
  setEQ: (deckId, band, value) => set((state) => ({
    [deckId === 'A' ? 'eqA' : 'eqB']: {
      ...state[deckId === 'A' ? 'eqA' : 'eqB'],
      [band]: value
    }
  })),
  addFx: (deckId, type) => set((state) => {
    const defaultParams: Record<string, number> = type === 'reverb' ? { mix: 0.5, decay: 0.5 } 
      : type === 'filter' ? { cutoff: 0.5, resonance: 0.2 } 
      : { drive: 0.5 };
      
    const newFx: FxModuleDef = {
      id: Math.random().toString(36).substring(7),
      type,
      enabled: true,
      params: defaultParams
    };
    const key = deckId === 'A' ? 'fxA' : 'fxB';
    return { [key]: [...state[key], newFx] };
  }),
  removeFx: (deckId, id) => set((state) => {
    const key = deckId === 'A' ? 'fxA' : 'fxB';
    return { [key]: state[key].filter(fx => fx.id !== id) };
  }),
  toggleFx: (deckId, id) => set((state) => {
    const key = deckId === 'A' ? 'fxA' : 'fxB';
    return {
      [key]: state[key].map(fx => fx.id === id ? { ...fx, enabled: !fx.enabled } : fx)
    };
  }),
  setFxParam: (deckId, id, param, value) => set((state) => {
    const key = deckId === 'A' ? 'fxA' : 'fxB';
    return {
      [key]: state[key].map(fx => fx.id === id ? { ...fx, params: { ...fx.params, [param]: value } } : fx)
    };
  }),
  reorderFx: (deckId, startIndex, endIndex) => set((state) => {
    const key = deckId === 'A' ? 'fxA' : 'fxB';
    const result = Array.from(state[key]);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return { [key]: result };
  }),
  toggleQuantize: () => set((state) => ({ quantizeActive: !state.quantizeActive })),
  toggleCrossfaderReverse: () => set((state) => ({ crossfaderReverse: !state.crossfaderReverse }))
}));
