/**
 * Test API Route for Track Loading
 * 
 * Tests the /api/get-track endpoint to ensure it works correctly
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Load environment variables
try {
  const envPath = join(projectRoot, '.env.local');
  const envContent = readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        let value = valueParts.join('=').trim();
        value = value.replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  });
} catch (error) {
  console.warn('Could not load .env.local, using existing environment variables');
}

// Test the getPresignedUrl function directly
async function testPresignedUrl() {
  console.log('\n=== Testing Presigned URL Generation ===\n');
  
  // Import the function (this will work in Next.js context)
  // For standalone test, we'll simulate the API call
  const { S3Client, GetObjectCommand } = await import('@aws-sdk/client-s3');
  const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
  
  const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID?.replace(/^["']|["']$/g, '');
  const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID?.replace(/^["']|["']$/g, '');
  const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY?.replace(/^["']|["']$/g, '');
  const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME?.replace(/^["']|["']$/g, '') || 'piko-media';
  
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    console.error('❌ Missing R2 credentials');
    return;
  }
  
  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });
  
  // Test with a track that exists
  const testKey = 'audio/Amor Sincero.mp3';
  
  try {
    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: testKey,
    });
    
    const url = await getSignedUrl(client, command, { expiresIn: 3600 });
    console.log('✅ Presigned URL generated successfully');
    console.log(`\nURL: ${url.substring(0, 100)}...\n`);
    
    // Test URL with fetch (this simulates what the browser will do)
    console.log('Testing URL accessibility...');
    try {
      const response = await fetch(url, { 
        method: 'HEAD',
        headers: {
          'Accept': 'audio/mpeg, audio/*, */*',
        }
      });
      
      console.log(`Status: ${response.status} ${response.statusText}`);
      if (response.ok) {
        console.log('✅ URL is accessible');
        console.log(`Content-Type: ${response.headers.get('content-type')}`);
        console.log(`Content-Length: ${(parseInt(response.headers.get('content-length') || '0') / 1024 / 1024).toFixed(2)} MB`);
      } else {
        console.log('⚠️  URL returned non-200 status');
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      }
    } catch (fetchError) {
      console.error('❌ Failed to fetch URL:', fetchError.message);
    }
    
  } catch (error) {
    console.error('❌ Failed to generate presigned URL:', error.message);
  }
}

testPresignedUrl().catch(console.error);
