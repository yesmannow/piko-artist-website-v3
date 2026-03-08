// Static track manifest for the DJ Mixer Studio
// All tracks from /public/audio/tracks/

export interface TrackMeta {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  key: string;
  duration: string; // mm:ss
  url: string;
  stemsDir?: string; // path prefix for stems
  artwork?: string; // URL to the artwork image
}

const ARTWORK_IMAGES = [
  '/images/tracks/abstract-1846847_1280.jpg',
  '/images/tracks/architecture-3189972_1280.jpg',
  '/images/tracks/aurora-borealis-9267515_1280.jpg',
  '/images/tracks/background-1833056_1280.jpg',
  '/images/tracks/bicycle-3045580_1280.jpg',
  '/images/tracks/dj-2581269_1280.jpg',
  '/images/tracks/gong-8255081_1280.jpg',
  '/images/tracks/graffiti-1476119_1280.jpg',
  '/images/tracks/graffiti-3750912_1280.jpg',
  '/images/tracks/hamburg-2718329_1280.jpg',
  '/images/tracks/love-2724141_1280.png',
  '/images/tracks/skateboard-447147_1280.jpg',
  '/images/tracks/skull-and-crossbones-414207_1280.jpg',
  '/images/tracks/starry-sky-1655503_1280.jpg',
  '/images/tracks/street-art-1499524_1280.jpg',
  '/images/tracks/tube-7260586_1280.jpg',
  '/images/tracks/vinyl-1595847_1280.jpg',
  '/images/tracks/wall-2583885_1280.jpg',
  '/images/tracks/wallpaper-5928106_1280.png',
  '/images/tracks/woman-3633737_1280.jpg'
];

export const TRACKS: TrackMeta[] = [
  { id: 'amor-sincero', title: 'Amor Sincero', artist: 'Piko', bpm: 110, key: '4A', duration: '4:12', url: '/audio/tracks/amor-sincero.mp3', stemsDir: '/audio/stems/amor', artwork: ARTWORK_IMAGES[0] },
  { id: 'amores-perdidos', title: 'Amores Perdidos', artist: 'Piko', bpm: 95, key: '6A', duration: '3:48', url: '/audio/tracks/amores-perdidos.mp3', artwork: ARTWORK_IMAGES[1] },
  { id: 'bungalow', title: 'Bungalow', artist: 'Piko', bpm: 102, key: '8B', duration: '3:55', url: '/audio/tracks/bungalow.mp3', artwork: ARTWORK_IMAGES[2] },
  { id: 'corazon-y-mente', title: 'Corazón y Mente', artist: 'Piko', bpm: 98, key: '5A', duration: '4:02', url: '/audio/tracks/corazon-y-mente.mp3', artwork: ARTWORK_IMAGES[3] },
  { id: 'crussin', title: 'Crussin', artist: 'Piko', bpm: 105, key: '7B', duration: '3:30', url: '/audio/tracks/crussin.mp3', artwork: ARTWORK_IMAGES[4] },
  { id: 'dejate-llevar', title: 'Déjate Llevar', artist: 'Piko', bpm: 92, key: '3A', duration: '4:20', url: '/audio/tracks/dejate-llevar.mp3', artwork: ARTWORK_IMAGES[5] },
  { id: 'el-don', title: 'El Don', artist: 'Piko', bpm: 88, key: '9A', duration: '3:58', url: '/audio/tracks/el-don.mp3', artwork: ARTWORK_IMAGES[6] },
  { id: 'entre-humos', title: 'Entre Humos', artist: 'Piko', bpm: 96, key: '11A', duration: '4:10', url: '/audio/tracks/entre-humos.mp3', artwork: ARTWORK_IMAGES[7] },
  { id: 'f-7', title: 'F-7', artist: 'Piko', bpm: 120, key: '2B', duration: '3:15', url: '/audio/tracks/f-7.mp3', artwork: ARTWORK_IMAGES[8] },
  { id: 'falle', title: 'Fallé', artist: 'Piko', bpm: 93, key: '4B', duration: '3:44', url: '/audio/tracks/falle.mp3', artwork: ARTWORK_IMAGES[9] },
  { id: 'ganja', title: 'Ganja', artist: 'Piko', bpm: 78, key: '6B', duration: '4:35', url: '/audio/tracks/ganja.mp3', artwork: ARTWORK_IMAGES[10] },
  { id: 'gunster', title: 'Gunster', artist: 'Piko', bpm: 140, key: '1A', duration: '3:05', url: '/audio/tracks/gunster.mp3', artwork: ARTWORK_IMAGES[11] },
  { id: 'im-sorry', title: "I'm Sorry", artist: 'Piko', bpm: 72, key: '10A', duration: '4:48', url: '/audio/tracks/im-sorry.mp3', artwork: ARTWORK_IMAGES[12] },
  { id: 'jardin-de-rosas', title: 'Jardín de Rosas', artist: 'Piko', bpm: 118, key: '5B', duration: '4:22', url: '/audio/tracks/jardin-de-rosas.mp3', stemsDir: '/audio/stems/jardin', artwork: ARTWORK_IMAGES[13] },
  { id: 'los-5', title: 'Los 5', artist: 'Piko', bpm: 100, key: '8A', duration: '3:50', url: '/audio/tracks/los-5.mp3', artwork: ARTWORK_IMAGES[14] },
  { id: 'me-cuentan', title: 'Me Cuentan', artist: 'Piko', bpm: 86, key: '12A', duration: '4:08', url: '/audio/tracks/me-cuentan.mp3', artwork: ARTWORK_IMAGES[15] },
  { id: 'noches-enteras', title: 'Noches Enteras', artist: 'Piko', bpm: 84, key: '7A', duration: '4:28', url: '/audio/tracks/noches-enteras.mp3', artwork: ARTWORK_IMAGES[16] },
  { id: 'party', title: 'Party', artist: 'Piko', bpm: 128, key: '2A', duration: '3:22', url: '/audio/tracks/party.mp3', artwork: ARTWORK_IMAGES[17] },
  { id: 'quejas', title: 'Quejas', artist: 'Piko', bpm: 90, key: '10B', duration: '3:58', url: '/audio/tracks/quejas.mp3', artwork: ARTWORK_IMAGES[18] },
  { id: 'sentimientos', title: 'Sentimientos', artist: 'Piko', bpm: 80, key: '1B', duration: '4:15', url: '/audio/tracks/sentimientos.mp3', artwork: ARTWORK_IMAGES[19] },
  { id: 'sin-rencores', title: 'Sin Rencores', artist: 'Piko', bpm: 97, key: '3B', duration: '4:05', url: '/audio/tracks/sin-rencores.mp3', artwork: ARTWORK_IMAGES[0] },
  { id: 'te-perdi', title: 'Te Perdí', artist: 'Piko', bpm: 76, key: '9B', duration: '4:40', url: '/audio/tracks/te-perdi.mp3', artwork: ARTWORK_IMAGES[1] },
  { id: 'te-prometo', title: 'Te Prometo', artist: 'Piko', bpm: 89, key: '11B', duration: '3:52', url: '/audio/tracks/te-prometo.mp3', artwork: ARTWORK_IMAGES[2] },
  { id: 'tortas-de-jamon', title: 'Tortas de Jamón', artist: 'Piko', bpm: 112, key: '12B', duration: '3:35', url: '/audio/tracks/tortas-de-jamon.mp3', artwork: ARTWORK_IMAGES[3] },
  { id: 'un-dia-mas', title: 'Un Día Más', artist: 'Piko', bpm: 104, key: '6A', duration: '4:02', url: '/audio/tracks/un-dia-mas.mp3', artwork: ARTWORK_IMAGES[4] },
  { id: '12_05', title: '12:05', artist: 'Piko', bpm: 115, key: '4A', duration: '3:18', url: '/audio/tracks/12_05.mp3', artwork: ARTWORK_IMAGES[5] },
];

export type StemKey = 'vocals' | 'drums' | 'bass' | 'other';

export const STEM_FILES: Record<StemKey, string> = {
  vocals: 'vocals',
  drums: 'drums',
  bass: 'bass',
  other: 'other',
};

export function getStemUrl(stemsDir: string, stem: StemKey): string | null {
  // Find the actual file by matching stem key prefix in the public/audio/stems dir
  // For amor: amor-sincero-vocals-E minor-110bpm-440hz.mp3
  // For jardin: jardin-de-rosas-vocals-B minor-118bpm-440hz.mp3
  const dirName = stemsDir.split('/').pop();
  if (dirName === 'amor') {
    const names: Record<StemKey, string> = {
      vocals: 'amor-sincero-vocals-E minor-110bpm-440hz.mp3',
      drums: 'amor-sincero-drums-E minor-110bpm-440hz.mp3',
      bass: 'amor-sincero-bass-E minor-110bpm-440hz.mp3',
      other: 'amor-sincero-other-E minor-110bpm-440hz.mp3',
    };
    return `${stemsDir}/${names[stem]}`;
  }
  if (dirName === 'jardin') {
    const names: Record<StemKey, string> = {
      vocals: 'jardin-de-rosas-vocals-B minor-118bpm-440hz.mp3',
      drums: 'jardin-de-rosas-drums-B minor-118bpm-440hz.mp3',
      bass: 'jardin-de-rosas-bass-B minor-118bpm-440hz.mp3',
      other: 'jardin-de-rosas-other-B minor-118bpm-440hz.mp3',
    };
    return `${stemsDir}/${names[stem]}`;
  }
  return null;
}
