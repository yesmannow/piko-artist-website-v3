"use client";

import { useEffect, useCallback, useRef } from 'react';
import { useFXEngine } from '@/hooks/useFXEngine';

/**
 * useInputBindings - Hook for binding FX controls to keyboard, MIDI, and audio triggers
 * 
 * Features:
 * - Keyboard shortcuts for quick FX adjustments
 * - MIDI support (via Web MIDI API)
 * - Audio-reactive control (via RMS tracking)
 * 
 * @example
 * ```tsx
 * function FXControls() {
 *   useInputBindings();
 *   // Now keyboard shortcuts work:
 *   // 1-3: Set reverb to 0.25, 0.5, 0.8
 *   // Q-W-E: Set delay to 0.25, 0.5, 0.8
 *   // A-S-D: Set filter to 0.25, 0.5, 0.8
 * }
 * ```
 */
export function useInputBindings() {
  const fx = useFXEngine();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const midiAccessRef = useRef<any>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Keyboard bindings
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const deck = fx.activeDeck;

      // Reverb controls (1-3)
      if (e.key === '1') {
        fx.setFX(deck, 'reverb', 0.25);
      } else if (e.key === '2') {
        fx.setFX(deck, 'reverb', 0.5);
      } else if (e.key === '3') {
        fx.setFX(deck, 'reverb', 0.8);
      }

      // Delay controls (Q-W-E)
      if (e.key === 'q' || e.key === 'Q') {
        fx.setFX(deck, 'delay', 0.25);
      } else if (e.key === 'w' || e.key === 'W') {
        fx.setFX(deck, 'delay', 0.5);
      } else if (e.key === 'e' || e.key === 'E') {
        fx.setFX(deck, 'delay', 0.8);
      }

      // Filter controls (A-S-D)
      if (e.key === 'a' || e.key === 'A') {
        fx.setFX(deck, 'filter', 0.25);
      } else if (e.key === 's' || e.key === 'S') {
        fx.setFX(deck, 'filter', 0.5);
      } else if (e.key === 'd' || e.key === 'D') {
        fx.setFX(deck, 'filter', 0.8);
      }

      // Reset FX (R)
      if (e.key === 'r' || e.key === 'R') {
        fx.resetFX(deck);
      }

      // Toggle automation (Space)
      if (e.key === ' ') {
        e.preventDefault();
        if (fx.isAutomationPlaying) {
          fx.pauseAutomation();
        } else {
          fx.startAutomation();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fx]);

  // MIDI support
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.requestMIDIAccess) {
      return;
    }

    const initMIDI = async () => {
      try {
        const access = await navigator.requestMIDIAccess({ sysex: false });
        midiAccessRef.current = access;

        // Listen to all MIDI inputs
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        access.inputs.forEach((input: any) => {
          input.onmidimessage = (event: { data: Uint8Array }) => {
            const [status, note, velocity] = event.data;
            const command = status >> 4;
            const channel = status & 0xf;

            // Note On (0x9) or Note Off (0x8)
            if (command === 0x9 || command === 0x8) {
              const isOn = command === 0x9 && velocity > 0;
              const normalizedValue = velocity / 127;

              // Map MIDI notes to FX parameters
              // C4 (60) - Reverb
              // D4 (62) - Delay
              // E4 (64) - Filter
              if (note === 60) {
                fx.setFX(fx.activeDeck, 'reverb', normalizedValue);
              } else if (note === 62) {
                fx.setFX(fx.activeDeck, 'delay', normalizedValue);
              } else if (note === 64) {
                fx.setFX(fx.activeDeck, 'filter', normalizedValue);
              }
            }

            // CC (Control Change) messages
            if (command === 0xb) {
              const ccNumber = note;
              const ccValue = velocity / 127;

              // CC 1: Reverb
              // CC 2: Delay
              // CC 3: Filter
              if (ccNumber === 1) {
                fx.setFX(fx.activeDeck, 'reverb', ccValue);
              } else if (ccNumber === 2) {
                fx.setFX(fx.activeDeck, 'delay', ccValue);
              } else if (ccNumber === 3) {
                fx.setFX(fx.activeDeck, 'filter', ccValue);
              }
            }
          };
        });
      } catch (error) {
        console.warn('MIDI access denied or not available:', error);
      }
    };

    initMIDI();

    return () => {
      if (midiAccessRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        midiAccessRef.current.inputs.forEach((input: any) => {
          input.onmidimessage = null;
        });
      }
    };
  }, [fx]);

  // Audio-reactive control (RMS tracking)
  const setupAudioReactive = useCallback(
    async (audioContext: AudioContext, source: AudioNode) => {
      try {
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        analyserRef.current = analyser;

        source.connect(analyser);

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const updateRMS = () => {
          if (analyserRef.current) {
            analyserRef.current.getByteTimeDomainData(dataArray);
          }

          // Calculate RMS
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            const normalized = (dataArray[i] - 128) / 128;
            sum += normalized * normalized;
          }
          const rms = Math.sqrt(sum / bufferLength);

          // Map RMS to FX (optional - can be enabled via settings)
          // This is a simple example - you might want to add a toggle
          // fx.setFX(fx.activeDeck, 'filter', Math.min(rms * 2, 1));
        };

        const interval = setInterval(updateRMS, 100); // Update every 100ms

        return () => {
          clearInterval(interval);
          analyser.disconnect();
        };
      } catch (error) {
        console.warn('Audio reactive setup failed:', error);
      }
    },
    [fx]
  );

  return {
    setupAudioReactive,
    midiEnabled: midiAccessRef.current !== null,
  };
}
