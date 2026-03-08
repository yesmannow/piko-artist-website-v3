'use client';

import { useState, useCallback } from 'react';
import type { DeckId } from './useWebAudio';
import type { TrackMeta, StemKey } from './tracks';
import { getStemUrl } from './tracks';
import { DeckPanel } from './DeckPanel';
import { CenterMixer } from './CenterMixer';
import { TrackLibrary } from './TrackLibrary';
import { useWebAudio } from './useWebAudio';

export function PerformanceView() {
  const audio = useWebAudio();
  const [trackA, setTrackA] = useState<TrackMeta | null>(null);
  const [trackB, setTrackB] = useState<TrackMeta | null>(null);
  const [bufferA, setBufferA] = useState<AudioBuffer | null>(null);
  const [bufferB, setBufferB] = useState<AudioBuffer | null>(null);
  const [volA, setVolA] = useState(0.8);
  const [volB, setVolB] = useState(0.8);

  const loadTrack = useCallback(async (deckId: DeckId, track: TrackMeta) => {
    if (deckId === 'A') setTrackA(track);
    else setTrackB(track);

    await audio.loadTrack(deckId, track.url);

    // We need to grab the buffer after decode — fetch and decode directly for canvas display
    const resp = await fetch(track.url);
    const ab = await resp.arrayBuffer();
    const ctx = new AudioContext();
    const buf = await ctx.decodeAudioData(ab);
    ctx.close();
    if (deckId === 'A') setBufferA(buf);
    else setBufferB(buf);
  }, [audio]);

  const loadStems = useCallback(async (deckId: DeckId) => {
    const track = deckId === 'A' ? trackA : trackB;
    if (!track?.stemsDir) return;
    const stemKeys: StemKey[] = ['vocals', 'drums', 'bass', 'other'];
    const stemUrls: Record<StemKey, string> = {} as Record<StemKey, string>;
    for (const key of stemKeys) {
      const url = getStemUrl(track.stemsDir, key);
      if (url) stemUrls[key] = url;
    }
    await audio.loadStems(deckId, stemUrls);
  }, [audio, trackA, trackB]);

  const [queue, setQueue] = useState<TrackMeta[]>([]);

  const addToQueue = useCallback((track: TrackMeta) => {
    setQueue(prev => [...prev, track]);
    // Optional: add a toast or visual feedback
  }, []);

  const deckAState = audio.state.deckA;
  const deckBState = audio.state.deckB;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Mixer area */}
      <div className="flex gap-2 px-3 py-3 flex-shrink-0" style={{ minHeight: 0 }}>
        {/* Deck A */}
        <div className="flex-1" style={{ minWidth: 0 }}>
          <DeckPanel
            deckId="A"
            track={trackA}
            buffer={bufferA}
            isPlaying={deckAState.isPlaying}
            stemMutes={Object.fromEntries(
              Object.entries(deckAState.stems).map(([k, v]) => [k, v?.muted ?? true])
            ) as Record<StemKey, boolean>}
            hasStemsLoaded={deckAState.hasStemsLoaded}
            hasStemsAvailable={!!trackA?.stemsDir}
            onPlay={() => audio.play('A')}
            onPause={() => audio.pause('A')}
            onCue={() => {}}
            onEqChange={(band, val) => audio.setEQ('A', band, val)}
            onVolumeChange={(val) => { setVolA(val); audio.setVolume('A', val); }}
            onStemToggle={(stem) => audio.toggleStem('A', stem)}
            onLoadStems={() => loadStems('A')}
            volume={volA}
          />
        </div>

        {/* Center Mixer */}
        <div style={{ width: 140, flexShrink: 0 }}>
          <CenterMixer
            crossfade={audio.state.crossfade}
            onCrossfadeChange={audio.setCrossfade}
          />
        </div>

        {/* Deck B */}
        <div className="flex-1" style={{ minWidth: 0 }}>
          <DeckPanel
            deckId="B"
            track={trackB}
            buffer={bufferB}
            isPlaying={deckBState.isPlaying}
            stemMutes={Object.fromEntries(
              Object.entries(deckBState.stems).map(([k, v]) => [k, v?.muted ?? true])
            ) as Record<StemKey, boolean>}
            hasStemsLoaded={deckBState.hasStemsLoaded}
            hasStemsAvailable={!!trackB?.stemsDir}
            onPlay={() => audio.play('B')}
            onPause={() => audio.pause('B')}
            onCue={() => {}}
            onEqChange={(band, val) => audio.setEQ('B', band, val)}
            onVolumeChange={(val) => { setVolB(val); audio.setVolume('B', val); }}
            onStemToggle={(stem) => audio.toggleStem('B', stem)}
            onLoadStems={() => loadStems('B')}
            volume={volB}
          />
        </div>
      </div>

      {/* Library */}
      <TrackLibrary
        loadedA={trackA}
        loadedB={trackB}
        onLoadTrack={loadTrack}
        onAddToQueue={addToQueue}
      />
    </div>
  );
}
