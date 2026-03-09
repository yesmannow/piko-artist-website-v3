import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as Tone from 'tone';
import { useDeckStore } from '@/store/deckStore';
import { useMixerStore } from '@/store/mixerStore';
import { AudioEngine, SlipModeManager, DeckRoutingNodes, SibilanceTamerNodes, SubGeneratorNodes } from '@/lib/audioEngine';
import { ScheduleEvent } from '@/workers/automationWorker';

export function useDeckAudio(deckId: 'A' | 'B') {
  const deckState = useDeckStore((state) => deckId === 'A' ? state.deckA : state.deckB);
  const { togglePlay, setVolume, setCurrentTime: setStoreTime, setCuePoint } = useDeckStore();
  
  const mixerState = useMixerStore();
  const eqState = deckId === 'A' ? mixerState.eqA : mixerState.eqB;
  const crossfader = mixerState.crossfader;
  const quantizeActive = mixerState.quantizeActive;
  const crossfaderReverse = mixerState.crossfaderReverse;
  
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const eqChainRef = useRef<ReturnType<AudioEngine['createEQChain']> | null>(null);

  // Phase 8: Deck routing (3-path stem crossover + echo tail)
  const deckRoutingRef = useRef<DeckRoutingNodes | null>(null);
  // Phase 8: Asymmetric DSP nodes
  const sibilanceTamerRef = useRef<SibilanceTamerNodes | null>(null);
  const subGeneratorRef  = useRef<SubGeneratorNodes | null>(null);
  
  const deckFx = deckId === 'A' ? mixerState.fxA : mixerState.fxB;
  const fxNodesRef = useRef<Tone.ToneAudioNode[]>([]);
  const prevActiveFxIdsRef = useRef('');

  const slipManagerRef = useRef<SlipModeManager>(new SlipModeManager());
  
  const pauseTimeRef = useRef<number>(0);
  const currentTimeRef = useRef<number>(0);
  const lastContextTimeRef = useRef<number>(0);
  const animationRef = useRef<number | null>(null);
  const isCuePlayRef = useRef(false);
  // Snap-back: position saved when CUE is pressed while playing
  const snapBackPositionRef = useRef<number | null>(null);
  const playbackRateRef = useRef(1.0);
  const workerRef = useRef<Worker | null>(null);

  // Keep playbackRateRef synced without triggering effects that depend on it
  useEffect(() => {
    playbackRateRef.current = deckState.playbackRate;
  }, [deckState.playbackRate]);
  
  const [currentTime, setCurrentTime] = useState(0);
  const [ghostTime, setGhostTime] = useState(0);

  // Helper for quantization
  const getQuantizedTime = useCallback((time: number, bpm: number | undefined) => {
    if (!quantizeActive || !bpm || bpm <= 0) return time;
    // 1 beat = 60 / bpm seconds. 1/16th note = 1/4 beat
    const beatDuration = 60 / bpm;
    const sixteenthDuration = beatDuration / 4;
    return Math.round(time / sixteenthDuration) * sixteenthDuration;
  }, [quantizeActive]);

  useEffect(() => {
    if (!workerRef.current) {
      workerRef.current = new Worker(new URL('@/workers/automationWorker', import.meta.url), { type: 'module' });
      workerRef.current.onmessage = (e) => {
        if (e.data.type === 'SCHEDULE_EVENTS') {
          const events = e.data.events;
          const engine = AudioEngine.getInstance();
          events.forEach((ev: ScheduleEvent) => {
            if (ev.param === 'volume' && gainRef.current) {
               const scheduleTime = engine.context.currentTime + Math.max(0, ev.time - currentTimeRef.current);
               gainRef.current.gain.linearRampToValueAtTime(
                 engine.getLogarithmicGain(ev.value) * (deckId === 'A' ? Math.cos(((crossfader + 1)/2) * 0.5 * Math.PI) : Math.sin(((crossfader + 1)/2) * 0.5 * Math.PI)),
                 scheduleTime
               );
            }
          });
        }
      };
    }
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, [crossfader, deckId]);

  useEffect(() => {
    if (workerRef.current && deckState.track) {
      workerRef.current.postMessage({
        type: 'SYNC',
        currentTime: currentTimeRef.current,
        automations: deckState.track.automation || []
      });
    }
  }, [deckState.track, deckState.track?.automation]);

  useEffect(() => {
    const engine = AudioEngine.getInstance();
    
    if (!gainRef.current) {
      gainRef.current = engine.context.createGain();
      eqChainRef.current = engine.createEQChain();
      
      // Register the gain node so AudioEngine can route automation curves
      engine.registerDeckGain(deckId, gainRef.current);

      // Phase 8: Build the 3-path deck routing and wire it between EQ and master gain
      const routing = engine.createDeckRouting();
      deckRoutingRef.current = routing;

      // Connect EQ output → deck routing input (each filter reads from EQ output)
      eqChainRef.current.output.connect(routing.vocFilter);
      eqChainRef.current.output.connect(routing.drumFilter);
      eqChainRef.current.output.connect(routing.instFilter);

      // Phase 8: Asymmetric DSP — topology differs per deck to avoid signal doubling
      if (deckId === 'A') {
        // Sibilance Tamer in-series: routing.output → tamer → gainRef
        // When inactive, the peaking filter (gain=0 dB) is transparent and the
        // compressor passes audio unmodified — no bypass path needed.
        const tamer = engine.createSibilanceTamer();
        sibilanceTamerRef.current = tamer;
        routing.output.connect(tamer.input);
        tamer.output.connect(gainRef.current);
      } else {
        // Sub Generator in-parallel: routing.output → gainRef (dry path, always on)
        // plus routing.output → subGen → gainRef (wet blend, gain=0 when inactive).
        // Parallel topology preserves full-spectrum audio while blending sub harmonics.
        routing.output.connect(gainRef.current);
        const subGen = engine.createSubGenerator();
        subGeneratorRef.current = subGen;
        routing.output.connect(subGen.input);
        subGen.output.connect(gainRef.current);
      }

      // Connect Gain to master node
      engine.connectToMaster(gainRef.current);
    }

    if (gainRef.current) {
      // Calculate final volume based on deck volume and crossfader (Trigonometric & Reversible)
      const { gainA, gainB } = engine.getEqualPowerGains(crossfader, crossfaderReverse);
      const crossfaderGain = deckId === 'A' ? gainA : gainB;
      // Logarithmic taper
      gainRef.current.gain.value = engine.getLogarithmicGain(deckState.volume) * crossfaderGain;
    }
    
    if (eqChainRef.current) {
      // Logarithmic taper for EQs
      const mapEQ = (val: number) => {
        const logVal = Math.sign(val) * Math.pow(Math.abs(val), 2);
        return logVal < 0 ? logVal * 24 : logVal * 6;
      };
      eqChainRef.current.low.gain.value = mapEQ(eqState.low);
      eqChainRef.current.mid.gain.value = mapEQ(eqState.mid);
      eqChainRef.current.high.gain.value = mapEQ(eqState.high);
    }
  }, [deckState.volume, crossfader, eqState, deckId, crossfaderReverse]);

  const activeFxIds = useMemo(() => deckFx.filter(f => f.enabled).map(f => f.id).join(','), [deckFx]);

  useEffect(() => {
    if (!eqChainRef.current || !gainRef.current) return;
    const engine = AudioEngine.getInstance();

    const activeFx = deckFx.filter(f => f.enabled);

    if (activeFxIds !== prevActiveFxIdsRef.current) {
        fxNodesRef.current.forEach(node => {
            node.disconnect();
            node.dispose();
        });
        try { eqChainRef.current.output.disconnect(); } catch {}

        if (activeFx.length === 0) {
            eqChainRef.current.output.connect(gainRef.current);
            fxNodesRef.current = [];
        } else {
            fxNodesRef.current = activeFx.map(fxDef => engine.createFxNode(fxDef.type, fxDef.params));
            Tone.connect(eqChainRef.current.output as unknown as any, fxNodesRef.current[0]);
            for(let i=0; i<fxNodesRef.current.length-1; i++) {
                fxNodesRef.current[i].connect(fxNodesRef.current[i+1]);
            }
            Tone.connect(fxNodesRef.current[fxNodesRef.current.length-1], gainRef.current as unknown as any);
        }
        prevActiveFxIdsRef.current = activeFxIds;
    } else {
        // Apply smooth parameter updates without rebuilding the audio graph
        activeFx.forEach((fxDef, idx) => {
            const node = fxNodesRef.current[idx];
            if (!node) return;
            if (fxDef.type === 'filter' && node.name === 'Filter') {
                const f = node as Tone.Filter;
                f.frequency.rampTo(fxDef.params.cutoff ? fxDef.params.cutoff * 20000 : 20000, 0.05);
                f.Q.rampTo(fxDef.params.resonance ? fxDef.params.resonance * 10 : 0, 0.05);
            } else if (fxDef.type === 'reverb' && node.name === 'Reverb') {
                const r = node as Tone.Reverb;
                r.wet.rampTo(fxDef.params.mix || 0.5, 0.05);
            }
        });
    }
  }, [deckFx, activeFxIds]);

  useEffect(() => {
    // Keep internal slip manager sync'd
    slipManagerRef.current.isActive = deckState.slipMode;
  }, [deckState.slipMode]);

  // Phase 8: Smart-Mute Logic — artifact-free 100 ms stem cuts via scheduled ramp
  useEffect(() => {
    const routing = deckRoutingRef.current;
    if (!routing) return;
    const engine = AudioEngine.getInstance();
    const now = engine.context.currentTime;

    const applyMute = (node: GainNode, active: boolean) => {
      node.gain.cancelScheduledValues(now);
      if (!active) {
        // Mute: fast exponential ramp to near-zero over 100 ms (artifact-free)
        node.gain.setValueAtTime(node.gain.value, now);
        node.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
      } else {
        // Un-mute: short linear ramp up over 50 ms
        node.gain.setValueAtTime(node.gain.value, now);
        node.gain.linearRampToValueAtTime(1.0, now + 0.05);
      }
    };

    applyMute(routing.vocGain,  deckState.stems.vocals);
    applyMute(routing.drumGain, deckState.stems.drums);
    applyMute(routing.instGain, deckState.stems.inst);

    // Post-Mute Echo Tail: briefly open echo send when vocals are silenced
    if (!deckState.stems.vocals) {
      routing.echoSend.gain.cancelScheduledValues(now);
      routing.echoSend.gain.setValueAtTime(0.7, now);
      routing.echoSend.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
    } else {
      routing.echoSend.gain.cancelScheduledValues(now);
      routing.echoSend.gain.setValueAtTime(routing.echoSend.gain.value, now);
      routing.echoSend.gain.linearRampToValueAtTime(0, now + 0.1);
    }
  }, [deckState.stems]);

  // Phase 8: Sibilance Tamer toggle (Deck A only)
  useEffect(() => {
    if (deckId !== 'A' || !sibilanceTamerRef.current) return;
    const active = deckState.sibilanceTamerActive;
    // Activate by boosting the peaking filter (+8 dB) to sensitise the compressor
    sibilanceTamerRef.current.input.gain.value = active ? 8 : 0;
  }, [deckState.sibilanceTamerActive, deckId]);

  // Phase 8: Sub-Generator toggle (Deck B only)
  useEffect(() => {
    if (deckId !== 'B' || !subGeneratorRef.current) return;
    const engine = AudioEngine.getInstance();
    const now = engine.context.currentTime;
    const target = deckState.subGeneratorActive ? 0.4 : 0;
    subGeneratorRef.current.output.gain.cancelScheduledValues(now);
    subGeneratorRef.current.output.gain.setValueAtTime(
      subGeneratorRef.current.output.gain.value, now
    );
    subGeneratorRef.current.output.gain.linearRampToValueAtTime(target, now + 0.05);
  }, [deckState.subGeneratorActive, deckId]);

  useEffect(() => {
    const engine = AudioEngine.getInstance();

    const stopAudio = () => {
      if (sourceRef.current) {
        try {
          sourceRef.current.stop();
        } catch {
          // Ignore if already stopped
        }
        sourceRef.current.disconnect();
        sourceRef.current = null;
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };

    const playAudio = async () => {
      if (!deckState.buffer || !gainRef.current || !eqChainRef.current) return;
      
      await engine.resume();
      
      stopAudio();
      
      sourceRef.current = engine.context.createBufferSource();
      sourceRef.current.buffer = deckState.buffer;
      
      // Connect source to EQ input
      sourceRef.current.connect(eqChainRef.current.input);
      
      // Slip Mode ghost update or Snap-Back check
      let startPos = pauseTimeRef.current;
      
      if (deckState.slipMode && slipManagerRef.current.isActive) {
        // Did we resume from Slip paused? The ghost playhead has been moving.
        if (slipManagerRef.current.getGhostPosition(engine.context.currentTime, 1.0) > 0) {
            startPos = slipManagerRef.current.getGhostPosition(engine.context.currentTime, 1.0);
            if (startPos > deckState.buffer.duration) startPos = deckState.buffer.duration;
            setCurrentTime(startPos);
            setStoreTime(deckId, startPos);
            currentTimeRef.current = startPos;
        } else {
            slipManagerRef.current.startGhost(engine.context.currentTime, startPos);
        }
      } else {
         slipManagerRef.current.startGhost(engine.context.currentTime, startPos);
      }

      sourceRef.current.start(0, startPos);
      sourceRef.current.playbackRate.value = playbackRateRef.current || 1.0;
      
      currentTimeRef.current = startPos;
      lastContextTimeRef.current = engine.context.currentTime;
      
      const updateTime = () => {
        if (deckState.isPlaying && deckState.buffer && sourceRef.current) {
          const now = engine.context.currentTime;
          const delta = now - lastContextTimeRef.current;
          lastContextTimeRef.current = now;
          
          const newTime = currentTimeRef.current + delta * sourceRef.current.playbackRate.value;
          currentTimeRef.current = newTime;
          setCurrentTime(newTime);

          const newGhostTime = deckState.slipMode
            ? slipManagerRef.current.getGhostPosition(now, 1.0)
            : newTime;
          if (deckState.slipMode) {
            setGhostTime(newGhostTime);
          }

          // Zero-lag telemetry: write to store without extra React subscription overhead
          useDeckStore.getState().updateTelemetry(deckId, {
            currentTime: newTime,
            ghostTime: newGhostTime,
          });
          
          if (newTime >= deckState.buffer.duration) {
             if (isCuePlayRef.current) isCuePlayRef.current = false;
             if (snapBackPositionRef.current !== null) snapBackPositionRef.current = null;
             togglePlay(deckId);
             pauseTimeRef.current = 0;
             currentTimeRef.current = 0;
             setCurrentTime(0);
             useDeckStore.getState().updateTelemetry(deckId, { currentTime: 0, ghostTime: 0 });
          } else {
             if (workerRef.current) {
               workerRef.current.postMessage({
                 type: 'GET_SCHEDULE',
                 currentTime: newTime,
                 lookahead: 0.1
               });
             }
             animationRef.current = requestAnimationFrame(updateTime);
          }
        }
      };
      
      animationRef.current = requestAnimationFrame(updateTime);
    };

    if (deckState.isPlaying) {
      playAudio();
    } else {
      if (sourceRef.current) {
        pauseTimeRef.current = currentTimeRef.current;
      }
      stopAudio();
    }

    return () => {
      stopAudio();
    };
  }, [deckState.isPlaying, deckState.buffer, deckId, togglePlay, setStoreTime, deckState.slipMode]);

  // Apply pitch fader adjustments live
  useEffect(() => {
    if (sourceRef.current && deckState.isPlaying) {
      sourceRef.current.playbackRate.setTargetAtTime(
        deckState.playbackRate, 
        AudioEngine.getInstance().context.currentTime, 
        0.05
      );
    }
  }, [deckState.playbackRate, deckState.isPlaying]);

  // Reset pause time when a new track is loaded
  useEffect(() => {
    pauseTimeRef.current = 0;
    currentTimeRef.current = 0;
    setCuePoint(deckId, 0);
    const timer = setTimeout(() => setCurrentTime(0), 0);
    return () => clearTimeout(timer);
  }, [deckState.track, deckId, setCuePoint]);

  const scrubTrack = useCallback((timeDelta: number) => {
    if (!deckState.buffer) return;
    
    if (!deckState.isPlaying) {
      let newTime = pauseTimeRef.current + timeDelta;
      newTime = Math.max(0, Math.min(newTime, deckState.buffer.duration));
      pauseTimeRef.current = newTime;
      currentTimeRef.current = newTime;
      setCurrentTime(newTime);
    } else {
      if (sourceRef.current) {
        const rate = deckState.playbackRate + (timeDelta * 10); 
        sourceRef.current.playbackRate.setTargetAtTime(
          Math.max(0.1, Math.min(3.0, rate)), 
          AudioEngine.getInstance().context.currentTime, 
          0.05
        );
      }
    }
  }, [deckState.buffer, deckState.isPlaying, deckState.playbackRate]);

  const endScrub = useCallback(() => {
    if (sourceRef.current && deckState.isPlaying) {
      sourceRef.current.playbackRate.setTargetAtTime(
        deckState.playbackRate || 1.0, 
        AudioEngine.getInstance().context.currentTime, 
        0.1
      );
    }
  }, [deckState.isPlaying, deckState.playbackRate]);

  // CDJ-style tactical transport logic
  const handleCueDown = useCallback(() => {
    if (!deckState.track || !deckState.buffer) return;
    
    if (deckState.isPlaying && !isCuePlayRef.current) {
      // STUTTER: save pre-press position for snap-back, jump to cuePoint, continue playing
      snapBackPositionRef.current = currentTimeRef.current;
      
      let targetTime = deckState.cuePoint;
      targetTime = getQuantizedTime(targetTime, deckState.track.bpm ? Number(deckState.track.bpm) : undefined);
      
      pauseTimeRef.current = targetTime;
      currentTimeRef.current = targetTime;
      setCurrentTime(targetTime);
      setStoreTime(deckId, targetTime);
      
      // Restart audio from cue point while keeping playback active
      togglePlay(deckId);
      setTimeout(() => togglePlay(deckId), 0);
      
      if (navigator.vibrate) navigator.vibrate(5);
    } else {
      // CUP mode: while paused, holding CUE plays from cue point
      let targetTime = deckState.cuePoint;
      targetTime = getQuantizedTime(targetTime, deckState.track.bpm ? Number(deckState.track.bpm) : undefined);
      
      pauseTimeRef.current = targetTime;
      currentTimeRef.current = targetTime;
      setCurrentTime(targetTime);
      setStoreTime(deckId, targetTime);
      
      isCuePlayRef.current = true;
      if (!deckState.isPlaying) {
         togglePlay(deckId); // engage audio
      }
    }
  }, [deckState.track, deckState.buffer, deckState.isPlaying, deckState.cuePoint, togglePlay, deckId, setStoreTime, getQuantizedTime]);

  const handleCueUp = useCallback(() => {
    if (snapBackPositionRef.current !== null) {
      // SNAP-BACK: return to the position that was active before CUE was pressed
      const snapPos = snapBackPositionRef.current;
      snapBackPositionRef.current = null;
      
      pauseTimeRef.current = snapPos;
      currentTimeRef.current = snapPos;
      setCurrentTime(snapPos);
      setStoreTime(deckId, snapPos);
      
      // Restart playing from snap-back position
      togglePlay(deckId);
      setTimeout(() => togglePlay(deckId), 0);
      
      if (navigator.vibrate) navigator.vibrate(5);
    } else if (isCuePlayRef.current) {
      // CUP mode release: stop playback and return to cue point
      isCuePlayRef.current = false;
      if (deckState.isPlaying) {
         togglePlay(deckId); // stop playing
         let targetTime = deckState.cuePoint;
         targetTime = getQuantizedTime(targetTime, deckState.track?.bpm ? Number(deckState.track.bpm) : undefined);
         
         pauseTimeRef.current = targetTime;
         currentTimeRef.current = targetTime;
         setCurrentTime(targetTime);
         setStoreTime(deckId, targetTime);
      }
    }
  }, [deckState.isPlaying, deckState.cuePoint, deckState.track, togglePlay, deckId, setStoreTime, getQuantizedTime]);

  // Handle standard PLAY/PAUSE toggles (integrates "Cup" Move logic)
  const enhancedTogglePlay = useCallback(() => {
    if (isCuePlayRef.current) {
       // "Cup" move! They pressed standard play while holding CUE.
       // The track is now playing "normally", so we clear the flag, and DO NOT stop it.
       isCuePlayRef.current = false;
       return;
    }
    
    // Set CUE point if pausing playback exactly where we are
    if (deckState.isPlaying) {
        setCuePoint(deckId, currentTimeRef.current);
    }
    
    togglePlay(deckId);
  }, [deckId, togglePlay, deckState.isPlaying, setCuePoint]);
  
  // Expose triggerSlipSnapBack for Slicer/Performance Pads integration
  const triggerSlipSnapBack = useCallback(() => {
    if (!deckState.slipMode || !deckState.isPlaying) return;
    const engine = AudioEngine.getInstance();
    const ghostPos = slipManagerRef.current.getGhostPosition(engine.context.currentTime, 1.0);
    
    snapBackPositionRef.current = null;
    pauseTimeRef.current = ghostPos;
    currentTimeRef.current = ghostPos;
    setCurrentTime(ghostPos);
    setStoreTime(deckId, ghostPos);
    
    // We toggle playback twice identically to force the useDeckAudio effect to restart the buffer from pauseTimeRef seamlessly
    togglePlay(deckId);
    setTimeout(() => togglePlay(deckId), 0);
    
    if (navigator.vibrate) navigator.vibrate(5);
  }, [deckState.slipMode, deckState.isPlaying, togglePlay, deckId, setStoreTime]);

  return {
    currentTime,
    ghostTime,
    deckState,
    duration: deckState.duration,
    isPlaying: deckState.isPlaying,
    isLoading: deckState.isLoading,
    track: deckState.track,
    togglePlay: enhancedTogglePlay,
    setVolume: (v: number) => setVolume(deckId, v),
    scrubTrack,
    endScrub,
    handleCueDown,
    handleCueUp,
    triggerSlipSnapBack,
    getQuantizedTime
  };
}
