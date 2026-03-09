import { useEffect, useRef, useState, useCallback } from 'react';
import { useDeckStore } from '@/store/deckStore';
import { useMixerStore } from '@/store/mixerStore';
import { AudioEngine, SlipModeManager } from '@/lib/audioEngine';

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
  const slipManagerRef = useRef<SlipModeManager>(new SlipModeManager());
  
  const pauseTimeRef = useRef<number>(0);
  const currentTimeRef = useRef<number>(0);
  const lastContextTimeRef = useRef<number>(0);
  const animationRef = useRef<number | null>(null);
  const isCuePlayRef = useRef(false);
  
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
    const engine = AudioEngine.getInstance();
    
    if (!gainRef.current) {
      gainRef.current = engine.context.createGain();
      eqChainRef.current = engine.createEQChain();
      
      // Connect EQ output to Gain, Gain to destination
      eqChainRef.current.output.connect(gainRef.current);
      gainRef.current.connect(engine.context.destination);
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
        const rate = 1.0 + timeDelta * 10; 
        sourceRef.current.playbackRate.setTargetAtTime(
          Math.max(0.5, Math.min(2.0, rate)), 
          AudioEngine.getInstance().context.currentTime, 
          0.05
        );
      }
    }
  }, [deckState.buffer, deckState.isPlaying]);

  const endScrub = useCallback(() => {
    if (sourceRef.current && deckState.isPlaying) {
      sourceRef.current.playbackRate.setTargetAtTime(
        1.0, 
        AudioEngine.getInstance().context.currentTime, 
        0.1
      );
    }
  }, [deckState.isPlaying]);

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
