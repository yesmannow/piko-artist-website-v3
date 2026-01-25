/**
 * r2.ts - Cloudflare R2 Client setup
 * 
 * S3-compatible client for Cloudflare R2 storage.
 * Used for storing and retrieving audio stems and metadata.
 * 
 * Phase V: Singleton pattern for optimal TCP connection reuse
 */

import { S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

/**
 * Singleton R2 Client Instance
 * Reuses TCP connections across serverless function invocations
 * Environment variables required:
 * - R2_ACCOUNT_ID
 * - R2_ACCESS_KEY_ID
 * - R2_SECRET_ACCESS_KEY
 * - R2_BUCKET_NAME
 */
if (!process.env.R2_ACCOUNT_ID ||
    !process.env.R2_ACCESS_KEY_ID ||
    !process.env.R2_SECRET_ACCESS_KEY ||
    !process.env.R2_BUCKET_NAME) {
  throw new Error("Missing Cloudflare R2 Environment Variables");
}

export const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

/**
 * @deprecated Use the singleton `r2` export instead
 * Kept for backward compatibility
 */
export function createR2Client() {
  return r2;
}

/**
 * Generate a presigned URL for downloading a file from R2
 * This prevents direct bucket access and enforces access controls
 */
export async function getPresignedDownloadUrl(
  key: string,
  expiresIn = 3600
): Promise<string> {
  const bucket = process.env.R2_BUCKET_NAME;

  if (!bucket) {
    throw new Error('R2_BUCKET_NAME not configured');
  }

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  return getSignedUrl(r2, command, { expiresIn });
}

/**
 * Generate a presigned URL for uploading a file to R2
 */
export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 3600
): Promise<string> {
  const bucket = process.env.R2_BUCKET_NAME;

  if (!bucket) {
    throw new Error('R2_BUCKET_NAME not configured');
  }

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(r2, command, { expiresIn });
}
