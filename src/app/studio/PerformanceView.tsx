import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { TrackLibrary } from './TrackLibrary';
import { CenterMixer } from './CenterMixer';
import { DeckPanel } from './DeckPanel';
import { useWebAudio, type DeckId } from './useWebAudio';
import { type TrackMeta, type StemKey, getStemUrl } from './tracks';
import { generateFingerprint, lookupMetadata } from '@/lib/acoustid';
import { saveVerifiedMetadata } from '@/db/studioDb';

export function PerformanceView() {
  const audio = useWebAudio();
  const [trackA, setTrackA] = useState<TrackMeta | null>(null);
  const [trackB, setTrackB] = useState<TrackMeta | null>(null);
  const [bufferA, setBufferA] = useState<AudioBuffer | null>(null);
  const [bufferB, setBufferB] = useState<AudioBuffer | null>(null);
  const [volA, setVolA] = useState(0.8);
  const [volB, setVolB] = useState(0.8);
  const [isLibraryCollapsed, setIsLibraryCollapsed] = useState(false);

  const loadTrack = useCallback(async (deckId: DeckId, track: TrackMeta) => {
    if (deckId === 'A') setTrackA(track);
    else setTrackB(track);

    await audio.loadTrack(deckId, track);

    // AcoustID Intelligence: Automated fingerprinting on load
    const resp = await fetch(track.url);
    const ab = await resp.arrayBuffer();
    const ctx = new AudioContext();
    const buf = await ctx.decodeAudioData(ab);
    ctx.close();

    if (deckId === 'A') setBufferA(buf);
    else setBufferB(buf);

    // Metadata Intelligence lookup
    const { duration, fingerprint } = await generateFingerprint(buf);
    const verified = await lookupMetadata(duration, fingerprint);
    if (verified) {
      await saveVerifiedMetadata({
        trackId: track.id,
        ...verified,
        verifiedAt: Date.now(),
      });
    }
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

  const addToQueue = useCallback((track: TrackMeta) => {
    console.log('Add to queue:', track.title);
  }, []);

  const deckAState = audio.state.deckA;
  const deckBState = audio.state.deckB;

  return (
    <div className="flex flex-col h-full bg-[#0a0a0c] overflow-hidden">
      {/* Decks Row */}
      <div className="flex gap-4 p-4 flex-1 items-stretch min-h-0 bg-[#0a0a0c]">
        {/* Deck A */}
        <motion.div 
          className="flex-1" 
          style={{ minWidth: 0, transformOrigin: 'left center' }}
          animate={{ scale: isLibraryCollapsed ? 1.05 : 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
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
        </motion.div>

        {/* Center Mixer */}
        <div style={{ width: 140, flexShrink: 0 }}>
          <CenterMixer
            crossfade={audio.state.crossfade}
            onCrossfadeChange={audio.setCrossfade}
            isHarmonicMatch={audio.state.isHarmonicMatch}
          />
        </div>

        {/* Deck B */}
        <motion.div 
          className="flex-1" 
          style={{ minWidth: 0, transformOrigin: 'right center' }}
          animate={{ scale: isLibraryCollapsed ? 1.05 : 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
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
        </motion.div>
      </div>

      {/* Library */}
      <div 
        className="transition-all duration-500 ease-vault overflow-hidden border-t border-white/5"
        style={{ height: isLibraryCollapsed ? '48px' : '40%' }}
      >
        <TrackLibrary
          loadedA={trackA}
          loadedB={trackB}
          onLoadTrack={loadTrack}
          onAddToQueue={addToQueue}
          isCollapsed={isLibraryCollapsed}
          onToggleCollapse={() => setIsLibraryCollapsed(!isLibraryCollapsed)}
        />
      </div>
    </div>
  );
}

