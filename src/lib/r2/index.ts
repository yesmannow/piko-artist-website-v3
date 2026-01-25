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
let r2Singleton: S3Client | null = null;

function getR2Env() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    // Important: do NOT throw at module-load time, otherwise `next build` can fail while
    // evaluating route modules ("Collecting page data"). Fail only when actually used.
    throw new Error('Missing Cloudflare R2 Environment Variables');
  }

  return { accountId, accessKeyId, secretAccessKey, bucketName };
}

export function getR2Client(): S3Client {
  if (r2Singleton) return r2Singleton;

  const { accountId, accessKeyId, secretAccessKey } = getR2Env();
  r2Singleton = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });

  return r2Singleton;
}

/**
 * @deprecated Use the singleton `r2` export instead
 * Kept for backward compatibility
 */
export function createR2Client() {
  return getR2Client();
}

/**
 * Generate a presigned URL for downloading a file from R2
 * This prevents direct bucket access and enforces access controls
 */
export async function getPresignedDownloadUrl(
  key: string,
  expiresIn = 3600
): Promise<string> {
  const { bucketName } = getR2Env();

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  return getSignedUrl(getR2Client(), command, { expiresIn });
}

/**
 * Generate a presigned URL for uploading a file to R2
 */
export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 3600
): Promise<string> {
  const { bucketName } = getR2Env();

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(getR2Client(), command, { expiresIn });
}
