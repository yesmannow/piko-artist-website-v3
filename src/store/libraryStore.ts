import { create } from 'zustand';
import { db, Track } from '@/lib/db';
import { trackManifest } from '@/lib/audio/trackManifest';
import { TRACK_IMAGE_POOL } from '@/lib/studioTrackImages';
import { analyzeAudioBuffer } from '@/hooks/analysis/useEssentiaAnalysis';
import { generateFingerprint, lookupMetadata } from '@/lib/acoustid';
import { PLACEHOLDER_BPM, PLACEHOLDER_KEY } from '@/lib/constants/analysisPlaceholders';
import toast from 'react-hot-toast';
import pikoSeedData from '@/lib/data/piko-seed.json';

/** Shape of each entry in piko-seed.json */
interface PikoSeedEntry {
  filename: string;
  title: string;
  artist: string;
  bpm: string;
  key: string;
  energy: string;
  durationEstimate: string;
  hasVocal: boolean;
  status: string;
}

// Build a lookup map keyed by lowercase filename for O(1) metadata resolution
const pikoSeedMap = new Map(
  (pikoSeedData as PikoSeedEntry[]).map((entry) => [entry.filename.toLowerCase(), entry])
);

interface LibraryState {
  tracks: Track[];
  processingTracks: { id: string; name: string }[];
  loadTracks: () => Promise<void>;
  addTrack: (file: File) => Promise<void>;
  seedLibrary: () => Promise<void>;
}

// Helper to get AudioBuffer — used only for user-uploaded files (addTrack), NOT during seed
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

    try {
      const now = Date.now();
      const successRows: Track[] = [];

      for (let idx = 0; idx < trackManifest.length; idx++) {
        const track = trackManifest[idx];
        try {
          // Resolve rich metadata from piko-seed.json (keyed by normalised filename)
          const filenameOnly = track.name.split('/').pop() ?? track.name;
          const seed = pikoSeedMap.get(filenameOnly.toLowerCase());

          const title = seed?.title ?? track.name.replace(/\.[^/.]+$/, '');
          const randomImage = TRACK_IMAGE_POOL[idx % TRACK_IMAGE_POOL.length];

          const row: Omit<Track, 'id'> = {
            title,
            artist: seed?.artist ?? 'Piko FG',
            // Prefer seed-provided values; fall back to manifest then placeholder
            bpm: seed?.bpm ?? track.bpm ?? PLACEHOLDER_BPM,
            key: seed?.key ?? track.key ?? PLACEHOLDER_KEY,
            duration: seed?.durationEstimate ?? '00:00',
            energy: seed?.energy ?? 'Medium',
            hasVocal: seed?.hasVocal ?? false,
            audioUrl: track.url,
            coverArt: randomImage,
            status: (seed?.status as Track['status']) ?? 'ready',
            createdAt: now - idx, // ensure stable insertion order
          };

          const id = await db.tracks.add(row as Track);
          successRows.push({ ...row, id } as Track);
        } catch (trackError) {
          // Log the failure but continue seeding the remaining tracks
          console.error(`[seedLibrary] Failed to seed track "${track.name}":`, trackError);
        }
      }

      // Refresh store state from DB so UI shows all successfully seeded tracks
      const tracks = await db.tracks.orderBy('createdAt').reverse().toArray();
      set({ tracks });
    } catch (dbError) {
      console.error('Database error during seed, triggering rescue reset:', dbError);
      await db.delete();
      window.location.reload();
    } finally {
      isSeeding = false;
    }
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
      let title = file.name.replace(/\.[^/.]+$/, '');
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

