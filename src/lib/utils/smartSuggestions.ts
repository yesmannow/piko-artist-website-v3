// naive suggestion engine: uses BPM and energy to recommend next track and FX chain
export type TrackMeta = { id: string; bpm: number; key?: string; energy?: number; };

export function suggestNextTrack(current: TrackMeta, library: TrackMeta[]) {
  // prefer tracks within +/- 4 BPM and similar energy
  const candidates = library
    .map(t => ({ t, score: Math.abs(t.bpm - current.bpm) + Math.abs((t.energy ?? 0) - (current.energy ?? 0)) }))
    .sort((a,b) => a.score - b.score)
    .slice(0,5)
    .map(x => x.t);
  return candidates;
}

export function suggestFxChain(current: TrackMeta) {
  // simple mapping
  if ((current.energy ?? 50) > 65) return ['Filter Highpass 1/2', 'Delay 1/4', 'Reverb small'];
  if ((current.energy ?? 50) < 40) return ['Reverb long', 'Delay 1/2'];
  return ['Filter Lowpass 1/4', 'Delay 1/8'];
}

type MinimalEngine = {
  setTempo: (deckId: string, bpm: number) => Promise<void>;
  setCrossfadeCurve: (curve: string) => Promise<void> | void;
  applyFxChain: (deckId: string, chain: string[]) => Promise<void> | void;
};

export async function oneClickMix(deckA: TrackMeta, deckB: TrackMeta, audioEngine: MinimalEngine) {
  // align BPM (simple ratio), set crossfade curve, apply subtle filter
  const targetBpm = deckA.bpm;
  await audioEngine.setTempo(deckB.id, targetBpm);
  await audioEngine.setCrossfadeCurve('smooth');
  await audioEngine.applyFxChain(deckB.id, suggestFxChain(deckB));
  return true;
}
