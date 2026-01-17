"use client";

import { useEffect } from "react";

/**
 * Basic MIDI subscription hook.
 * Passes raw message.data (Uint8Array) to the callback.
 */
export function useMIDI(onMidiMessage: (data: Uint8Array) => void) {
  useEffect(() => {
    let cleanup: Array<() => void> = [];

    if (
      typeof navigator === "undefined" ||
      !("requestMIDIAccess" in navigator)
    ) {
      return;
    }

    navigator
      .requestMIDIAccess()
      .then((midiAccess) => {
        for (const input of midiAccess.inputs.values()) {
          const handler = (message: WebMidi.MIDIMessageEvent) => {
            onMidiMessage(message.data);
          };
          input.onmidimessage = handler;
          cleanup.push(() => {
            input.onmidimessage = null;
          });
        }
      })
      .catch(() => {
        // ignore errors silently for non-supporting browsers
      });

    return () => {
      cleanup.forEach((fn) => fn());
      cleanup = [];
    };
  }, [onMidiMessage]);
}
