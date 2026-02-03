/**
 * GET /api/tracks
 *
 * Phase VII: R2 Track Listing API
 *
 * Returns all audio files from Cloudflare R2 storage.
 * Used by the client-side sync hook to populate IndexedDB.
 *
 * Environment Variables Required:
 * - R2_ACCESS_KEY_ID
 * - R2_SECRET_ACCESS_KEY
 * - R2_ENDPOINT
 * - R2_BUCKET_NAME
 */

import { NextResponse } from 'next/server';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

// Initialize R2 client
const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || '';
const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || '';

interface R2Track {
  url: string;
  title: string;
  size: number;
  key: string; // S3 object key
  lastModified?: Date;
}

/**
 * Parse track metadata from R2 object key
 * Example: "audio/Artist - Title.mp3" -> { artist: "Artist", title: "Title" }
 */
function parseTrackMetadata(key: string): { artist: string; title: string } {
  // Remove the "audio/" prefix
  const filename = key.replace(/^audio\//, '');

  // Remove file extension
  const nameWithoutExt = filename.replace(/\.(mp3|wav|flac|m4a|ogg)$/i, '');

  // Try to split by " - " (artist - title format)
  const parts = nameWithoutExt.split(' - ');

  if (parts.length >= 2) {
    return {
      artist: parts[0].trim(),
      title: parts.slice(1).join(' - ').trim(), // In case title has " - " in it
    };
  }

  // Fallback: Use filename as title
  return {
    artist: 'Unknown Artist',
    title: nameWithoutExt.trim(),
  };
}

export async function GET() {
  try {
    // Validate environment variables
    if (!process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
      console.error('[R2 API] Missing R2 credentials');
      return NextResponse.json(
        { error: 'R2 credentials not configured' },
        { status: 500 }
      );
    }

    if (!BUCKET_NAME) {
      console.error('[R2 API] Missing R2_BUCKET_NAME');
      return NextResponse.json(
        { error: 'R2 bucket name not configured' },
        { status: 500 }
      );
    }

    console.log('[R2 API] Fetching tracks from R2...');

    // List all objects in the audio/ prefix
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: 'audio/',
      MaxKeys: 1000, // Adjust based on your library size
    });

    const response = await r2Client.send(command);

    if (!response.Contents || response.Contents.length === 0) {
      console.log('[R2 API] No tracks found in R2');
      return NextResponse.json({ tracks: [] });
    }

    // Filter and transform objects
    const tracks: R2Track[] = response.Contents
      .filter(obj => {
        // Filter out directories and non-audio files
        const key = obj.Key || '';
        return (
          key !== 'audio/' &&
          /\.(mp3|wav|flac|m4a|ogg)$/i.test(key)
        );
      })
      .map(obj => {
        const key = obj.Key || '';
        const { title } = parseTrackMetadata(key);

        // Construct public URL
        const url = R2_PUBLIC_URL
          ? `${R2_PUBLIC_URL}/${key}`
          : `https://${BUCKET_NAME}.r2.dev/${key}`;

        return {
          key,
          url,
          title,
          size: obj.Size || 0,
          lastModified: obj.LastModified,
        };
      });

    console.log(`[R2 API] Found ${tracks.length} tracks`);

    return NextResponse.json(
      {
        tracks,
        count: tracks.length,
        bucket: BUCKET_NAME,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );

  } catch (error) {
    console.error('[R2 API] Error fetching tracks:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch tracks from R2',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
