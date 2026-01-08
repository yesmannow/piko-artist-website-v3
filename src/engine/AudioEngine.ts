import { useAudioStore } from '../store/useAudioStore';

interface DeckNode {
  source: AudioBufferSourceNode | null;
  gain: GainNode;
  filter: BiquadFilterNode;
  analyser: AnalyserNode;
  buffer: AudioBuffer | null;
  startTime: number; // When playback started (context time)
  pauseTime: number; // Where playback paused (track time)
}

class AudioEngine {
  context: AudioContext;
  masterGain: GainNode;
  decks: Map<string, DeckNode> = new Map();
  // Reusable buffer for analyser data (avoid GC)
  private analyserDataBuffer: Uint8Array = new Uint8Array(32);

  constructor() {
    // Initialize with low latency for fast touch response
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.context = new AudioContextClass({
      latencyHint: 'interactive'
    });

    this.masterGain = this.context.createGain();
    this.masterGain.connect(this.context.destination);

    // Initialize Decks A and B
    this.initDeck('deckA');
    this.initDeck('deckB');
  }

  private initDeck(id: string) {
    // Create filter node
    const filter = this.context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 20000; // Fully open (no filtering)
    filter.Q.value = 0; // No resonance

    // Create gain node
    const gain = this.context.createGain();
    
    // Create analyser node for VU meter
    const analyser = this.context.createAnalyser();
    analyser.fftSize = 32; // Small for performance (just need volume)
    analyser.smoothingTimeConstant = 0.8; // Smooth out peaks
    
    // Route: filter -> gain -> analyser -> masterGain
    filter.connect(gain);
    gain.connect(analyser);
    analyser.connect(this.masterGain);

    this.decks.set(id, {
      source: null,
      gain: gain,
      filter: filter,
      analyser: analyser,
      buffer: null,
      startTime: 0,
      pauseTime: 0
    });
  }

  // --- Public API called by UI ---

  async loadTrack(deckId: string, url: string) {
    const deck = this.decks.get(deckId);
    if (!deck) return;

    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.context.decodeAudioData(arrayBuffer);

      deck.buffer = audioBuffer;
      deck.pauseTime = 0; // Reset playhead

      // Update Store
      useAudioStore.getState().setDeckState(deckId, {
        url,
        duration: audioBuffer.duration,
        isPlaying: false
      });
    } catch (error) {
      console.error(`Failed to load track on ${deckId}:`, error);
    }
  }

  play(deckId: string) {
    // Resume context if browser suspended it (AutoPlay policy)
    if (this.context.state === 'suspended') {
      this.context.resume();
    }

    const deck = this.decks.get(deckId);
    if (!deck || !deck.buffer || useAudioStore.getState().decks[deckId].isPlaying) return;

    // Create new source node (they are one-time use)
    deck.source = this.context.createBufferSource();
    deck.source.buffer = deck.buffer;
    // Route: source -> filter -> gain
    deck.source.connect(deck.filter);

    // Calculate start time
    deck.startTime = this.context.currentTime - deck.pauseTime;
    deck.source.start(0, deck.pauseTime);

    useAudioStore.getState().setDeckState(deckId, { isPlaying: true });
  }

  pause(deckId: string) {
    const deck = this.decks.get(deckId);
    if (!deck || !deck.source) return;

    deck.source.stop();
    // Calculate where we stopped
    deck.pauseTime = this.context.currentTime - deck.startTime;
    deck.source = null;

    useAudioStore.getState().setDeckState(deckId, { isPlaying: false });
  }

  setVolume(deckId: string, value: number) {
    const deck = this.decks.get(deckId);
    if (deck) {
      // Smooth transition to prevent clicking
      deck.gain.gain.setTargetAtTime(value, this.context.currentTime, 0.01);
      useAudioStore.getState().setDeckState(deckId, { volume: value });
    }
  }

  setFilter(deckId: string, x: number, y: number) {
    const deck = this.decks.get(deckId);
    if (!deck) return;

    const currentTime = this.context.currentTime;
    const rampTime = 0.02; // 20ms smooth transition

    // X controls Frequency (logarithmic mapping: 20Hz to 20,000Hz)
    // Logarithmic scale feels more natural for frequency
    const minFreq = 20;
    const maxFreq = 20000;
    const frequency = minFreq * Math.pow(maxFreq / minFreq, x);
    
    // Y controls Resonance/Q (linear mapping: 0 to 20)
    const q = y * 20;

    // Apply smooth parameter changes
    deck.filter.frequency.setTargetAtTime(frequency, currentTime, rampTime);
    deck.filter.Q.setTargetAtTime(q, currentTime, rampTime);
  }

  getRMS(deckId: string): number {
    const deck = this.decks.get(deckId);
    if (!deck) return 0;

    // Get time domain data (waveform)
    deck.analyser.getByteTimeDomainData(this.analyserDataBuffer);

    // Calculate RMS (Root Mean Square) for volume level
    let sum = 0;
    for (let i = 0; i < this.analyserDataBuffer.length; i++) {
      // Convert from 0-255 to -1 to 1
      const normalized = (this.analyserDataBuffer[i] - 128) / 128;
      sum += normalized * normalized;
    }
    const rms = Math.sqrt(sum / this.analyserDataBuffer.length);
    
    // Return normalized 0-1 value
    return Math.min(1, rms * 2); // Multiply by 2 for better visual range
  }
}

// Singleton instance holder
class AudioEngineSingleton {
  private static instance: AudioEngine;

  public static getInstance(): AudioEngine {
    if (!AudioEngineSingleton.instance) {
      if (typeof window === 'undefined') {
        throw new Error('AudioEngine cannot be instantiated on the server');
      }
      AudioEngineSingleton.instance = new AudioEngine();
    }
    return AudioEngineSingleton.instance;
  }
}

// Export a helper, not the class instance directly
export const getAudioEngine = () => AudioEngineSingleton.getInstance();
