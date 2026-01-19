/**
 * Core Audio Type Definitions for Piko V3 Studio
 *
 * These types define the audio engine architecture and stem separation interfaces.
 */

export interface TrackMetadata {
  title: string;
  artist: string;
  duration: number;
  bpm?: number;
  key?: string;
}

export interface AudioAnalysis {
  waveform?: Float32Array;
  peaks?: number[];
  bpm?: number;
  key?: string;
}

export interface Track {
  id: string;
  url: string;
  metadata: TrackMetadata;
  analysis?: AudioAnalysis;
}

export interface Stem {
  name: 'drums' | 'bass' | 'vocals' | 'other';
  buffer: AudioBuffer;
  gain: number;
}
