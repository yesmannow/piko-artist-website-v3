/**
 * SampleLibrary.ts - Sample Library Management
 *
 * Phase X: Service for managing sample collections and categorization
 *
 * Features:
 * - Sample pack organization
 * - Category-based filtering
 * - Search functionality
 * - Dynamic sample loading
 */

import { type SampleInfo } from './SamplePlayer';

export interface SamplePack {
  id: string;
  name: string;
  description: string;
  category: 'drums' | 'fx' | 'scratches' | 'vocals' | 'stems' | 'mixed';
  samples: SampleInfo[];
  author?: string;
  tags?: string[];
}

export interface SampleLibraryConfig {
  baseUrl?: string;
  preloadCategories?: string[];
}

/**
 * SampleLibrary - Service for managing sample collections
 */
class SampleLibrary {
  private static instance: SampleLibrary | null = null;

  private baseUrl: string = '/audio';
  private samplePacks: Map<string, SamplePack> = new Map();
  private loadedPacks: Set<string> = new Set();

  // Private constructor enforces singleton
  private constructor() {
    this.initializeDefaultPacks();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): SampleLibrary {
    if (!SampleLibrary.instance) {
      SampleLibrary.instance = new SampleLibrary();
    }
    return SampleLibrary.instance;
  }

  /**
   * Initialize with default sample packs
   */
  private initializeDefaultPacks(): void {
    // Drum samples
    this.samplePacks.set('drums-basic', {
      id: 'drums-basic',
      name: 'Basic Drums',
      description: 'Essential drum samples for beat making',
      category: 'drums',
      samples: [
        {
          id: 'kick-basic',
          name: 'Kick',
          url: '/audio/samples/kick-drum-426037.mp3',
          category: 'drum',
          bpm: 120,
          duration: 0.2
        },
        {
          id: 'snare-basic',
          name: 'Snare',
          url: '/audio/samples/tr909-snare-drum-241413.mp3',
          category: 'drum',
          bpm: 120,
          duration: 0.15
        },
        {
          id: 'hihat-basic',
          name: 'Hi-Hat',
          url: '/audio/samples/shaker-drum-434902.mp3',
          category: 'drum',
          bpm: 120,
          duration: 0.1
        },
        {
          id: 'crash-basic',
          name: 'Crash',
          url: '/audio/samples/reverse-cymbal-riser-451412.mp3',
          category: 'drum',
          bpm: 120,
          duration: 2.0
        }
      ],
      author: 'Piko',
      tags: ['drums', 'basic', 'essential']
    });

    // Scratch samples
    this.samplePacks.set('scratches-basic', {
      id: 'scratches-basic',
      name: 'Basic Scratches',
      description: 'Fundamental scratch sounds',
      category: 'scratches',
      samples: [
        {
          id: 'scratch-1',
          name: 'Scratch 1',
          url: '/audio/samples/090241_chimbal-aberto-39488.mp3',
          category: 'scratch',
          bpm: 120,
          duration: 1.5
        },
        {
          id: 'scratch-2',
          name: 'Scratch 2',
          url: '/audio/samples/soda-bottle-base-drum-46019.mp3',
          category: 'scratch',
          bpm: 120,
          duration: 2.0
        },
        {
          id: 'scratch-3',
          name: 'Scratch 3',
          url: '/audio/samples/tom-2-85124.mp3',
          category: 'scratch',
          bpm: 120,
          duration: 1.8
        },
        {
          id: 'scratch-4',
          name: 'Scratch 4',
          url: '/audio/samples/deep-808-230752.mp3',
          category: 'scratch',
          bpm: 120,
          duration: 1.2
        }
      ],
      author: 'Piko',
      tags: ['scratches', 'basic', 'cuts']
    });

    // FX samples
    this.samplePacks.set('fx-basic', {
      id: 'fx-basic',
      name: 'Basic FX',
      description: 'Sound effects for creative mixing',
      category: 'fx',
      samples: [
        {
          id: 'fx-riser',
          name: 'Riser',
          url: '/audio/samples/reverse-cymbal-riser-451412.mp3',
          category: 'fx',
          bpm: 120,
          duration: 2.0
        },
        {
          id: 'fx-kick-deep',
          name: 'Deep Kick',
          url: '/audio/samples/deep-808-230752.mp3',
          category: 'fx',
          bpm: 120,
          duration: 1.2
        },
        {
          id: 'fx-tom',
          name: 'Tom Hit',
          url: '/audio/samples/tom-2-85124.mp3',
          category: 'fx',
          bpm: 120,
          duration: 1.8
        },
        {
          id: 'fx-percussion',
          name: 'Percussion',
          url: '/audio/samples/soda-bottle-base-drum-46019.mp3',
          category: 'fx',
          bpm: 120,
          duration: 2.0
        }
      ],
      author: 'Piko',
      tags: ['fx', 'effects', 'transitions']
    });

    // Stem samples (from existing tracks)
    this.samplePacks.set('stems-amor', {
      id: 'stems-amor',
      name: 'Amor Stems',
      description: 'Separated stems from Amor track',
      category: 'stems',
      samples: [
        {
          id: 'amor-vocals',
          name: 'Amor Vocals',
          url: '/audio/stems/amor/amor-sincero-vocals-E minor-110bpm-440hz.mp3',
          category: 'stem',
          bpm: 110,
          duration: 180
        },
        {
          id: 'amor-drums',
          name: 'Amor Drums',
          url: '/audio/stems/amor/amor-sincero-drums-E minor-110bpm-440hz.mp3',
          category: 'stem',
          bpm: 110,
          duration: 180
        },
        {
          id: 'amor-bass',
          name: 'Amor Bass',
          url: '/audio/stems/amor/amor-sincero-bass-E minor-110bpm-440hz.mp3',
          category: 'stem',
          bpm: 110,
          duration: 180
        },
        {
          id: 'amor-other',
          name: 'Amor Other',
          url: '/audio/stems/amor/amor-sincero-other-E minor-110bpm-440hz.mp3',
          category: 'stem',
          bpm: 110,
          duration: 180
        }
      ],
      author: 'Piko',
      tags: ['stems', 'vocals', 'drums', 'bass']
    });

    // Jardin stems
    this.samplePacks.set('stems-jardin', {
      id: 'stems-jardin',
      name: 'Jardin Stems',
      description: 'Separated stems from Jardin track',
      category: 'stems',
      samples: [
        {
          id: 'jardin-vocals',
          name: 'Jardin Vocals',
          url: '/audio/stems/jardin/jardin-vocals.mp3',
          category: 'stem',
          bpm: 120,
          duration: 180
        },
        {
          id: 'jardin-drums',
          name: 'Jardin Drums',
          url: '/audio/stems/jardin/jardin-drums.mp3',
          category: 'stem',
          bpm: 120,
          duration: 180
        },
        {
          id: 'jardin-bass',
          name: 'Jardin Bass',
          url: '/audio/stems/jardin/jardin-bass.mp3',
          category: 'stem',
          bpm: 120,
          duration: 180
        },
        {
          id: 'jardin-other',
          name: 'Jardin Other',
          url: '/audio/stems/jardin/jardin-other.mp3',
          category: 'stem',
          bpm: 120,
          duration: 180
        }
      ],
      author: 'Piko',
      tags: ['stems', 'vocals', 'drums', 'bass']
    });

    console.log('[SampleLibrary] Initialized with default sample packs');
  }

  /**
   * Configure the library
   */
  configure(config: SampleLibraryConfig): void {
    if (config.baseUrl) {
      this.baseUrl = config.baseUrl;
    }

    if (config.preloadCategories) {
      // Preload specified categories
      config.preloadCategories.forEach(category => {
        this.getPacksByCategory(category as any);
      });
    }
  }

  /**
   * Get all available sample packs
   */
  getAllPacks(): SamplePack[] {
    return Array.from(this.samplePacks.values());
  }

  /**
   * Get sample packs by category
   */
  getPacksByCategory(category: SamplePack['category']): SamplePack[] {
    return Array.from(this.samplePacks.values()).filter(pack => pack.category === category);
  }

  /**
   * Get pack by ID
   */
  getPack(packId: string): SamplePack | null {
    return this.samplePacks.get(packId) || null;
  }

  /**
   * Get all samples across all packs
   */
  getAllSamples(): SampleInfo[] {
    const allSamples: SampleInfo[] = [];
    this.samplePacks.forEach(pack => {
      allSamples.push(...pack.samples);
    });
    return allSamples;
  }

  /**
   * Get samples by category
   */
  getSamplesByCategory(category: SampleInfo['category']): SampleInfo[] {
    const samples: SampleInfo[] = [];
    this.samplePacks.forEach(pack => {
      samples.push(...pack.samples.filter(sample => sample.category === category));
    });
    return samples;
  }

  /**
   * Search samples by name or tags
   */
  searchSamples(query: string): SampleInfo[] {
    const lowerQuery = query.toLowerCase();
    const results: SampleInfo[] = [];

    this.samplePacks.forEach(pack => {
      // Search in pack name/description
      const packMatch = pack.name.toLowerCase().includes(lowerQuery) ||
                       pack.description.toLowerCase().includes(lowerQuery) ||
                       pack.tags?.some(tag => tag.toLowerCase().includes(lowerQuery));

      if (packMatch) {
        results.push(...pack.samples);
      } else {
        // Search in individual samples
        const matchingSamples = pack.samples.filter(sample =>
          sample.name.toLowerCase().includes(lowerQuery) ||
          sample.category.toLowerCase().includes(lowerQuery)
        );
        results.push(...matchingSamples);
      }
    });

    return results;
  }

  /**
   * Get sample by ID
   */
  getSample(sampleId: string): SampleInfo | null {
    for (const pack of this.samplePacks.values()) {
      const sample = pack.samples.find(s => s.id === sampleId);
      if (sample) return sample;
    }
    return null;
  }

  /**
   * Load a sample pack (mark as loaded)
   */
  loadPack(packId: string): boolean {
    if (this.samplePacks.has(packId)) {
      this.loadedPacks.add(packId);
      console.log(`[SampleLibrary] Loaded pack: ${packId}`);
      return true;
    }
    return false;
  }

  /**
   * Unload a sample pack
   */
  unloadPack(packId: string): boolean {
    return this.loadedPacks.delete(packId);
  }

  /**
   * Check if pack is loaded
   */
  isPackLoaded(packId: string): boolean {
    return this.loadedPacks.has(packId);
  }

  /**
   * Get loaded packs
   */
  getLoadedPacks(): SamplePack[] {
    return Array.from(this.loadedPacks)
      .map(id => this.samplePacks.get(id))
      .filter(Boolean) as SamplePack[];
  }

  /**
   * Add custom sample pack
   */
  addPack(pack: SamplePack): void {
    this.samplePacks.set(pack.id, pack);
    console.log(`[SampleLibrary] Added custom pack: ${pack.name}`);
  }

  /**
   * Remove sample pack
   */
  removePack(packId: string): boolean {
    const deleted = this.samplePacks.delete(packId);
    if (deleted) {
      this.loadedPacks.delete(packId);
      console.log(`[SampleLibrary] Removed pack: ${packId}`);
    }
    return deleted;
  }

  /**
   * Get library statistics
   */
  getStats(): {
    totalPacks: number;
    totalSamples: number;
    loadedPacks: number;
    categories: Record<string, number>;
  } {
    const categories: Record<string, number> = {};
    let totalSamples = 0;

    this.samplePacks.forEach(pack => {
      categories[pack.category] = (categories[pack.category] || 0) + pack.samples.length;
      totalSamples += pack.samples.length;
    });

    return {
      totalPacks: this.samplePacks.size,
      totalSamples,
      loadedPacks: this.loadedPacks.size,
      categories
    };
  }

  /**
   * Export library configuration
   */
  exportConfig(): string {
    const config = {
      baseUrl: this.baseUrl,
      packs: Array.from(this.samplePacks.values()).map(pack => ({
        ...pack,
        samples: pack.samples.map(sample => ({ ...sample, buffer: undefined })) // Don't export buffers
      }))
    };
    return JSON.stringify(config, null, 2);
  }

  /**
   * Import library configuration
   */
  importConfig(configJson: string): void {
    try {
      const config = JSON.parse(configJson);
      this.baseUrl = config.baseUrl || '/audio';

      config.packs.forEach((pack: SamplePack) => {
        this.samplePacks.set(pack.id, pack);
      });

      console.log(`[SampleLibrary] Imported ${config.packs.length} packs`);
    } catch (error) {
      console.error('[SampleLibrary] Failed to import config:', error);
    }
  }

  // ==========================================================================
  // CLEANUP
  // ==========================================================================

  dispose(): void {
    this.samplePacks.clear();
    this.loadedPacks.clear();
    console.log('[SampleLibrary] Disposed');
  }
}

// Export singleton instance getter
export const getSampleLibrary = () => SampleLibrary.getInstance();
