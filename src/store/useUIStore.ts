import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type ViewMode = "WAVEFORM" | "MIXER" | "FX" | "PADS";
export type LayoutMode = "studio" | "minimal";

const UI_STORAGE_KEY = "piko-ui-preferences";

interface UIStore {
  activeView: ViewMode;
  setActiveView: (view: ViewMode) => void;

  // Library drawer state
  isLibraryOpen: boolean;
  libraryTargetDeck: "deckA" | "deckB"; // Which deck are we loading into?

  openLibrary: (target: "deckA" | "deckB") => void;
  closeLibrary: () => void;

  // Guided experiences + layout
  tourModeEnabled: boolean;
  tourCompleted: boolean;
  layoutMode: LayoutMode;
  onboardingComplete: boolean;

  setTourModeEnabled: (enabled: boolean) => void;
  markTourCompleted: () => void;
  resetTourProgress: () => void;
  setLayoutMode: (mode: LayoutMode) => void;
  toggleLayoutMode: () => void;
  setOnboardingComplete: (complete: boolean) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      activeView: "WAVEFORM", // Default view
      setActiveView: (view) => set({ activeView: view }),

      // Library drawer defaults
      isLibraryOpen: false,
      libraryTargetDeck: "deckA",

      openLibrary: (target) =>
        set({ isLibraryOpen: true, libraryTargetDeck: target }),
      closeLibrary: () => set({ isLibraryOpen: false }),

      // Guided experiences + layout
      tourModeEnabled: false,
      tourCompleted: false,
      layoutMode: "studio",
      onboardingComplete: false,

      setTourModeEnabled: (enabled) => set({ tourModeEnabled: enabled }),
      markTourCompleted: () => {
        set({ tourCompleted: true, tourModeEnabled: false });
        if (typeof window !== "undefined") {
          localStorage.setItem("tour_completed", "true");
        }
      },
      resetTourProgress: () => {
        set({ tourCompleted: false, tourModeEnabled: true });
        if (typeof window !== "undefined") {
          localStorage.removeItem("tour_completed");
        }
      },
      setLayoutMode: (mode) => set({ layoutMode: mode }),
      toggleLayoutMode: () =>
        set((state) => ({
          layoutMode: state.layoutMode === "studio" ? "minimal" : "studio",
        })),
      setOnboardingComplete: (complete) =>
        set({ onboardingComplete: complete }),
    }),
    {
      name: UI_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      // Persist durable preferences; keep session-only flags in memory
      partialize: (state) => ({
        layoutMode: state.layoutMode,
        onboardingComplete: state.onboardingComplete,
        tourCompleted: state.tourCompleted,
      }),
      onRehydrateStorage: () => (state) => {
        // Sync legacy flag if present
        if (typeof window !== "undefined" && state) {
          const legacy = localStorage.getItem("tour_completed");
          if (legacy === "true") {
            state.tourCompleted = true;
          }
        }
      },
    },
  ),
);
