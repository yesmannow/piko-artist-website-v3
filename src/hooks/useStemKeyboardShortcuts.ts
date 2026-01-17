"use client";

import { useEffect, useCallback } from "react";

interface StemMuteState {
  vocals: boolean;
  bass: boolean;
  drums: boolean;
  other: boolean;
}

interface UseStemKeyboardShortcutsProps {
  deckAStems?: StemMuteState;
  deckBStems?: StemMuteState;
  onDeckAStemToggle?: (stem: keyof StemMuteState) => void;
  onDeckBStemToggle?: (stem: keyof StemMuteState) => void;
}

/**
 * useStemKeyboardShortcuts - Power user keyboard shortcuts for stem mutes
 *
 * V3 Urban Syndicate: Professional DJ shortcuts
 * - Keys 1-4: Toggle Console A stem mutes (Vocals, Bass, Drums, Other)
 * - Keys Q-R: Toggle Console B stem mutes (Vocals, Bass, Drums, Other)
 *
 * Mapping:
 * Console A: 1=Vocals, 2=Bass, 3=Drums, 4=Other
 * Console B: Q=Vocals, W=Bass, E=Drums, R=Other
 */
export function useStemKeyboardShortcuts({
  deckAStems: _deckAStems,
  deckBStems: _deckBStems,
  onDeckAStemToggle,
  onDeckBStemToggle,
}: UseStemKeyboardShortcutsProps) {
  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      const key = e.key.toLowerCase();

      // Console A: Keys 1-4
      if (key === "1" && onDeckAStemToggle) {
        e.preventDefault();
        onDeckAStemToggle("vocals");
      } else if (key === "2" && onDeckAStemToggle) {
        e.preventDefault();
        onDeckAStemToggle("bass");
      } else if (key === "3" && onDeckAStemToggle) {
        e.preventDefault();
        onDeckAStemToggle("drums");
      } else if (key === "4" && onDeckAStemToggle) {
        e.preventDefault();
        onDeckAStemToggle("other");
      }

      // Console B: Keys Q-R
      if (key === "q" && onDeckBStemToggle) {
        e.preventDefault();
        onDeckBStemToggle("vocals");
      } else if (key === "w" && onDeckBStemToggle) {
        e.preventDefault();
        onDeckBStemToggle("bass");
      } else if (key === "e" && onDeckBStemToggle) {
        e.preventDefault();
        onDeckBStemToggle("drums");
      } else if (key === "r" && onDeckBStemToggle) {
        e.preventDefault();
        onDeckBStemToggle("other");
      }
    },
    [onDeckAStemToggle, onDeckBStemToggle],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    window.addEventListener("keydown", handleKeyPress);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [handleKeyPress]);
}
