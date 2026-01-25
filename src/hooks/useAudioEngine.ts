import { useEffect, useRef, useCallback, useState } from 'react';
import * as Tone from 'tone';
import { useStore } from '../store/useStore';
import { StemDeck, StemUrls } from '../audio/StemDeck';

// Interface for the hook's return value
interface AudioEngineControls {
  initAudio: () => Promise<void>;
  loadTrack: (deck: 'A' | 'B', url: string, bpm: number) => Promise<void>;
  loadStems: (deck: 'A' | 'B', urls: StemUrls, bpm: number) => Promise<void>;
  play: (deck: 'A' | 'B') => void;
  pause: (deck: 'A' | 'B') => void;
  stop: (deck: 'A' | 'B') => void;
  syncToBpm: (deck: 'A' | 'B') => void;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob | null>;
  isRecording: boolean;
  isReady: boolean;
}

export const useAudioEngine = (): AudioEngineControls => {
  // --- REFS: Persistent Audio Graph Storage ---
  // Using refs ensures the audio graph persists across re-renders without dependency loops.
  const isInitialized = useRef(false);
  const stemDecks = useRef<{ A: StemDeck | null; B: StemDeck | null }>({ A: null, B: null });
  const players = useRef<{ A: Tone.Player | null; B: Tone.Player | null }>({ A: null, B: null });
  const channels = useRef<{ A: Tone.Channel | null; B: Tone.Channel | null }>({ A: null, B: null });
  const eqs = useRef<{ A: Tone.EQ3 | null; B: Tone.EQ3 | null }>({ A: null, B: null });
  const filters = useRef<{ A: Tone.Filter | null; B: Tone.Filter | null }>({ A: null, B: null });
  const crossFade = useRef<Tone.CrossFade | null>(null);
  const masterCompressor = useRef<Tone.Compressor | null>(null);
  const masterLimiter = useRef<Tone.Limiter | null>(null);
  const masterMeter = useRef<Tone.Meter | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const recorder = useRef<Tone.Recorder | null>(null);

  // --- STATE ---
  const [isRecording, setIsRecording] = useState(false);

  // Zustand subscriptions for reactive audio updates
  const { masterBpm, crossfader, deckA, deckB, setAudioReady } = useStore();

  // --- INITIALIZATION ---
  useEffect(() => {
    // Guard against Double-Init (React Strict Mode)
    if (isInitialized.current) return;

    console.log('[AudioEngine] Initializing audio graph...');

    // 1. Initialize Master Chain
    // Compressor provides "glue" for the mix
    masterCompressor.current = new Tone.Compressor({
      threshold: -24,
      ratio: 4,
      attack: 0.003,
      release: 0.25
    });
    
    // Limiter prevents clipping at the output
    masterLimiter.current = new Tone.Limiter(-0.1).toDestination();
    masterCompressor.current.connect(masterLimiter.current);
    
    // Meter provides data for the visualizer
    masterMeter.current = new Tone.Meter(); 
    masterLimiter.current.connect(masterMeter.current);

    // Recorder captures the final mix including Master Limiter/Compressor effects
    recorder.current = new Tone.Recorder();
    Tone.getDestination().connect(recorder.current);

    // 2. Initialize Crossfader
    // Tone.CrossFade uses Equal Power fading by default
    crossFade.current = new Tone.CrossFade().connect(masterCompressor.current);

    // 3. Initialize Decks (A & B)
    (['A', 'B'] as const).forEach((deck) => {
      // Player with CORS support for R2
      const player = new Tone.Player({
        onload: () => {
          console.log(`[AudioEngine] Track loaded on Deck ${deck}`);
        },
        onerror: (error) => {
          console.error(`[AudioEngine] Error loading track on Deck ${deck}:`, error);
        }
      });
      
      // CORS handling is done through R2 bucket configuration
      
      // Channel Strip (Gain/Pan/Solo)
      const channel = new Tone.Channel({
        volume: 0, // Unity gain in dB
        pan: 0,    // Center
      });
      
      // EQ (3-Band Isolator)
      const eq = new Tone.EQ3({
        low: 0,
        mid: 0,
        high: 0,
        lowFrequency: 200,
        highFrequency: 2000
      });
      
      // Filter (Low/High Pass)
      // Starting with a wide-open lowpass filter
      const filter = new Tone.Filter({
        frequency: 20000,
        type: "lowpass",
        rolloff: -24
      });

      // Connect the Graph: Player -> EQ -> Filter -> Channel -> CrossFade
      player.chain(eq, filter, channel);
      
      if (deck === 'A') {
        channel.connect(crossFade.current!.a);
      } else {
        channel.connect(crossFade.current!.b);
      }

      // Store References
      players.current[deck] = player;
      channels.current[deck] = channel;
      eqs.current[deck] = eq;
      filters.current[deck] = filter;
    });

    isInitialized.current = true;
    console.log('[AudioEngine] Audio graph initialized successfully');

    // --- SYNC LOOP (requestAnimationFrame) ---
    // This loop pulls transient data for the UI without triggering React renders.
    // TRANSIENT UPDATE PATTERN: This data is read at 60fps but does NOT go through
    // the Zustand store to avoid re-render thrashing. In a production implementation,
    // you would write these values to a separate transient store (using refs or a 
    // dedicated Zustand slice with transient subscriptions) that visualization 
    // components can observe directly.
    const loop = () => {
      if (masterMeter.current) {
        const _level = masterMeter.current.getValue();
        // Future: Update transient store for VU meter
        // transientStore.getState().setMeterLevel(_level);
        
        // Example of what NOT to do (would cause 60 re-renders/sec):
        // useStore.setState({ meterLevel: _level }); // ❌ BAD
      }
      
      // Update playhead positions for both decks
      // Note: Position tracking will be implemented in Phase VII for visualizations
      // (['A', 'B'] as const).forEach(deck => {
      //   const player = players.current[deck];
      //   if (player && player.loaded && player.state === 'started') {
      //     const _position = player.immediate();
      //     // Future: Update transient store for waveform playhead
      //     // transientStore.getState().setDeckPosition(deck, _position);
      //   }
      // });
      
      animationFrameId.current = requestAnimationFrame(loop);
    };
    loop();

    // Copy refs to variables for cleanup
    const playersRef = players.current;
    const stemDecksRef = stemDecks.current;
    const channelsRef = channels.current;
    const eqsRef = eqs.current;
    const filtersRef = filters.current;
    const crossFadeRef = crossFade.current;
    const masterCompressorRef = masterCompressor.current;
    const masterLimiterRef = masterLimiter.current;
    const masterMeterRef = masterMeter.current;
    const recorderRef = recorder.current;

    // Cleanup
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      
      // Dispose of audio nodes in production
      // Note: In strict mode dev, we might not want to dispose immediately 
      // to allow hot-reload, but for production correctness:
      if (!isInitialized.current) {
        (['A', 'B'] as const).forEach(deck => {
          stemDecksRef[deck]?.dispose();
          playersRef[deck]?.dispose();
          channelsRef[deck]?.dispose();
          eqsRef[deck]?.dispose();
          filtersRef[deck]?.dispose();
        });
        crossFadeRef?.dispose();
        masterCompressorRef?.dispose();
        masterLimiterRef?.dispose();
        masterMeterRef?.dispose();
        recorderRef?.dispose();
      }
    };
  }, []); // Empty deps - run once


  // --- REACTIVE UPDATES (Zustand -> Tone.js) ---
  
  // Update Crossfader
  useEffect(() => {
    if (crossFade.current) {
      // Map -1 (Left/A) to 1 (Right/B) range from UI to 0-1 range for Tone.js
      // The fade uses an Equal Power curve internally in Tone.js:
      // Channel A gain = cos(fade * π/2)
      // Channel B gain = sin(fade * π/2)
      // This ensures G_A² + G_B² = 1 (constant power)
      const normalizedValue = (crossfader + 1) / 2; 
      
      // Ramp to avoid zipper noise on rapid fader movement
      crossFade.current.fade.rampTo(normalizedValue, 0.1);
    }
  }, [crossfader]);

  // Update Playback Rates (BPM Sync)
  useEffect(() => {
    (['A', 'B'] as const).forEach(deck => {
      const player = players.current[deck];
      const deckState = deck === 'A' ? deckA : deckB;
      
      if (player && deckState.trackData && player.loaded) {
        // SYNC LOGIC: PlaybackRate = Master BPM / Track BPM
        // This maintains rhythmic alignment across both decks
        const newRate = masterBpm / deckState.trackData.bpm;
        
        // Apply the new rate
        // Note: This affects both pitch and tempo until Phase VI time-stretching
        player.playbackRate = newRate;
      }
    });
  }, [masterBpm, deckA, deckB]);

  // Update Deck Volumes
  useEffect(() => {
    const channelA = channels.current.A;
    if (channelA) {
      // Convert 0-1 linear to dB (max 0dB, min -60dB)
      const volumeDb = deckA.volume > 0 
        ? 20 * Math.log10(deckA.volume) 
        : -Infinity;
      channelA.volume.rampTo(volumeDb, 0.05);
    }
  }, [deckA.volume]);

  useEffect(() => {
    const channelB = channels.current.B;
    if (channelB) {
      const volumeDb = deckB.volume > 0 
        ? 20 * Math.log10(deckB.volume) 
        : -Infinity;
      channelB.volume.rampTo(volumeDb, 0.05);
    }
  }, [deckB.volume]);

  // Update Deck EQ
  useEffect(() => {
    const eqA = eqs.current.A;
    if (eqA) {
      eqA.low.rampTo(deckA.eq.low, 0.05);
      eqA.mid.rampTo(deckA.eq.mid, 0.05);
      eqA.high.rampTo(deckA.eq.high, 0.05);
    }
  }, [deckA.eq]);

  useEffect(() => {
    const eqB = eqs.current.B;
    if (eqB) {
      eqB.low.rampTo(deckB.eq.low, 0.05);
      eqB.mid.rampTo(deckB.eq.mid, 0.05);
      eqB.high.rampTo(deckB.eq.high, 0.05);
    }
  }, [deckB.eq]);

  // Update Deck Filters
  useEffect(() => {
    const filterA = filters.current.A;
    if (filterA) {
      // Filter value could be frequency (20-20000Hz) or dry/wet mix
      // For now, treating as frequency
      filterA.frequency.rampTo(deckA.filter || 20000, 0.05);
    }
  }, [deckA.filter]);

  useEffect(() => {
    const filterB = filters.current.B;
    if (filterB) {
      filterB.frequency.rampTo(deckB.filter || 20000, 0.05);
    }
  }, [deckB.filter]);

  // Update Stem Muting (Phase VI)
  useEffect(() => {
    const stemDeck = stemDecks.current.A;
    if (stemDeck) {
      stemDeck.toggleStem('vocals', deckA.stems.vocals);
      stemDeck.toggleStem('inst', deckA.stems.inst);
    }
  }, [deckA.stems]);

  useEffect(() => {
    const stemDeck = stemDecks.current.B;
    if (stemDeck) {
      stemDeck.toggleStem('vocals', deckB.stems.vocals);
      stemDeck.toggleStem('inst', deckB.stems.inst);
    }
  }, [deckB.stems]);


  // --- CONTROLS EXPOSED TO UI ---

  // Initialize Audio Context (Mobile Unlock)
  // This MUST be called in a synchronous user event handler (click, touch)
  // to satisfy browser autoplay policies, especially on iOS Safari
  const initAudio = useCallback(async () => {
    if (Tone.context.state !== 'running') {
      console.log('[AudioEngine] Starting Tone.js context...');
      await Tone.start();
      console.log('[AudioEngine] Tone.js context state:', Tone.context.state);
    }
    setAudioReady(true);
  }, [setAudioReady]);

  // Load Track from R2
  const loadTrack = useCallback(async (deck: 'A' | 'B', url: string, bpm: number) => {
    const player = players.current[deck];
    if (!player) {
      console.error(`[AudioEngine] Player for deck ${deck} not initialized`);
      return;
    }

    try {
      console.log(`[AudioEngine] Loading track on Deck ${deck}:`, url);
      await player.load(url);
      
      // Calculate and apply initial sync rate
      const syncRate = masterBpm / bpm;
      player.playbackRate = syncRate;
      
      console.log(`[AudioEngine] Track loaded successfully on Deck ${deck}, sync rate: ${syncRate}`);
    } catch (error) {
      console.error(`[AudioEngine] Failed to load track on Deck ${deck}:`, error);
    }
  }, [masterBpm]);

  // Load Stems from R2 (Phase VI)
  const loadStems = useCallback(async (deck: 'A' | 'B', urls: StemUrls, bpm: number) => {
    // Initialize StemDeck if not already created
    if (!stemDecks.current[deck]) {
      const destination = deck === 'A' ? crossFade.current!.a : crossFade.current!.b;
      
      // Mute the regular player but keep it in the graph
      const player = players.current[deck];
      if (player) {
        player.volume.value = -Infinity;
      }
      
      // Create new StemDeck connected directly to the crossfader input
      // The StemDeck has its own internal channel
      stemDecks.current[deck] = new StemDeck(deck, destination);
      
      console.log(`[AudioEngine] Created StemDeck for Deck ${deck}`);
    }
    
    const stemDeck = stemDecks.current[deck];
    if (!stemDeck) {
      console.error(`[AudioEngine] StemDeck for deck ${deck} not initialized`);
      return;
    }

    try {
      console.log(`[AudioEngine] Loading stems on Deck ${deck}:`, urls);
      await stemDeck.load(urls);
      
      // Calculate and apply initial sync rate
      const syncRate = masterBpm / bpm;
      stemDeck.setPlaybackRate(syncRate);
      
      console.log(`[AudioEngine] Stems loaded successfully on Deck ${deck}, sync rate: ${syncRate}`);
    } catch (error) {
      console.error(`[AudioEngine] Failed to load stems on Deck ${deck}:`, error);
    }
  }, [masterBpm]);

  // Play a deck
  const play = useCallback((deck: 'A' | 'B') => {
    const stemDeck = stemDecks.current[deck];
    const player = players.current[deck];
    
    // Start Transport if not already running (global state management)
    if (Tone.Transport.state !== 'started') {
      Tone.Transport.start();
      console.log('[AudioEngine] Transport started');
    }
    
    // Prioritize StemDeck if available (Phase VI)
    if (stemDeck && stemDeck.isLoaded()) {
      stemDeck.unmute(); // Unmute the stems for playback
      stemDeck.play();
      console.log(`[AudioEngine] Playing Deck ${deck} (Stems)`);
    } else if (player && player.loaded && player.state !== 'started') {
      player.start();
      console.log(`[AudioEngine] Playing Deck ${deck}`);
    }
  }, []);

  // Pause a deck
  const pause = useCallback((deck: 'A' | 'B') => {
    const stemDeck = stemDecks.current[deck];
    const player = players.current[deck];
    
    // Prioritize StemDeck if available (Phase VI)
    if (stemDeck && stemDeck.isLoaded()) {
      stemDeck.pause(); // Mute the deck without stopping Transport
      console.log(`[AudioEngine] Paused Deck ${deck} (Stems)`);
    } else if (player && player.state === 'started') {
      player.stop();
      console.log(`[AudioEngine] Paused Deck ${deck}`);
    }
    
    // Stop Transport only if both decks are paused/stopped
    const otherDeck = deck === 'A' ? 'B' : 'A';
    const otherStemDeck = stemDecks.current[otherDeck];
    const otherPlayer = players.current[otherDeck];
    
    const isOtherDeckPlaying = (otherStemDeck && otherStemDeck.isLoaded()) 
      || (otherPlayer && otherPlayer.state === 'started');
    
    if (!isOtherDeckPlaying && Tone.Transport.state === 'started') {
      Tone.Transport.pause();
      console.log('[AudioEngine] Transport paused (all decks stopped)');
    }
  }, []);

  // Stop and reset a deck
  const stop = useCallback((deck: 'A' | 'B') => {
    const stemDeck = stemDecks.current[deck];
    const player = players.current[deck];
    
    // Prioritize StemDeck if available (Phase VI)
    if (stemDeck && stemDeck.isLoaded()) {
      stemDeck.stop();
      stemDeck.seek(0);
      console.log(`[AudioEngine] Stopped Deck ${deck} (Stems)`);
    } else if (player) {
      player.stop();
      player.seek(0);
      console.log(`[AudioEngine] Stopped Deck ${deck}`);
    }
    
    // Stop Transport only if both decks are stopped
    const otherDeck = deck === 'A' ? 'B' : 'A';
    const otherStemDeck = stemDecks.current[otherDeck];
    const otherPlayer = players.current[otherDeck];
    
    const isOtherDeckPlaying = (otherStemDeck && otherStemDeck.isLoaded()) 
      || (otherPlayer && otherPlayer.state === 'started');
    
    if (!isOtherDeckPlaying) {
      Tone.Transport.stop();
      Tone.Transport.seconds = 0;
      console.log('[AudioEngine] Transport stopped (all decks stopped)');
    }
  }, []);

  // Sync a deck to the master BPM
  const syncToBpm = useCallback((deck: 'A' | 'B') => {
    const stemDeck = stemDecks.current[deck];
    const player = players.current[deck];
    const deckState = deck === 'A' ? deckA : deckB;
    
    if (!deckState.trackData) return;
    
    const newRate = masterBpm / deckState.trackData.bpm;
    
    // Prioritize StemDeck if available (Phase VI)
    if (stemDeck && stemDeck.isLoaded()) {
      stemDeck.setPlaybackRate(newRate);
      console.log(`[AudioEngine] Synced Deck ${deck} (Stems) to ${masterBpm} BPM, rate: ${newRate}`);
    } else if (player && player.loaded) {
      player.playbackRate = newRate;
      console.log(`[AudioEngine] Synced Deck ${deck} to ${masterBpm} BPM, rate: ${newRate}`);
    }
  }, [masterBpm, deckA, deckB]);

  // Start Recording
  const startRecording = useCallback(async () => {
    // Mobile Safari protection: Ensure context is running
    if (Tone.context.state !== 'running') {
      await Tone.start();
    }

    if (recorder.current && recorder.current.state !== 'started') {
      recorder.current.start();
      setIsRecording(true);
      console.log('🎙️ Studio Recording Started');
    }
  }, []);

  // Stop Recording
  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    if (recorder.current && recorder.current.state === 'started') {
      const blob = await recorder.current.stop();
      setIsRecording(false);
      console.log(`💾 Capture Complete: ${blob.type}, Size: ${blob.size}`);
      return blob;
    }
    return null;
  }, []);

  return {
    initAudio,
    loadTrack,
    loadStems,
    play,
    pause,
    stop,
    syncToBpm,
    startRecording,
    stopRecording,
    isRecording,
    isReady: isInitialized.current
  };
};
