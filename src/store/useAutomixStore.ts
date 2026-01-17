import { create } from "zustand";

type DeckId = "deckA" | "deckB";

interface AutomixState {
  enabled: boolean;
  transitionDuration: number;
  masterDeck: DeckId;
  setEnabled: (value: boolean) => void;
  setTransitionDuration: (seconds: number) => void;
  setMasterDeck: (deck: DeckId) => void;
}

export const useAutomixStore = create<AutomixState>((set) => ({
  enabled: false,
  transitionDuration: 10,
  masterDeck: "deckA",
  setEnabled: (enabled) => set({ enabled }),
  setTransitionDuration: (transitionDuration) => set({ transitionDuration }),
  setMasterDeck: (masterDeck) => set({ masterDeck }),
}));
