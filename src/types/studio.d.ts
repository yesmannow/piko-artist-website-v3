// src/types/studio.d.ts

declare module 'studio-types' {
  import * as Tone from 'tone';

  // --- AUDIO DATA MODELS ---

  export type MusicalKey = 
    | 'C' | 'Cm' | 'C#' | 'C#m' | 'D' | 'Dm' | 'D#' | 'D#m' 
    | 'E' | 'Em' | 'F' | 'Fm' | 'F#' | 'F#m' | 'G' | 'Gm' 
    | 'G#' | 'G#m' | 'A' | 'Am' | 'A#' | 'A#m' | 'B' | 'Bm';

  export interface StemPaths {
    full?: string;
    vocals?: string;
    drums?: string;
    bass?: string;
    other?: string;
  }

  export interface CuePoint {
    id: string;
    label: string;
    time: number; // In seconds
    color: string;
    type: 'drop' | 'breakdown' | 'intro' | 'outro' | 'loop';
  }

  export interface TrackMetadata {
    id: string;
    title: string;
    artist: string;
    album?: string;
    duration: number; // In seconds
    bpm: number;
    key: MusicalKey;
    energy: number; // Normalized 0.0 to 1.0 (Chill to Hype)
    danceability?: number; // Normalized 0.0 to 1.0
    coverArtUrl: string;
    waveformUrl?: string; // Pre-computed waveform JSON/PNG
    stems: StemPaths;
    cues: CuePoint[];
    fileType: 'mp3' | 'wav' | 'flac';
  }

  // --- ENGINE STATE ---

  export type DeckId = 'A' | 'B';

  export interface FXState {
    filter: {
      enabled: boolean;
      frequency: number; // 20Hz to 20kHz
      resonance: number;
    };
    delay: {
      enabled: boolean;
      time: Tone.Unit.Time;
      feedback: number;
      mix: number;
    };
    distortion: {
      enabled: boolean;
      amount: number; // 0.0 to 1.0
    };
    tapeStop: boolean; // Trigger state for hip-hop transition
  }

  export interface DeckState {
    track: TrackMetadata | null;
    status: 'loading' | 'ready' | 'playing' | 'paused' | 'error';
    currentTime: number;
    playbackRate: number; // 1.0 = normal speed, affected by BPM sync
    volume: number; // -Infinity to 0 dB
    isMuted: boolean;
    loop: {
      active: boolean;
      start: number;
      end: number;
    };
    activeStems: {
      vocals: boolean;
      drums: boolean;
      bass: boolean;
      other: boolean;
    };
    fx: FXState;
  }

  export interface MasterState {
    bpm: number;
    crossfader: number; // -1 (A) to 1 (B)
    masterVolume: number; // dB
    isRecording: boolean;
    recordingTime: number;
    limiterReduction: number; // For visual gain reduction meter
  }

  // --- THEME & VISUALS (Liquid Obsidian) ---

  export type ThemeIntensity = 'chill' | 'neutral' | 'hype';

  export interface ThemeColors {
    primary: string;   // Main accent (e.g., Cyan)
    secondary: string; // Secondary accent (e.g., Purple)
    background: string;
    surface: string;
    glow: string;      // For box-shadows and shader uniforms
  }

  export interface StudioTheme {
    name: ThemeIntensity;
    colors: ThemeColors;
    animationSpeed: number; // Multiplier for visualizer
    distortAmount: number;  // Multiplier for 3D mesh distortion
  }

  // --- API RESPONSES ---

  export interface AnalyzeTrackResponse {
    bpm: number;
    key: string;
    energy: number;
    peaks: number[]; // For waveform rendering
  }
  
  export interface PresignedUrlResponse {
    url: string;
    expiresAt: number;
  }
}
