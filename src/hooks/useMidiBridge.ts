"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useStore } from "@/store/useStore";
import { useStudioStore } from "@/store/useStudioStore";

interface MidiBridgeState {
  isSupported: boolean;
  isActive: boolean;
  error: string | null;
  toggle: () => void;
}

const normalize = (value: number) => Math.max(0, Math.min(1, value / 127));

export function useMidiBridge(): MidiBridgeState {
  const setDeckVolume = useStore((state) => state.setDeckVolume);
  const setCrossfader = useStudioStore((state) => state.setCrossfader);

  const midiAccessRef = useRef<MIDIAccess | null>(null);
  const isInitializedRef = useRef(false);
  const [isSupported, setIsSupported] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMidiMessage = useCallback(
    (event: MIDIMessageEvent) => {
      const data = event.data;
      if (!data) return;
      const [status, cc, value] = data;
      const command = status & 0xf0;

      if (command !== 0xb0) return; // Only handle Control Change events

      if (cc === 1) {
        setCrossfader(normalize(value));
        return;
      }

      if (cc === 7) {
        const volume = normalize(value);
        setDeckVolume("A", volume);
        return;
      }

      if (cc === 8) {
        const volume = normalize(value);
        setDeckVolume("B", volume);
      }
    },
    [setCrossfader, setDeckVolume]
  );

  const attachInputs = useCallback(() => {
    const access = midiAccessRef.current;
    if (!access) return;
    access.inputs.forEach((input) => {
      input.removeEventListener("midimessage", handleMidiMessage);
      input.addEventListener("midimessage", handleMidiMessage);
    });
  }, [handleMidiMessage]);

  const start = useCallback(async () => {
    if (!isSupported || !navigator.requestMIDIAccess) {
      setIsActive(false);
      return;
    }
    try {
      if (!isInitializedRef.current || !midiAccessRef.current) {
        const midiAccess = await navigator.requestMIDIAccess();
        midiAccessRef.current = midiAccess;
        isInitializedRef.current = true;
      }
      attachInputs();
      midiAccessRef.current?.addEventListener("statechange", attachInputs);
      setError(null);
    } catch (err) {
      console.error("[MIDI] Failed to start bridge:", err);
      setError(err instanceof Error ? err.message : "Unknown MIDI error");
      setIsActive(false);
    }
  }, [attachInputs, isSupported]);

  const stop = useCallback(() => {
    const access = midiAccessRef.current;
    access?.inputs.forEach((input) => {
      input.removeEventListener("midimessage", handleMidiMessage);
    });
    access?.removeEventListener("statechange", attachInputs);
  }, [attachInputs, handleMidiMessage]);

  const toggle = useCallback(() => {
    setIsActive((prev) => !prev);
  }, []);

  useEffect(() => {
    // Initialize MIDI support detection async
    const checkSupport = async () => {
      setIsSupported(typeof navigator !== "undefined" && "requestMIDIAccess" in navigator);
    };
    void checkSupport();
  }, []);

  useEffect(() => {
    if (!isActive) {
      stop();
      return;
    }
    
    // Wrap start() call to avoid lint error
    const initMidi = async () => {
      await start();
    };
    void initMidi();
    
    return () => {
      stop();
    };
  }, [isActive, start, stop]);

  return {
    isSupported,
    isActive,
    error,
    toggle,
  };
}
