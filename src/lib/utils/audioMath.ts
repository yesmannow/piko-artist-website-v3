export const beatsToSeconds = (beats: number, bpm: number): number => (60 * beats) / bpm;

export const calculateNewBpm = (originalBpm: number, pitchChange: number): number =>
  originalBpm * (1 + pitchChange);

export const dbToLinear = (db: number): number => Math.pow(10, db / 20);

export const getCrossfadeGains = (position: number) => ({
  gainA: Math.cos(position * 0.5 * Math.PI),
  gainB: Math.sin(position * 0.5 * Math.PI),
});

export const freqToMidi = (freq: number): number => 12 * Math.log2(freq / 440) + 69;
