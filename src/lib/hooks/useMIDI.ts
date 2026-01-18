"use client";

import { useEffect } from "react";

interface MidiMessageEvent {
  data: Uint8Array;
}

interface MidiInput {
  onmidimessage: ((event: MidiMessageEvent) => void) | null;
}

interface MidiAccess {
  inputs: Iterable<MidiInput>;
}

/**
 * Basic MIDI subscription hook.
 * Passes raw message.data (Uint8Array) to the callback.
 */
export function useMIDI(onMidiMessage: (data: Uint8Array) => void) {
  useEffect(() => {
    let cleanup: (() => void)[] = [];

    if (typeof navigator === "undefined") {
      return;
    }

    const nav = navigator as Navigator & {
      requestMIDIAccess?: () => Promise<MidiAccess>;
    };

    if (!nav.requestMIDIAccess) {
      return;
    }

    nav
      .requestMIDIAccess()
      .then((midiAccess) => {
        const inputs =
          "values" in midiAccess.inputs
            ? (
                midiAccess.inputs as Iterable<MidiInput> & {
                  values: () => Iterable<MidiInput>;
                }
              ).values()
            : midiAccess.inputs;
        for (const input of inputs) {
          const handler = (message: MidiMessageEvent) => {
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
