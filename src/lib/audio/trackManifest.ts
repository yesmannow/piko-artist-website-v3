export interface TrackManifestEntry {
  name: string;
  url: string;
  bpm?: string;
  key?: string;
}

export const trackManifest: TrackManifestEntry[] = [
  '12_05.mp3',
  'amor-sincero.mp3',
  'amores-perdidos.mp3',
  'bungalow.mp3',
  'corazon-y-mente.mp3',
  'crussin.mp3',
  'dejate-llevar.mp3',
  'el-don.mp3',
  'entre-humos.mp3',
  'f-7.mp3',
  'Falle.mp3',
  'ganja.mp3',
  'gunster.mp3',
  'im-sorry.mp3',
  'jardin-de-rosas.mp3',
  'los-5.mp3',
  'me-cuentan.mp3',
  'noches-enteras.mp3',
  'party.mp3',
  'quejas.mp3',
  'sentimientos.mp3',
  'sin-rencores.mp3',
  'te-perdi.mp3',
  'te-prometo.mp3',
  'tortas-de-jamon.mp3',
  'un-dia-mas.mp3'
].map(filename => ({
  name: filename,
  url: `/audio/tracks/${filename}`
}));
