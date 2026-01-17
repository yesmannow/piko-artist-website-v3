import { useAudioStore } from "../store/useAudioStore";

interface DeckNode {
  source: AudioBufferSourceNode | null;
  buffer: AudioBuffer | null;
  // EQ chain
  eq: {
    low: BiquadFilterNode;
    mid: BiquadFilterNode;
    high: BiquadFilterNode;
  };
  // Dry path gain
  dryGain: GainNode;
  // FX bundle (simple wet controls)
  fx: {
    filter: BiquadFilterNode;
    delay: DelayNode;
    delayGain: GainNode;
    reverb: GainNode;
  };
  // Deck gain for crossfader and volume scaling
  deckGain: GainNode;
  // Output tap (feeds analyser/master)
  output: GainNode;
  analyser: AnalyserNode;
  startTime: number; // When playback started (context time)
  pauseTime: number; // Where playback paused (track time)
  // PHASE 6: Loop System
  loopActive: boolean;
  loopStart: number; // Loop start time in seconds
  loopEnd: number; // Loop end time in seconds
  // PHASE 6: Hot Cue System
  hotCues: Map<number, number>; // Cue index (1-4) -> timestamp in seconds
  // PHASE 8: BPM & Sync
  bpm: number; // Detected tempo
  gridOffset: number; // Time of first beat in seconds
  playbackRate: number; // Current playback speed (1.0 = normal)
}

const DEBUG_AUDIO = process.env.NODE_ENV !== "production";
const DEBUG_BYPASS_FX = false; // flip to true to bypass filters when debugging silence

class AudioEngine {
  context: AudioContext | null = null;
  masterGain: GainNode | null = null;
  decks: Map<string, DeckNode> = new Map();
  // Reusable buffer for analyser data (avoid GC)
  private analyserDataBuffer: Uint8Array<ArrayBuffer> = new Uint8Array(
    new ArrayBuffer(32),
  );
  private initialized: boolean = false;
  state: "Uninitialized" | "Initializing" | "Running" | "Error" =
    "Uninitialized";
  private mediaDestination: MediaStreamAudioDestinationNode | null = null;
  private recorder: MediaRecorder | null = null;
  private recordedChunks: BlobPart[] = [];

  private async ensureReady(): Promise<boolean> {
    if (!this.initialized) {
      const ok = await this.initialize();
      if (!ok) return false;
    }

    if (this.context && this.context.state === "suspended") {
      await this.context.resume();
    }

    return !!this.context;
  }

  constructor() {
    // REMEDIATION: Do NOT initialize AudioContext in constructor
    // Safari's autoplay policy requires user interaction
  }

  /**
   * REMEDIATION: "Unlock" Audio Pattern
   * Initialize AudioContext only via user interaction (tap)
   * This prevents Safari from suspending the audio and iOS from killing the context
   */
  async initialize(): Promise<boolean> {
    if (this.initialized) {
      console.warn("AudioEngine already initialized");
      return true;
    }

    try {
      this.state = "Initializing";

      // Initialize with low latency for fast touch response
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;
      this.context = new AudioContextClass({
        latencyHint: "interactive",
      });

      // CRITICAL: Safari Autoplay Fix - Resume if suspended
      if (this.context.state === "suspended") {
        await this.context.resume();
      }

      this.masterGain = this.context.createGain();
      this.masterGain.connect(this.context.destination);

      // Setup recording destination
      this.mediaDestination = this.context.createMediaStreamDestination();
      this.masterGain.connect(this.mediaDestination);

      // Initialize Decks A and B
      this.initDeck("deckA");
      this.initDeck("deckB");

      this.initialized = true;
      this.state = "Running";
      console.log("AudioEngine initialized successfully");
      return true;
    } catch (error) {
      console.error("❌ AudioEngine initialization failed:", error);
      this.state = "Error";
      return false;
    }
  }

  private initDeck(id: string) {
    if (!this.context || !this.masterGain) {
      throw new Error("AudioEngine not initialized. Call initialize() first.");
    }

    // EQ chain
    const eqLow = this.context.createBiquadFilter();
    eqLow.type = "lowshelf";
    eqLow.frequency.value = 200;
    eqLow.gain.value = 0;

    const eqMid = this.context.createBiquadFilter();
    eqMid.type = "peaking";
    eqMid.frequency.value = 1000;
    eqMid.Q.value = 1;
    eqMid.gain.value = 0;

    const eqHigh = this.context.createBiquadFilter();
    eqHigh.type = "highshelf";
    eqHigh.frequency.value = 5000;
    eqHigh.gain.value = 0;

    // Dry gain (post-EQ)
    const dryGain = this.context.createGain();
    dryGain.gain.value = 1.0;

    // FX nodes
    const fxFilter = this.context.createBiquadFilter();
    fxFilter.type = "lowpass";
    fxFilter.frequency.value = 20000;
    fxFilter.Q.value = 0;

    const delay = this.context.createDelay(1.0);
    delay.delayTime.value = 0;
    const delayGain = this.context.createGain();
    delayGain.gain.value = 0;

    const reverb = this.context.createGain();
    reverb.gain.value = 0;

    // Deck gain (for volume + crossfader)
    const deckGain = this.context.createGain();
    deckGain.gain.value = 1.0;

    // Output and analyser
    const output = this.context.createGain();
    const analyser = this.context.createAnalyser();
    analyser.fftSize = 32;
    analyser.smoothingTimeConstant = 0.8;

    // Routing:
    // EQ chain
    eqLow.connect(eqMid);
    eqMid.connect(eqHigh);

    // Dry path
    eqHigh.connect(dryGain);

    // FX paths (simple wet mix)
    eqHigh.connect(fxFilter);
    fxFilter.connect(delay);
    delay.connect(delayGain);
    delayGain.connect(deckGain);

    fxFilter.connect(reverb);
    reverb.connect(deckGain);

    // Dry to deck gain
    dryGain.connect(deckGain);

    // Deck gain to output/analyser/master
    deckGain.connect(output);
    output.connect(analyser);
    analyser.connect(this.masterGain);

    this.decks.set(id, {
      source: null,
      buffer: null,
      eq: { low: eqLow, mid: eqMid, high: eqHigh },
      dryGain,
      fx: { filter: fxFilter, delay, delayGain, reverb },
      deckGain,
      output,
      analyser,
      startTime: 0,
      pauseTime: 0,
      loopActive: false,
      loopStart: 0,
      loopEnd: 0,
      hotCues: new Map(),
      bpm: 120,
      gridOffset: 0,
      playbackRate: 1.0,
    });
  }

  // --- Public API called by UI ---

  async loadTrack(deckId: string, url: string) {
    if (!(await this.ensureReady()) || !this.context) return;

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
        isPlaying: false,
      });
    } catch (error) {
      console.error(`Failed to load track on ${deckId}:`, error);
    }
  }

  async play(deckId: string) {
    if (!(await this.ensureReady()) || !this.context) return;

    const deck = this.decks.get(deckId);
    if (
      !deck ||
      !deck.buffer ||
      useAudioStore.getState().decks[deckId].isPlaying
    )
      return;

    // Create new source node (they are one-time use)
    deck.source = this.context.createBufferSource();
    deck.source.buffer = deck.buffer;

    // PHASE 6: Apply loop settings if active
    if (deck.loopActive && deck.loopEnd > deck.loopStart) {
      deck.source.loop = true;
      deck.source.loopStart = deck.loopStart;
      deck.source.loopEnd = deck.loopEnd;
    }

    // PHASE 8: Apply playback rate (for sync)
    deck.source.playbackRate.value = deck.playbackRate;

    // Route: source -> filter -> gain
    if (DEBUG_BYPASS_FX) {
      deck.source.connect(deck.deckGain);
    } else {
      deck.source.connect(deck.eq.low);
    }

    // Calculate start time
    deck.startTime = this.context.currentTime - deck.pauseTime;
    deck.source.start(0, deck.pauseTime);

    useAudioStore.getState().setDeckState(deckId, { isPlaying: true });

    if (DEBUG_AUDIO) {
      console.log(
        `[AudioEngine] play(${deckId}) gain=${deck.deckGain.gain.value.toFixed(2)}`,
      );
      setTimeout(() => {
        try {
          const rms = this.getRMS(deckId);
          console.log(`[AudioEngine] RMS(${deckId})=${rms.toFixed(3)}`);
        } catch {
          // ignore debug log errors
        }
      }, 250);
    }
  }

  async pause(deckId: string) {
    if (!(await this.ensureReady()) || !this.context) return;

    const deck = this.decks.get(deckId);
    if (!deck || !deck.source) return;

    deck.source.stop();
    // Calculate where we stopped
    deck.pauseTime = this.context.currentTime - deck.startTime;
    deck.source = null;

    useAudioStore.getState().setDeckState(deckId, { isPlaying: false });
  }

  /**
   * PHASE 5: Seek to specific time in track
   * Restarts playback from the specified position
   */
  async seek(deckId: string, time: number) {
    if (!(await this.ensureReady()) || !this.context) return;

    const deck = this.decks.get(deckId);
    if (!deck || !deck.buffer) return;

    const wasPlaying = useAudioStore.getState().decks[deckId].isPlaying;

    // Stop current playback if playing
    if (deck.source) {
      deck.source.stop();
      deck.source = null;
    }

    // Clamp time to valid range
    const clampedTime = Math.max(0, Math.min(time, deck.buffer.duration));
    deck.pauseTime = clampedTime;

    // If was playing, restart from new position
    if (wasPlaying) {
      this.play(deckId);
    }
  }

  async setVolume(deckId: string, value: number) {
    if (!(await this.ensureReady()) || !this.context) return;

    const deck = this.decks.get(deckId);
    if (deck) {
      // Smooth transition to prevent clicking
      deck.deckGain.gain.setTargetAtTime(value, this.context.currentTime, 0.01);
      useAudioStore.getState().setDeckState(deckId, { volume: value });
    }
  }

  async setMasterVolume(value: number) {
    if (!(await this.ensureReady()) || !this.context || !this.masterGain)
      return;
    const vol = Math.max(0, Math.min(1, value));
    this.masterGain.gain.setTargetAtTime(vol, this.context.currentTime, 0.01);
    if (DEBUG_AUDIO) {
      console.log(`[AudioEngine] Master volume=${vol.toFixed(2)}`);
    }
  }

  async setFilter(deckId: string, x: number, y: number) {
    if (!(await this.ensureReady()) || !this.context) return;

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
    deck.fx.filter.frequency.setTargetAtTime(frequency, currentTime, rampTime);
    deck.fx.filter.Q.setTargetAtTime(q, currentTime, rampTime);
  }

  async setEQ(
    deckId: "deckA" | "deckB",
    eq: { low?: number; mid?: number; high?: number },
  ) {
    if (!(await this.ensureReady()) || !this.context) return;
    const deck = this.decks.get(deckId);
    if (!deck) return;

    const clamp = (val: number) => Math.max(-12, Math.min(12, val));
    if (eq.low !== undefined) deck.eq.low.gain.value = clamp(eq.low);
    if (eq.mid !== undefined) deck.eq.mid.gain.value = clamp(eq.mid);
    if (eq.high !== undefined) deck.eq.high.gain.value = clamp(eq.high);

    if (DEBUG_AUDIO) {
      console.log(
        `[AudioEngine] EQ ${deckId} low=${deck.eq.low.gain.value.toFixed(1)} mid=${deck.eq.mid.gain.value.toFixed(1)} high=${deck.eq.high.gain.value.toFixed(1)}`,
      );
    }
  }

  async setFX(
    deckId: "deckA" | "deckB",
    type: "delay" | "reverb" | "filter",
    amount: number,
  ) {
    if (!(await this.ensureReady()) || !this.context) return;
    const deck = this.decks.get(deckId);
    if (!deck) return;

    const clamped = Math.max(0, Math.min(1, amount));
    switch (type) {
      case "delay": {
        const min = 0;
        const max = 0.5; // 500ms
        deck.fx.delay.delayTime.value = min + (max - min) * clamped;
        deck.fx.delayGain.gain.value = clamped;
        break;
      }
      case "reverb": {
        deck.fx.reverb.gain.value = clamped;
        break;
      }
      case "filter": {
        const minFreq = 200;
        const maxFreq = 20000;
        const freq = minFreq * Math.pow(maxFreq / minFreq, clamped);
        deck.fx.filter.frequency.setTargetAtTime(
          freq,
          this.context.currentTime,
          0.02,
        );
        break;
      }
    }

    if (DEBUG_AUDIO) {
      console.log(`[AudioEngine] FX ${deckId} ${type}=${clamped.toFixed(2)}`);
    }
  }

  async setCrossfader(position: number) {
    if (!(await this.ensureReady()) || !this.context) return;

    const pos = Math.max(0, Math.min(1, position));
    const deckA = this.decks.get("deckA");
    const deckB = this.decks.get("deckB");
    if (!deckA || !deckB) return;

    // Equal-power curve
    const gainA = Math.cos(pos * 0.5 * Math.PI);
    const gainB = Math.cos((1 - pos) * 0.5 * Math.PI);

    const store = useAudioStore.getState();
    const volA = store.decks?.deckA?.volume ?? deckA.deckGain.gain.value;
    const volB = store.decks?.deckB?.volume ?? deckB.deckGain.gain.value;

    deckA.deckGain.gain.setTargetAtTime(
      volA * gainA,
      this.context.currentTime,
      0.01,
    );
    deckB.deckGain.gain.setTargetAtTime(
      volB * gainB,
      this.context.currentTime,
      0.01,
    );

    if (DEBUG_AUDIO) {
      console.log(
        `[AudioEngine] Crossfader pos=${pos.toFixed(2)} gainA=${gainA.toFixed(2)} gainB=${gainB.toFixed(2)}`,
      );
    }
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

  // PHASE 6: Loop System Methods

  /**
   * Set loop points for a deck
   * @param deckId - Deck identifier
   * @param start - Loop start time in seconds
   * @param end - Loop end time in seconds (optional, calculates 4-beat loop if not provided)
   */
  setLoop(deckId: string, start: number, end?: number) {
    if (!this.context) {
      console.error("AudioEngine not initialized");
      return;
    }

    const deck = this.decks.get(deckId);
    if (!deck || !deck.buffer) return;

    // If end not provided, calculate 4-beat loop
    // Assume 120 BPM: 0.5s per beat * 4 = 2s loop
    // Or use duration/16 as fallback for shorter tracks
    if (end === undefined) {
      const defaultLoopLength = Math.min(2.0, deck.buffer.duration / 16);
      end = start + defaultLoopLength;
    }

    // Clamp to valid range
    deck.loopStart = Math.max(0, start);
    deck.loopEnd = Math.min(end, deck.buffer.duration);

    console.log(
      `Loop set: ${deck.loopStart.toFixed(2)}s - ${deck.loopEnd.toFixed(2)}s`,
    );
  }

  /**
   * Activate loop on a deck
   */
  enableLoop(deckId: string) {
    const deck = this.decks.get(deckId);
    if (!deck) return;

    deck.loopActive = true;

    // If playing, restart with loop enabled
    const isPlaying = useAudioStore.getState().decks[deckId].isPlaying;
    if (isPlaying) {
      this.pause(deckId);
      this.play(deckId);
    }

    console.log(`Loop enabled on ${deckId}`);
  }

  /**
   * Deactivate loop on a deck
   */
  disableLoop(deckId: string) {
    const deck = this.decks.get(deckId);
    if (!deck) return;

    deck.loopActive = false;

    // If playing, restart without loop
    const isPlaying = useAudioStore.getState().decks[deckId].isPlaying;
    if (isPlaying) {
      this.pause(deckId);
      this.play(deckId);
    }

    console.log(`Loop disabled on ${deckId}`);
  }

  /**
   * Check if loop is active
   */
  isLoopActive(deckId: string): boolean {
    const deck = this.decks.get(deckId);
    return deck ? deck.loopActive : false;
  }

  // PHASE 6: Hot Cue System Methods

  /**
   * Set a hot cue at current playback position
   * @param deckId - Deck identifier
   * @param index - Cue index (1-4)
   */
  setHotCue(deckId: string, index: number) {
    if (!this.context) {
      console.error("AudioEngine not initialized");
      return;
    }

    const deck = this.decks.get(deckId);
    if (!deck || !deck.buffer) return;

    // Calculate current playback position
    const currentTime =
      this.context.currentTime - deck.startTime + deck.pauseTime;
    const clampedTime = Math.max(
      0,
      Math.min(currentTime, deck.buffer.duration),
    );

    deck.hotCues.set(index, clampedTime);
    console.log(`Hot cue ${index} set at ${clampedTime.toFixed(2)}s`);
  }

  /**
   * Trigger a hot cue (jump to cue point)
   * @param deckId - Deck identifier
   * @param index - Cue index (1-4)
   */
  triggerHotCue(deckId: string, index: number) {
    if (!this.context) {
      console.error("AudioEngine not initialized");
      return;
    }

    const deck = this.decks.get(deckId);
    if (!deck || !deck.buffer) return;

    // If cue exists, jump to it
    if (deck.hotCues.has(index)) {
      const cueTime = deck.hotCues.get(index)!;
      this.seek(deckId, cueTime);
      console.log(`Hot cue ${index} triggered: ${cueTime.toFixed(2)}s`);
    } else {
      // If cue doesn't exist, set it at current position
      this.setHotCue(deckId, index);
    }
  }

  /**
   * Delete a hot cue
   * @param deckId - Deck identifier
   * @param index - Cue index (1-4)
   */
  deleteHotCue(deckId: string, index: number) {
    const deck = this.decks.get(deckId);
    if (!deck) return;

    deck.hotCues.delete(index);
    console.log(`Hot cue ${index} deleted`);
  }

  /**
   * Check if a hot cue is set
   * @param deckId - Deck identifier
   * @param index - Cue index (1-4)
   */
  hasHotCue(deckId: string, index: number): boolean {
    const deck = this.decks.get(deckId);
    return deck ? deck.hotCues.has(index) : false;
  }

  // PHASE 8: BPM & Sync Methods

  /**
   * Set BPM and grid offset for a deck (called after BPM detection)
   * @param deckId - Deck identifier
   * @param bpm - Detected tempo
   * @param gridOffset - Time of first beat in seconds
   */
  setBPM(deckId: string, bpm: number, gridOffset: number = 0) {
    const deck = this.decks.get(deckId);
    if (!deck) return;

    deck.bpm = bpm;
    deck.gridOffset = gridOffset;
    console.log(
      `🎵 ${deckId} BPM set: ${bpm} (offset: ${gridOffset.toFixed(3)}s)`,
    );
  }

  /**
   * Get BPM for a deck
   */
  getBPM(deckId: string): number {
    const deck = this.decks.get(deckId);
    return deck ? deck.bpm : 120;
  }

  /**
   * Get grid offset for a deck
   */
  getGridOffset(deckId: string): number {
    const deck = this.decks.get(deckId);
    return deck ? deck.gridOffset : 0;
  }

  /**
   * Get playback rate for a deck
   */
  getPlaybackRate(deckId: string): number {
    const deck = this.decks.get(deckId);
    return deck ? deck.playbackRate : 1.0;
  }

  /**
   * Get loaded track duration (seconds) for a deck
   */
  getDuration(deckId: string): number {
    const deck = this.decks.get(deckId);
    return deck?.buffer?.duration ?? 0;
  }

  /**
   * Start recording master output using MediaRecorder.
   */
  startRecording(): boolean {
    if (!this.context || !this.mediaDestination) return false;
    try {
      const stream = this.mediaDestination.stream;
      this.recordedChunks = [];
      this.recorder = new MediaRecorder(stream);
      this.recorder.ondataavailable = (evt) => {
        if (evt.data.size > 0) this.recordedChunks.push(evt.data);
      };
      this.recorder.start();
      return true;
    } catch (error) {
      console.error("[AudioEngine] Failed to start recording:", error);
      return false;
    }
  }

  /**
   * Stop recording and return a Blob.
   */
  stopRecording(): Promise<Blob | null> {
    return new Promise((resolve) => {
      if (!this.recorder) {
        resolve(null);
        return;
      }
      this.recorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: "audio/webm" });
        this.recorder = null;
        this.recordedChunks = [];
        resolve(blob);
      };
      this.recorder.stop();
    });
  }

  debugDeckNode(deckId: string) {
    const deck = this.decks.get(deckId);
    if (!deck) return null;
    return {
      eq: {
        low: deck.eq.low.gain.value,
        mid: deck.eq.mid.gain.value,
        high: deck.eq.high.gain.value,
      },
      fx: {
        delayTime: deck.fx.delay.delayTime.value,
        delayGain: deck.fx.delayGain.gain.value,
        reverbGain: deck.fx.reverb.gain.value,
        filterFreq: deck.fx.filter.frequency.value,
      },
      deckGain: deck.deckGain.gain.value,
      outputGain: deck.output.gain.value,
    };
  }

  /**
   * Sync source deck to target deck's tempo
   * @param sourceDeckId - Deck to adjust
   * @param targetDeckId - Deck to match
   */
  sync(sourceDeckId: string, targetDeckId: string) {
    if (!this.context) {
      console.error("AudioEngine not initialized");
      return;
    }

    const sourceDeck = this.decks.get(sourceDeckId);
    const targetDeck = this.decks.get(targetDeckId);

    if (!sourceDeck || !targetDeck) {
      console.error("Invalid deck IDs for sync");
      return;
    }

    if (targetDeck.bpm === 0 || sourceDeck.bpm === 0) {
      console.warn("Cannot sync: BPM not detected for one or both decks");
      return;
    }

    // Calculate playback rate to match target BPM
    const playbackRate = targetDeck.bpm / sourceDeck.bpm;
    sourceDeck.playbackRate = playbackRate;

    // Apply to source node if playing
    if (sourceDeck.source) {
      sourceDeck.source.playbackRate.setTargetAtTime(
        playbackRate,
        this.context.currentTime,
        0.05, // 50ms smooth transition
      );
    }

    console.log(
      `🔄 Sync: ${sourceDeckId} (${sourceDeck.bpm} BPM) -> ${targetDeckId} (${targetDeck.bpm} BPM)`,
    );
    console.log(`   Playback rate: ${playbackRate.toFixed(3)}x`);

    // BONUS: Phase alignment (align beats)
    this.alignPhase(sourceDeckId, targetDeckId);
  }

  /**
   * Align beats between two decks (phase matching)
   * @param sourceDeckId - Deck to adjust
   * @param targetDeckId - Deck to match
   */
  private alignPhase(sourceDeckId: string, targetDeckId: string) {
    if (!this.context) return;

    const sourceDeck = this.decks.get(sourceDeckId);
    const targetDeck = this.decks.get(targetDeckId);

    if (!sourceDeck || !targetDeck || !sourceDeck.buffer || !targetDeck.buffer)
      return;

    // Calculate current playback positions
    const sourceTime =
      this.context.currentTime - sourceDeck.startTime + sourceDeck.pauseTime;
    const targetTime =
      this.context.currentTime - targetDeck.startTime + targetDeck.pauseTime;

    // Calculate beat positions relative to grid
    const sourceBeatLength = 60 / sourceDeck.bpm;
    const targetBeatLength = 60 / targetDeck.bpm;

    const sourcePhase = (sourceTime - sourceDeck.gridOffset) % sourceBeatLength;
    const targetPhase = (targetTime - targetDeck.gridOffset) % targetBeatLength;

    // Calculate phase difference
    const phaseDiff = targetPhase - sourcePhase;

    // If phase difference is significant, nudge the source deck
    if (Math.abs(phaseDiff) > 0.05) {
      // 50ms threshold
      const nudgeAmount = phaseDiff / sourceDeck.playbackRate;
      const newPauseTime = sourceDeck.pauseTime + nudgeAmount;

      // Restart playback at aligned position
      if (useAudioStore.getState().decks[sourceDeckId].isPlaying) {
        this.pause(sourceDeckId);
        sourceDeck.pauseTime = newPauseTime;
        this.play(sourceDeckId);
        console.log(
          `   Phase aligned: nudged ${(nudgeAmount * 1000).toFixed(0)}ms`,
        );
      }
    }
  }

  /**
   * Reset playback rate to normal (unsync)
   * @param deckId - Deck identifier
   */
  unsync(deckId: string) {
    if (!this.context) {
      console.error("AudioEngine not initialized");
      return;
    }

    const deck = this.decks.get(deckId);
    if (!deck) return;

    deck.playbackRate = 1.0;

    // Apply to source node if playing
    if (deck.source) {
      deck.source.playbackRate.setTargetAtTime(
        1.0,
        this.context.currentTime,
        0.05,
      );
    }

    console.log(`🔄 Unsync: ${deckId} reset to 1.0x`);
  }
}

// Singleton instance holder
class AudioEngineSingleton {
  private static instance: AudioEngine;

  public static getInstance(): AudioEngine {
    if (!AudioEngineSingleton.instance) {
      if (typeof window === "undefined") {
        throw new Error("AudioEngine cannot be instantiated on the server");
      }
      AudioEngineSingleton.instance = new AudioEngine();
    }
    return AudioEngineSingleton.instance;
  }
}

// Export a helper, not the class instance directly
export const getAudioEngine = () => AudioEngineSingleton.getInstance();

// Helper to ensure the engine is initialized before use (call from user gestures)
let initializationPromise: Promise<boolean> | null = null;
export async function ensureAudioEngineReady(): Promise<AudioEngine> {
  const engine = getAudioEngine();

  if (engine.state === "Uninitialized") {
    initializationPromise = initializationPromise ?? engine.initialize();
    await initializationPromise;
    console.log("[AudioEngine] Initialized");
  } else if (engine.state === "Initializing" && initializationPromise) {
    await initializationPromise;
  }

  if (engine.context && engine.context.state === "suspended") {
    await engine.context.resume();
  }

  return engine;
}
