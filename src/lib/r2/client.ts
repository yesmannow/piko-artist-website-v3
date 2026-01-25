/**
 * R2 Client - Cloudflare R2 Storage Utilities
 * 
 * Uses AWS S3 SDK (compatible with R2) for presigned URL generation
 */

import { S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { GetObjectCommand } from '@aws-sdk/client-s3';

// R2 Configuration
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'piko-media';

// R2 Endpoint format: https://<account-id>.r2.cloudflarestorage.com
const R2_ENDPOINT = R2_ACCOUNT_ID 
  ? `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
  : undefined;

if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
  console.warn('[R2 Client] Missing R2 credentials. R2 functionality will be limited.');
}

// Create S3-compatible client for R2
export const r2Client = R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_ENDPOINT
  ? new S3Client({
      region: 'auto',
      endpoint: R2_ENDPOINT,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    })
  : null;

/**
 * Generate a presigned URL for streaming an audio file from R2
 * @param key - Object key (filename) in R2 bucket
 * @param expiresIn - URL expiration time in seconds (default: 1 hour)
 * @returns Presigned URL or null if client not configured
 */
export async function getPresignedUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string | null> {
  if (!r2Client) {
    console.error('[R2 Client] R2 client not configured');
    return null;
  }

  try {
    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });

    const url = await getSignedUrl(r2Client, command, { expiresIn });
    return url;
  } catch (error) {
    console.error('[R2 Client] Failed to generate presigned URL:', error);
    return null;
  }
}

/**
 * Get the public URL for an R2 object (if bucket is public)
 * @param key - Object key (filename) in R2 bucket
 * @returns Public URL or null
 */
export function getPublicUrl(_key: string): string | null {
  // R2 public URLs format: https://pub-<random>.r2.dev/<key>
  // This requires the bucket to have a public domain configured
  // For now, return null - use presigned URLs instead
  return null;
}
