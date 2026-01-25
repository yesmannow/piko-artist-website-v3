/**
 * API Route: /api/studio/analyze-track
 * 
 * Analyzes audio files to extract BPM, key, energy, and markers.
 * Returns TrackMetadata JSON structure for studio mixer.
 */

import { NextRequest, NextResponse } from 'next/server';
import * as mm from 'music-metadata';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // 1. Extract Basic Metadata from ID3 tags
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const metadata = await mm.parseBuffer(buffer, file.type);

    // 2. Extract BPM and Key (from tags or use defaults)
    const bpmValue = metadata.common.bpm;
    const analyzedBPM = Array.isArray(bpmValue) ? bpmValue[0] : (typeof bpmValue === 'number' ? bpmValue : 95.0);
    const analyzedKey = metadata.common.key || 'Am';
    const duration = metadata.format.duration || 180; // Default 3 minutes

    // 3. Calculate Energy Score (simplified - in production, use Essentia.js)
    // For now, estimate based on BPM: higher BPM = higher energy
    const energyScore = Math.min(1.0, Math.max(0.0, (analyzedBPM - 60) / 140));

    // 4. Auto-calculate markers based on BPM (16-bar, 32-bar intervals)
    const barsPerSecond = analyzedBPM / 60 / 4; // 4 beats per bar
    const markers = {
      intro: 0,
      verse1: 16 / barsPerSecond, // 16 bars
      chorus1: 32 / barsPerSecond, // 32 bars
      drop: 64 / barsPerSecond, // 64 bars
    };

    // 5. Determine color theme based on energy/BPM
    const colorTheme = analyzedBPM > 100 || energyScore > 0.7
      ? { primary: '#ef4444', secondary: '#f97316' } // Red/Orange for high energy
      : energyScore < 0.4
      ? { primary: '#3b82f6', secondary: '#06b6d4' } // Blue/Cyan for chill
      : { primary: '#9333ea', secondary: '#a855f7' }; // Purple for medium

    // 6. Construct "Studio-Ready" Metadata
    const trackDNA = {
      id: randomUUID(),
      title: metadata.common.title || 'Untitled Track',
      artist: metadata.common.artist || 'Unknown Artist',
      album: metadata.common.album,
      duration: duration,
      bpm: analyzedBPM,
      key: analyzedKey,
      energy: energyScore,
      markers: markers,
      colorTheme: colorTheme,
      // Stems would be provided separately or generated via Spleeter
      stems: {
        full: file.name,
        vocals: `${file.name.replace(/\.[^/.]+$/, '')}_vocals.mp3`,
        drums: `${file.name.replace(/\.[^/.]+$/, '')}_drums.mp3`,
        other: `${file.name.replace(/\.[^/.]+$/, '')}_other.mp3`,
      },
      fileType: file.type.includes('wav') ? 'wav' : file.type.includes('flac') ? 'flac' : 'mp3',
      coverArtUrl: metadata.common.picture?.[0] 
        ? `data:${metadata.common.picture[0].format};base64,${Buffer.from(metadata.common.picture[0].data).toString('base64')}`
        : '/images/art_placeholder_1.jpg',
    };

    return NextResponse.json(trackDNA);

  } catch (error) {
    console.error('Audio Analysis Error:', error);
    return NextResponse.json(
      { error: 'Analysis failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
