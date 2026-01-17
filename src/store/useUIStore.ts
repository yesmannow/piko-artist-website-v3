import { create } from "zustand";

type ViewMode = "WAVEFORM" | "MIXER" | "FX" | "PADS";

interface UIStore {
  activeView: ViewMode;
  setActiveView: (view: ViewMode) => void;

  // Library drawer state
  isLibraryOpen: boolean;
  libraryTargetDeck: "deckA" | "deckB"; // Which deck are we loading into?

  openLibrary: (target: "deckA" | "deckB") => void;
  closeLibrary: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  activeView: "WAVEFORM", // Default view
  setActiveView: (view) => set({ activeView: view }),

  // Library drawer defaults
  isLibraryOpen: false,
  libraryTargetDeck: "deckA",

  openLibrary: (target) =>
    set({ isLibraryOpen: true, libraryTargetDeck: target }),
  closeLibrary: () => set({ isLibraryOpen: false }),
}));
