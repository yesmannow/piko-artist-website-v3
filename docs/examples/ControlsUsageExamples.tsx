/**
 * Hardware-Emulated Control Components Usage Examples
 *
 * These components use Framer Motion for smooth, high-performance
 * drag interactions with instant audio engine updates.
 */

import { Fader, Knob } from '@/components/studio/ui/controls';
import { useAudioEngine } from '@/hooks/useAudioEngine';
import { useCallback, useState } from 'react';

/**
 * Example 1: Volume Fader with Direct Audio Wiring
 */
export function VolumeFaderExample() {
  const { setDeckVolume } = useAudioEngine();
  const [volume, setVolume] = useState(0.75);

  const handleVolumeChange = useCallback((value: number) => {
    // Update audio engine instantly (bypasses React render)
    setDeckVolume('A', value);

    // Update local state for UI
    setVolume(value);
  }, [setDeckVolume]);

  return (
    <Fader
      label="VOLUME"
      value={volume}
      onChange={handleVolumeChange}
      height={120}
    />
  );
}

/**
 * Example 2: EQ Knob with dB Mapping
 */
export function EQKnobExample() {
  const { setDeckEQ } = useAudioEngine();
  const [eqLow, setEqLow] = useState(0.5); // 0.5 = 0dB (neutral)

  const handleEQChange = useCallback((value: number) => {
    // Map 0-1 range to -12dB to +12dB
    const dbValue = value * 24 - 12;

    // Update audio engine
    setDeckEQ('A', { low: dbValue, mid: 0, high: 0 });

    // Update local state
    setEqLow(value);
  }, [setDeckEQ]);

  return (
    <Knob
      label="LOW"
      value={eqLow}
      onChange={handleEQChange}
      size={60}/>
  );
}

/**
 * Example 3: Filter Knob with Wider Range
 */
export function FilterKnobExample() {
  const { setDeckFilter } = useAudioEngine();
  const [filter, setFilter] = useState(0.5);

  const handleFilterChange = useCallback((value: number) => {
    // Update audio engine (handles lowpass/highpass logic internally)
    setDeckFilter('A', value);

    // Update local state
    setFilter(value);
  }, [setDeckFilter]);

  return (
    <Knob
      label="FILTER"
      value={filter}
      onChange={handleFilterChange}
      size={68}// Wider arc for more precision
    />
  );
}

/**
 * Example 4: Master Gain Knob
 */
export function MasterGainExample() {
  const { setMasterGain } = useAudioEngine();
  const [gain, setGain] = useState(1.0);

  const handleGainChange = useCallback((value: number) => {
    const clampedValue = Math.max(0, Math.min(1, value));

    // Update audio engine
    setMasterGain(clampedValue);

    // Update local state
    setGain(clampedValue);
  }, [setMasterGain]);

  return (
    <Knob
      label="MASTER"
      value={gain}
      onChange={handleGainChange}
      size={70}
    />
  );
}

/**
 * Example 5: FX Send Fader with Percentage Display
 */
export function FXSendExample() {
  const { setDelayWetMix } = useAudioEngine();
  const [send, setSend] = useState(0.0);

  const handleSendChange = useCallback((value: number) => {
    // Update audio engine
    setDelayWetMix(value);

    // Update local state
    setSend(value);
  }, [setDelayWetMix]);

  return (
    <div className="flex flex-col items-center gap-2">
      <Fader
        label="DELAY SEND"
        value={send}
        onChange={handleSendChange}
        height={100}
      />
      <span className="text-xs text-white/60 font-mono">
        {Math.round(send * 100)}%
      </span>
    </div>
  );
}

/**
 * Example 6: Multiple Controls in a Channel Strip
 */
export function ChannelStripExample() {
  const { setDeckVolume, setDeckEQ } = useAudioEngine();
  const [volume, setVolume] = useState(0.8);
  const [eq, setEQ] = useState({ low: 0.5, mid: 0.5, high: 0.5 });

  const handleVolumeChange = useCallback((value: number) => {
    setDeckVolume('A', value);
    setVolume(value);
  }, [setDeckVolume]);

  const handleEQChange = useCallback((band: 'low' | 'mid' | 'high', value: number) => {
    const dbValue = value * 24 - 12;
    const newEQ = { ...eq, [band]: dbValue };

    setDeckEQ('A', newEQ);
    setEQ(prev => ({ ...prev, [band]: value }));
  }, [eq, setDeckEQ]);

  return (
    <div className="flex flex-col items-center gap-4 p-4 bg-obsidian-900/80 rounded-lg">
      <Knob
        label="HIGH"
        value={eq.high}
        onChange={(v) => handleEQChange('high', v)}
        size={56}
      />
      <Knob
        label="MID"
        value={eq.mid}
        onChange={(v) => handleEQChange('mid', v)}
        size={56}
      />
      <Knob
        label="LOW"
        value={eq.low}
        onChange={(v) => handleEQChange('low', v)}
        size={56}
      />
      <Fader
        label="VOLUME"
        value={volume}
        onChange={handleVolumeChange}
        height={150}
      />
    </div>
  );
}

/**
 * Example 7: Tempo Fader with BPM Display
 */
export function TempoFaderExample() {
  const [tempo, setTempo] = useState(0.5); // 0.5 = 1.0x speed
  const minBpm = 60;
  const maxBpm = 180;

  const handleTempoChange = useCallback((value: number) => {
    // Map 0-1 to 0.5x-2.0x speed
    const playbackRate = 0.5 + (value * 1.5);

    // Update your playback rate here
    console.log('Playback rate:', playbackRate);

    setTempo(value);
  }, []);

  const currentBpm = Math.round(minBpm + (tempo * (maxBpm - minBpm)));

  return (
    <div className="flex flex-col items-center gap-2">
      <Fader
        label="TEMPO"
        value={tempo}
        onChange={handleTempoChange}
        height={140}
      />
      <div className="text-center">
        <div className="text-sm font-mono text-accent-color">{currentBpm}</div>
        <div className="text-xs text-white/40">BPM</div>
      </div>
    </div>
  );
}

/**
 * Pro Tips:
 *
 * 1. Always use useCallback for onValueChange handlers to prevent re-renders
 * 2. Update audio engine FIRST, then update local/store state
 * 3. Use requestAnimationFrame for state updates to batch them
 * 4. Clamp values to 0-1 range before passing to audio engine
 * 5. Use CSS variables for consistent theming (--accent-color, etc.)
 * 6. Set appropriate sizes: Knobs 48-70px, Faders height 100-200px
 * 7. For wider rotation arcs, use rotationRange prop (default 270°)
 */


