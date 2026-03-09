import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as Tone from 'tone';
import { useDeckStore } from '@/store/deckStore';
import { useMixerStore } from '@/store/mixerStore';
import { AudioEngine, SlipModeManager } from '@/lib/audioEngine';
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
  
  const deckFx = deckId === 'A' ? mixerState.fxA : mixerState.fxB;
  const fxNodesRef = useRef<Tone.ToneAudioNode[]>([]);
  const prevActiveFxIdsRef = useRef('');

  const slipManagerRef = useRef<SlipModeManager>(new SlipModeManager());
  
  const pauseTimeRef = useRef<number>(0);
  const currentTimeRef = useRef<number>(0);
  const lastContextTimeRef = useRef<number>(0);
  const animationRef = useRef<number | null>(null);
  const isCuePlayRef = useRef(false);
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
          setStoreTime(deckId, newTime);
          if (deckState.slipMode) {
             setGhostTime(slipManagerRef.current.getGhostPosition(now, 1.0));
          }
          
          if (newTime >= deckState.buffer.duration) {
             if (isCuePlayRef.current) isCuePlayRef.current = false;
             togglePlay(deckId);
             pauseTimeRef.current = 0;
             currentTimeRef.current = 0;
             setCurrentTime(0);
             setStoreTime(deckId, 0);
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
      // It was playing normally. Snap back to cuePoint and stop.
      togglePlay(deckId);
      
      let targetTime = deckState.cuePoint;
      targetTime = getQuantizedTime(targetTime, deckState.track.bpm ? Number(deckState.track.bpm) : undefined);
      
      pauseTimeRef.current = targetTime;
      currentTimeRef.current = targetTime;
      setCurrentTime(targetTime);
      setStoreTime(deckId, targetTime);
      
      if (navigator.vibrate) navigator.vibrate(5);
    } else {
      // Pause or Stutter logic
      // According to prompt: Start playback instantly from the current cuePoint
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
    if (isCuePlayRef.current) {
      isCuePlayRef.current = false;
      // "Cup" Move check: if they pressed standard play while holding CUE, togglePlay would have flipped state to false.
      // Wait, standard play button calls `enhancedTogglePlay` which does NOT flip state (it handles Cup Move).
      // If it's still playing, it means the user DID NOT press Standard Play (or they pressed it, but Cup Move intercepted).
      // Let's rely on standard CDJ: CUE released = stop playback, return to cuePoint.
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
