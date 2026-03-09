import { create } from 'zustand';
import { db, Track } from '@/lib/db';
import { trackManifest } from '@/lib/audio/trackManifest';
import { studioTrackImages } from '@/lib/studioTrackImages';
import { analyzeAudioBuffer } from '@/hooks/analysis/useEssentiaAnalysis';
import { generateFingerprint, lookupMetadata } from '@/lib/acoustid';
import toast from 'react-hot-toast';

interface LibraryState {
  tracks: Track[];
  processingTracks: { id: string; name: string }[];
  loadTracks: () => Promise<void>;
  addTrack: (file: File) => Promise<void>;
  seedLibrary: () => Promise<void>;
}

// Removed mockAnalysis

// Helper to get AudioBuffer
const getAudioBuffer = async (fileOrUrl: File | string): Promise<AudioBuffer> => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  let arrayBuffer: ArrayBuffer;
  
  if (typeof fileOrUrl === 'string') {
    const res = await fetch(fileOrUrl);
    arrayBuffer = await res.arrayBuffer();
  } else {
    arrayBuffer = await (fileOrUrl as File).arrayBuffer();
  }
  
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  return audioBuffer;
};

let isSeeding = false;

export const useLibraryStore = create<LibraryState>((set) => ({
  tracks: [],
  processingTracks: [],
  loadTracks: async () => {
    try {
      const tracks = await db.tracks.orderBy('createdAt').reverse().toArray();
      set({ tracks });
    } catch (e: any) {
      if (e.message && e.message.includes('not found')) {
        console.warn('Object store not found, wiping DB and recreating...');
        await db.delete();
        await db.open();
        const tracks = await db.tracks.orderBy('createdAt').reverse().toArray();
        set({ tracks });
      } else {
        throw e;
      }
    }
  },
  seedLibrary: async () => {
    if (isSeeding) return;
    const count = await db.tracks.count();
    if (count > 0) return;
    
    isSeeding = true;

    const seedTracks = trackManifest;

    try {
      for (const track of seedTracks) {
        const tempId = track.name + Date.now();
        set(state => ({
          processingTracks: [...state.processingTracks, { id: tempId, name: track.name }]
        }));

      try {
        const audioBuffer = await getAudioBuffer(track.url);
        const analysis = await analyzeAudioBuffer(audioBuffer);
        
        const mins = Math.floor(audioBuffer.duration / 60);
        const secs = Math.floor(audioBuffer.duration % 60);
        const durationStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

        const title = track.name.replace(/\.[^/.]+$/, "");
        const artist = 'Pre-existing Track';

        const randomImage = studioTrackImages[Math.floor(Math.random() * studioTrackImages.length)];

        const newTrack: Track = {
          title,
          artist,
          bpm: analysis.bpm,
          key: analysis.key,
          duration: durationStr,
          energy: analysis.energy,
          hasVocal: analysis.hasVocal,
          audioUrl: track.url,
          coverArt: randomImage,
          createdAt: Date.now(),
        };

        const id = await db.tracks.add(newTrack);
        newTrack.id = id;

        set(state => ({
          tracks: [...state.tracks, newTrack].sort((a, b) => b.createdAt - a.createdAt)
        }));
      } catch (error) {
        console.error(`Failed to seed ${track.name}`, error);
      } finally {
        set(state => ({
          processingTracks: state.processingTracks.filter(t => t.id !== tempId)
        }));
      }
    }
    } catch (dbError) {
      console.error("Database error during seed, triggering rescue reset:", dbError);
      await db.delete();
      window.location.reload();
    }
    isSeeding = false;
  },
  addTrack: async (file: File) => {
    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/x-m4a', 'audio/mp4'];
    const validExtensions = /\.(mp3|wav|flac|m4a)$/i;
    
    if (!validTypes.includes(file.type) && !file.name.match(validExtensions)) {
      toast.error(`Unsupported Format: ${file.name}`);
      return;
    }

    const tempId = file.name + Date.now();
    
    set(state => ({
      processingTracks: [...state.processingTracks, { id: tempId, name: file.name }]
    }));

    try {
      const audioBuffer = await getAudioBuffer(file);
      const analysis = await analyzeAudioBuffer(audioBuffer);
      
      const mins = Math.floor(audioBuffer.duration / 60);
      const secs = Math.floor(audioBuffer.duration % 60);
      const durationStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

      // Try to extract basic info from filename
      let title = file.name.replace(/\.[^/.]+$/, "");
      let artist = 'Unknown Artist';
      if (title.includes(' - ')) {
        const parts = title.split(' - ');
        artist = parts[0].trim();
        title = parts[1].trim();
      }

      const newTrack: Track = {
        title,
        artist,
        bpm: analysis.bpm,
        key: analysis.key,
        duration: durationStr,
        energy: analysis.energy,
        hasVocal: analysis.hasVocal,
        fileBlob: file,
        createdAt: Date.now(),
      };

      // AcoustID Metadata Enrichment
      try {
        const fp = await generateFingerprint(audioBuffer);
        const meta = await lookupMetadata(fp.duration, fp.fingerprint);
        if (meta) {
          newTrack.title = meta.verifiedTitle;
          newTrack.artist = meta.verifiedArtist;
          newTrack.acoustidVerified = true;
        }
      } catch (fpErr) {
        console.warn('[AcoustID] Fingerprint lookup skipped:', fpErr);
      }

      const id = await db.tracks.add(newTrack);
      newTrack.id = id;

      set(state => ({
        tracks: [newTrack, ...state.tracks]
      }));

      toast.success(`Successfully analyzed: ${title}`);
    } catch (error) {
      toast.error(`Failed to process ${file.name}`);
      console.error(error);
    } finally {
      set(state => ({
        processingTracks: state.processingTracks.filter(t => t.id !== tempId)
      }));
    }
  }
}));
