/**
 * r2.ts - Cloudflare R2 Client setup
 * 
 * S3-compatible client for Cloudflare R2 storage.
 * Used for storing and retrieving audio stems and metadata.
 * 
 * Phase II: Core Architecture
 */

import { S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

/**
 * Initialize R2 client
 * Environment variables required:
 * - R2_ACCOUNT_ID
 * - R2_ACCESS_KEY_ID
 * - R2_SECRET_ACCESS_KEY
 * - R2_BUCKET_NAME
 */
export function createR2Client() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error('R2 credentials not configured');
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

/**
 * Generate a presigned URL for downloading a file from R2
 * This prevents direct bucket access and enforces access controls
 */
export async function getPresignedDownloadUrl(
  key: string,
  expiresIn = 3600
): Promise<string> {
  const client = createR2Client();
  const bucket = process.env.R2_BUCKET_NAME;

  if (!bucket) {
    throw new Error('R2_BUCKET_NAME not configured');
  }

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  return getSignedUrl(client, command, { expiresIn });
}

/**
 * Generate a presigned URL for uploading a file to R2
 */
export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 3600
): Promise<string> {
  const client = createR2Client();
  const bucket = process.env.R2_BUCKET_NAME;

  if (!bucket) {
    throw new Error('R2_BUCKET_NAME not configured');
  }

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(client, command, { expiresIn });
}
