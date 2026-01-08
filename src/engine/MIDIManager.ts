import { getAudioEngine } from './AudioEngine';
import { useMIDIStore, type MIDIAction } from '@/store/useMIDIStore';

/**
 * PHASE 7: MIDI Manager
 * 
 * Handles WebMIDI API integration for hardware controller support.
 * Features:
 * - Auto-detection of MIDI devices
 * - MIDI message normalization
 * - Hardcoded mappings for generic controllers
 * - Learn mode for custom mappings
 */

class MIDIManager {
  private midiAccess: MIDIAccess | null = null;
  private initialized: boolean = false;

  /**
   * Initialize WebMIDI and connect to available devices
   */
  async initialize(): Promise<boolean> {
    if (this.initialized) {
      console.warn('MIDIManager already initialized');
      return true;
    }

    // Check for WebMIDI support
    if (!navigator.requestMIDIAccess) {
      console.error('❌ WebMIDI not supported in this browser');
      return false;
    }

    try {
      // Request MIDI access
      this.midiAccess = await navigator.requestMIDIAccess();
      console.log('✅ WebMIDI access granted');

      // List available inputs
      this.listInputs();

      // Connect to all inputs
      this.connectInputs();

      // Listen for device connection/disconnection
      this.midiAccess.onstatechange = (event) => {
        console.log('MIDI state change:', event);
        this.listInputs();
        this.connectInputs();
      };

      this.initialized = true;
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize WebMIDI:', error);
      return false;
    }
  }

  /**
   * List all available MIDI inputs
   */
  private listInputs() {
    if (!this.midiAccess) return;

    console.log('📋 Available MIDI Inputs:');
    const inputs = Array.from(this.midiAccess.inputs.values());
    
    if (inputs.length === 0) {
      console.log('  No MIDI devices connected');
      useMIDIStore.getState().setConnected(false);
    } else {
      inputs.forEach((input) => {
        console.log(`  - ${input.name} (${input.manufacturer})`);
      });
      
      // Update store with first device
      const firstDevice = inputs[0];
      useMIDIStore.getState().setConnected(true, firstDevice.name || 'Unknown Device');
    }
  }

  /**
   * Connect to all MIDI inputs and listen for messages
   */
  private connectInputs() {
    if (!this.midiAccess) return;

    this.midiAccess.inputs.forEach((input) => {
      input.onmidimessage = (event) => this.handleMIDIMessage(event);
      console.log(`🎹 Connected to: ${input.name}`);
    });
  }

  /**
   * Handle incoming MIDI messages
   */
  private handleMIDIMessage(event: MIDIMessageEvent) {
    // Handle null data
    if (!event.data || event.data.length < 3) return;
    
    const status = event.data[0];
    const data1 = event.data[1];
    const data2 = event.data[2];
    
    // Update activity indicator
    useMIDIStore.getState().setActivity();

    // Parse MIDI message
    const messageType = status & 0xf0; // Upper 4 bits
    const channel = status & 0x0f;     // Lower 4 bits

    // Normalize data
    const normalizedValue = data2 / 127; // 0-127 -> 0.0-1.0

    // Create mapping key
    const midiKey = `${status}:${data1}`;

    console.log(`🎹 MIDI: ${this.getMIDITypeName(messageType)} | Ch:${channel} | Data1:${data1} | Data2:${data2} | Normalized:${normalizedValue.toFixed(2)}`);

    // Check if in learn mode
    const store = useMIDIStore.getState();
    if (store.learnMode && store.learnTarget) {
      // Map this MIDI input to the target action
      store.setMapping(midiKey, store.learnTarget, `${this.getMIDITypeName(messageType)} ${data1}`);
      store.stopLearn();
      console.log(`✅ Mapped ${midiKey} -> ${store.learnTarget}`);
      return;
    }

    // Check for custom mapping
    const mapping = store.mappings[midiKey];
    if (mapping) {
      this.executeAction(mapping.action, normalizedValue, data2);
      return;
    }

    // Fallback: Use hardcoded mappings for generic controllers
    this.executeHardcodedMapping(messageType, data1, data2, normalizedValue);
  }

  /**
   * Execute a mapped action
   */
  private executeAction(action: MIDIAction, normalizedValue: number, rawValue: number) {
    try {
      const engine = getAudioEngine();

      switch (action) {
        case 'deckA_play':
          if (rawValue > 0) engine.play('deckA');
          break;
        case 'deckA_pause':
          if (rawValue > 0) engine.pause('deckA');
          break;
        case 'deckA_cue':
          if (rawValue > 0) engine.seek('deckA', 0);
          break;
        case 'deckA_volume':
          engine.setVolume('deckA', normalizedValue);
          break;
        case 'deckB_play':
          if (rawValue > 0) engine.play('deckB');
          break;
        case 'deckB_pause':
          if (rawValue > 0) engine.pause('deckB');
          break;
        case 'deckB_cue':
          if (rawValue > 0) engine.seek('deckB', 0);
          break;
        case 'deckB_volume':
          engine.setVolume('deckB', normalizedValue);
          break;
        case 'crossfader':
          // Crossfader logic would go here
          console.log(`Crossfader: ${normalizedValue.toFixed(2)}`);
          break;
        case 'masterVolume':
          // Master volume logic would go here
          console.log(`Master Volume: ${normalizedValue.toFixed(2)}`);
          break;
      }
    } catch (error) {
      console.warn('Failed to execute MIDI action:', error);
    }
  }

  /**
   * Hardcoded mappings for generic MIDI controllers (testing)
   */
  private executeHardcodedMapping(
    messageType: number,
    data1: number,
    data2: number,
    normalizedValue: number
  ) {
    try {
      const engine = getAudioEngine();

      // Note On (0x90) - Buttons
      if (messageType === 0x90 && data2 > 0) {
        switch (data1) {
          case 50: // Note 50: Deck A Play
            engine.play('deckA');
            console.log('🎵 Deck A Play (Note 50)');
            break;
          case 51: // Note 51: Deck A Cue
            engine.seek('deckA', 0);
            console.log('🎵 Deck A Cue (Note 51)');
            break;
          case 52: // Note 52: Deck B Play
            engine.play('deckB');
            console.log('🎵 Deck B Play (Note 52)');
            break;
          case 53: // Note 53: Deck B Cue
            engine.seek('deckB', 0);
            console.log('🎵 Deck B Cue (Note 53)');
            break;
        }
      }

      // Note Off (0x80) - Button release
      if (messageType === 0x80 || (messageType === 0x90 && data2 === 0)) {
        // Handle button release if needed
      }

      // Control Change (0xB0) - Knobs/Faders
      if (messageType === 0xb0) {
        switch (data1) {
          case 0: // CC 0: Deck A Volume
            engine.setVolume('deckA', normalizedValue);
            console.log(`🎚️ Deck A Volume: ${normalizedValue.toFixed(2)} (CC 0)`);
            break;
          case 1: // CC 1: Crossfader
            console.log(`🎚️ Crossfader: ${normalizedValue.toFixed(2)} (CC 1)`);
            // Crossfader implementation would go here
            break;
          case 2: // CC 2: Deck B Volume
            engine.setVolume('deckB', normalizedValue);
            console.log(`🎚️ Deck B Volume: ${normalizedValue.toFixed(2)} (CC 2)`);
            break;
        }
      }
    } catch (error) {
      console.warn('Failed to execute hardcoded MIDI mapping:', error);
    }
  }

  /**
   * Get human-readable MIDI message type name
   */
  private getMIDITypeName(messageType: number): string {
    switch (messageType) {
      case 0x80: return 'Note Off';
      case 0x90: return 'Note On';
      case 0xa0: return 'Aftertouch';
      case 0xb0: return 'Control Change';
      case 0xc0: return 'Program Change';
      case 0xd0: return 'Channel Pressure';
      case 0xe0: return 'Pitch Bend';
      default: return `Unknown (0x${messageType.toString(16)})`;
    }
  }

  /**
   * Disconnect all MIDI inputs
   */
  disconnect() {
    if (!this.midiAccess) return;

    this.midiAccess.inputs.forEach((input) => {
      input.onmidimessage = null;
    });

    useMIDIStore.getState().setConnected(false);
    console.log('🎹 MIDI disconnected');
  }
}

// Singleton instance
class MIDIManagerSingleton {
  private static instance: MIDIManager;

  public static getInstance(): MIDIManager {
    if (!MIDIManagerSingleton.instance) {
      if (typeof window === 'undefined') {
        throw new Error('MIDIManager cannot be instantiated on the server');
      }
      MIDIManagerSingleton.instance = new MIDIManager();
    }
    return MIDIManagerSingleton.instance;
  }
}

export function getMIDIManager(): MIDIManager {
  return MIDIManagerSingleton.getInstance();
}
