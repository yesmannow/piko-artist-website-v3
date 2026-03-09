"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMixerStore } from "@/store/mixerStore";
import { useDeckStore } from "@/store/deckStore";

interface MidiBridgeState {
  isSupported: boolean;
  isActive: boolean;
  error: string | null;
  toggle: () => void;
}

const normalize = (value: number) => Math.max(0, Math.min(1, value / 127));
/** Map 0–1 MIDI normalized value to -1…+1 crossfader range */
const normToCrossfader = (n: number) => n * 2 - 1;

export function useMidiBridge(): MidiBridgeState {
  const setCrossfader = useMixerStore((state) => state.setCrossfader);
  const setVolume = useDeckStore((state) => state.setVolume);
  const { setPlaybackRate } = useDeckStore();

  const midiAccessRef = useRef<MIDIAccess | null>(null);
  const isInitializedRef = useRef(false);
  const [isSupported, setIsSupported] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const heartbeatTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Track 14-bit MSB values
  const msbRef = useRef<{ [cc: number]: number }>({});

  const handleMidiMessage = useCallback(
    (event: MIDIMessageEvent) => {
      const data = event.data;
      if (!data) return;
      const [status, data1, data2] = data;
      const command = status & 0xf0;
      const channel = status & 0x0f;

      // Pitch Bend (14-bit native, often used for Tempo/Pitch Faders)
      if (command === 0xe0) {
        const pitchValue = (data2 << 7) | data1; // 0 to 16383
        const normalized = pitchValue / 16383; // 0.0 to 1.0
        // Pitch mapping from -8% to +8%
        const rate = Math.max(0.5, Math.min(2.0, 0.92 + (normalized * 0.16)));
        setPlaybackRate(channel === 0 ? "A" : "B", rate);
        return;
      }

      // Control Change
      if (command === 0xb0) {
        const cc = data1;
        const value = data2;

        // 14-bit MSB (0-31)
        if (cc >= 0 && cc <= 31) {
          msbRef.current[cc] = value;
          // Apply coarse value immediately to avoid lag if LSB is missing or delayed
          const normalized = value / 127;
          if (cc === 1) setCrossfader(normToCrossfader(normalized));
          if (cc === 7) setVolume("A", normalized);
          if (cc === 8) setVolume("B", normalized);
        } 
        // 14-bit LSB (32-63)
        else if (cc >= 32 && cc <= 63) {
          const msb = msbRef.current[cc - 32] || 0;
          const highResValue = (msb << 7) | value;
          const normalized = highResValue / 16383;
          // Apply high resolution 14-bit (16,384 steps) to eliminate zipper noise
          if (cc - 32 === 1) setCrossfader(normToCrossfader(normalized));
          if (cc - 32 === 7) setVolume("A", normalized);
          if (cc - 32 === 8) setVolume("B", normalized);
        } 
        // Standard 7-bit
        else {
          if (cc === 1) setCrossfader(normToCrossfader(normalize(value)));
          if (cc === 7) setVolume("A", normalize(value));
          if (cc === 8) setVolume("B", normalize(value));
        }
      }
    },
    [setCrossfader, setVolume, setPlaybackRate]
  );

  const attachInputs = useCallback(() => {
    const access = midiAccessRef.current;
    if (!access) return;
    access.inputs.forEach((input) => {
      input.removeEventListener("midimessage", handleMidiMessage);
      input.addEventListener("midimessage", handleMidiMessage);
    });
  }, [handleMidiMessage]);

  const connectWebSocket = useCallback(function connect() {
    if (wsRef.current) return;
    try {
      const ws = new WebSocket('ws://localhost:8080'); // Phase hardware WS endpoint
      ws.onopen = () => {
        console.log('[MidiBridge] Hardware WebSocket connected');
        // Heartbeat polling
        heartbeatTimerRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'heartbeat' }));
          }
        }, 3000);
      };
      ws.onclose = () => {
        console.log('[MidiBridge] Hardware WebSocket disconnected');
        if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
        wsRef.current = null;
        // Attempt reconnect later if active
        if (isActive) {
          setTimeout(connect, 5000);
        }
      };
      ws.onerror = (err) => {
        console.warn('[MidiBridge] WebSocket error, checking hardware bridge connection...', err);
      };
      wsRef.current = ws;
    } catch (e) {
      console.warn('[MidiBridge] Failed to establish hardware bridge', e);
    }
  }, [isActive]);

  const disconnectWebSocket = useCallback(() => {
    if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

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
      connectWebSocket();
    } catch (err) {
      console.error("[MIDI] Failed to start bridge:", err);
      setError(err instanceof Error ? err.message : "Unknown MIDI error");
      setIsActive(false);
    }
  }, [attachInputs, isSupported, connectWebSocket]);

  const stop = useCallback(() => {
    const access = midiAccessRef.current;
    access?.inputs.forEach((input) => {
      input.removeEventListener("midimessage", handleMidiMessage);
    });
    access?.removeEventListener("statechange", attachInputs);
    disconnectWebSocket();
  }, [attachInputs, handleMidiMessage, disconnectWebSocket]);

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
