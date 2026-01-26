"use client";

import React, { useState, useCallback } from 'react';
import { useStore } from '@/store/useStore';

interface Suggestion {
  id: string;
  type: 'mix' | 'transition' | 'effect';
  label: string;
  description: string;
  action: () => void;
}

export function SmartSuggestions() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const deckA = useStore((state) => state.deckA);
  const deckB = useStore((state) => state.deckB);

  // Generate suggestions based on current state
  const generateSuggestions = useCallback(() => {
    const newSuggestions: Suggestion[] = [];

    // Check if both decks have tracks loaded
    const bothLoaded = deckA.isLoaded && deckB.isLoaded;
    const bothPlaying = deckA.isPlaying && deckB.isPlaying;

    if (bothLoaded && !bothPlaying) {
      newSuggestions.push({
        id: 'one-click-mix',
        type: 'mix',
        label: 'One-Click Mix',
        description: 'Start both decks and sync to master BPM',
        action: () => {
          // This would trigger the actual mix action
          console.log('[SmartSuggestions] One-click mix triggered');
        },
      });
    }

    if (deckA.isLoaded && !deckB.isLoaded) {
      newSuggestions.push({
        id: 'load-deck-b',
        type: 'transition',
        label: 'Load Deck B',
        description: 'Load a track to Deck B for mixing',
        action: () => {
          window.dispatchEvent(new CustomEvent('studio:open-library'));
        },
      });
    }

    setSuggestions(newSuggestions);
  }, [deckA, deckB]);

  React.useEffect(() => {
    generateSuggestions();
  }, [generateSuggestions]);

  if (suggestions.length === 0) return null;

  return (
    <div
      className="smart-suggestions"
      role="region"
      aria-label="Smart suggestions"
      style={{
        position: 'fixed',
        top: 80,
        right: 20,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        maxWidth: 300,
      }}
    >
      {suggestions.map((suggestion) => (
        <button
          key={suggestion.id}
          onClick={suggestion.action}
          className="suggestion-card"
          style={{
            background: 'rgba(15, 15, 40, 0.95)',
            border: '1px solid rgba(74, 242, 197, 0.3)',
            borderRadius: 8,
            padding: 12,
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(74, 242, 197, 0.6)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(74, 242, 197, 0.3)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 700, color: '#4af2c5', marginBottom: 4 }}>
            {suggestion.label}
          </div>
          <div style={{ fontSize: 12, color: '#9ca3af' }}>{suggestion.description}</div>
        </button>
      ))}
    </div>
  );
}
