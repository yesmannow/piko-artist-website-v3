import Dexie, { Table } from 'dexie';

export interface Track {
  id?: number;
  title: string;
  artist: string;
  bpm: string;
  key: string;
  duration: string;
  energy: string;
  hasVocal: boolean;
  fileBlob?: Blob;
  coverArt?: string;
  audioUrl?: string;
  status?: string;
  createdAt: number;
}

export class DJDatabase extends Dexie {
  tracks!: Table<Track, number>;

  constructor() {
    super('DJDatabase');
    this.version(3).stores({
      tracks: '++id, title, artist, bpm, key, audioUrl, coverArt, status',
      trackCues: '++id, trackId, time, label',
      trackLoops: '++id, trackId, start, end'
    });
  }
}

export const db = new DJDatabase();
