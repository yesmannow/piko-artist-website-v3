"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useStore } from "@/store/useStore";

interface MidiBridgeState {
  isSupported: boolean;
  isActive: boolean;
  error: string | null;
  toggle: () => void;
}

const normalize = (value: number) => Math.max(0, Math.min(1, value / 127));

export function useMidiBridge(): MidiBridgeState {
  const { setCrossfade, setDeckVolume } = useStore((state) => ({
    setCrossfade: state.setCrossfade,
    setDeckVolume: state.setDeckVolume,
  }));

  const midiAccessRef = useRef<MIDIAccess | null>(null);
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
        const cross = normalize(value) * 2 - 1; // map 0..1 to -1..1
        setCrossfade(cross);
        return;
      }

      if (cc === 7) {
        const volume = normalize(value);
        setDeckVolume("A", volume);
      }
    },
    [setCrossfade, setDeckVolume]
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
    if (!isSupported || !navigator.requestMIDIAccess) return;
    try {
      const midiAccess = await navigator.requestMIDIAccess();
      midiAccessRef.current = midiAccess;
      attachInputs();
      midiAccess.addEventListener("statechange", attachInputs);
      setIsActive(true);
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
    midiAccessRef.current = null;
    setIsActive(false);
  }, [attachInputs, handleMidiMessage]);

  const toggle = useCallback(() => {
    if (isActive) {
      stop();
    } else {
      void start();
    }
  }, [isActive, start, stop]);

  useEffect(() => {
    setIsSupported(typeof navigator !== "undefined" && "requestMIDIAccess" in navigator);
    return () => {
      stop();
    };
  }, [stop]);

  return {
    isSupported,
    isActive,
    error,
    toggle,
  };
}
