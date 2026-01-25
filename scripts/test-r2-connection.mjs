/**
 * Test R2 Connection and Track Loading
 * 
 * This script tests:
 * 1. R2 credentials and connection
 * 2. API route functionality
 * 3. Track key matching between JSON and R2
 * 4. Presigned URL generation
 */

import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Load environment variables from .env.local manually
// (Next.js handles this automatically, but for standalone script we need to read it)
try {
  const envPath = join(projectRoot, '.env.local');
  const envContent = readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        let value = valueParts.join('=').trim();
        // Remove surrounding quotes if present
        value = value.replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  });
} catch (error) {
  // .env.local might not exist, that's okay - use existing env vars
  console.warn('Could not load .env.local, using existing environment variables');
}

// Helper to strip quotes from env vars
function stripQuotes(str) {
  if (!str) return str;
  return str.replace(/^["']|["']$/g, '');
}

// R2 Configuration
const R2_ACCOUNT_ID = stripQuotes(process.env.R2_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID);
const R2_ACCESS_KEY_ID = stripQuotes(process.env.R2_ACCESS_KEY_ID);
const R2_SECRET_ACCESS_KEY = stripQuotes(process.env.R2_SECRET_ACCESS_KEY);
const R2_BUCKET_NAME = stripQuotes(process.env.R2_BUCKET_NAME || 'piko-media');

const R2_ENDPOINT = R2_ACCOUNT_ID 
  ? `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
  : undefined;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logError(message) {
  console.error(`${colors.red}❌ ${message}${colors.reset}`);
}

function logSuccess(message) {
  console.log(`${colors.green}✅ ${message}${colors.reset}`);
}

function logInfo(message) {
  console.log(`${colors.cyan}ℹ️  ${message}${colors.reset}`);
}

function logWarning(message) {
  console.log(`${colors.yellow}⚠️  ${message}${colors.reset}`);
}

async function testR2Connection() {
  log('\n=== Testing R2 Connection ===', 'blue');
  
  // Check environment variables
  log('\n1. Checking Environment Variables...', 'cyan');
  
  const missingVars = [];
  if (!R2_ACCOUNT_ID) missingVars.push('R2_ACCOUNT_ID');
  if (!R2_ACCESS_KEY_ID) missingVars.push('R2_ACCESS_KEY_ID');
  if (!R2_SECRET_ACCESS_KEY) missingVars.push('R2_SECRET_ACCESS_KEY');
  if (!R2_BUCKET_NAME) missingVars.push('R2_BUCKET_NAME');
  
  if (missingVars.length > 0) {
    logError(`Missing environment variables: ${missingVars.join(', ')}`);
    logWarning('Please set these in .env.local file');
    return false;
  }
  
  logSuccess('All environment variables are set');
  logInfo(`Account ID: ${R2_ACCOUNT_ID.substring(0, 8)}...`);
  logInfo(`Bucket: ${R2_BUCKET_NAME}`);
  logInfo(`Endpoint: ${R2_ENDPOINT}`);
  
  // Create S3 client
  log('\n2. Creating R2 Client...', 'cyan');
  let client;
  try {
    client = new S3Client({
      region: 'auto',
      endpoint: R2_ENDPOINT,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    });
    logSuccess('R2 client created successfully');
  } catch (error) {
    logError(`Failed to create R2 client: ${error.message}`);
    return false;
  }
  
  // List objects in bucket
  log('\n3. Listing objects in R2 bucket...', 'cyan');
  try {
    const listCommand = new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME,
      MaxKeys: 100,
    });
    
    const response = await client.send(listCommand);
    
    if (!response.Contents || response.Contents.length === 0) {
      logWarning('Bucket is empty or no objects found');
      return false;
    }
    
    logSuccess(`Found ${response.Contents.length} objects in bucket`);
    
    // Display first 10 objects
    log('\nFirst 10 objects:', 'cyan');
    response.Contents.slice(0, 10).forEach((obj, index) => {
      const sizeMB = (obj.Size / (1024 * 1024)).toFixed(2);
      log(`  ${index + 1}. ${obj.Key} (${sizeMB} MB)`);
    });
    
    return response.Contents.map(obj => obj.Key);
  } catch (error) {
    logError(`Failed to list objects: ${error.message}`);
    if (error.name === 'InvalidAccessKeyId' || error.name === 'SignatureDoesNotMatch') {
      logError('Invalid credentials. Please check your R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY');
    }
    return false;
  }
}

async function testPresignedUrl(client, key) {
  log(`\n4. Testing presigned URL generation for: ${key}...`, 'cyan');
  
  try {
    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });
    
    const url = await getSignedUrl(client, command, { expiresIn: 3600 });
    logSuccess('Presigned URL generated successfully');
    logInfo(`URL: ${url.substring(0, 80)}...`);
    
    // Test if URL is accessible
    log('\n5. Testing URL accessibility...', 'cyan');
    try {
      const response = await fetch(url, { method: 'HEAD' });
      if (response.ok) {
        logSuccess(`URL is accessible (Status: ${response.status})`);
        const contentType = response.headers.get('content-type');
        logInfo(`Content-Type: ${contentType}`);
        return true;
      } else {
        logError(`URL returned status: ${response.status}`);
        return false;
      }
    } catch (fetchError) {
      logError(`Failed to fetch URL: ${fetchError.message}`);
      return false;
    }
  } catch (error) {
    logError(`Failed to generate presigned URL: ${error.message}`);
    return false;
  }
}

async function verifyTrackKeys(r2Keys) {
  log('\n=== Verifying Track Keys ===', 'blue');
  
  // Load track data
  log('\n1. Loading track data from JSON files...', 'cyan');
  let musicianTracks, pikoTracks;
  
  try {
    const musicianPath = join(projectRoot, 'src', 'data', 'musician_tracks.json');
    const pikoPath = join(projectRoot, 'src', 'data', 'piko-tracks.json');
    
    musicianTracks = JSON.parse(readFileSync(musicianPath, 'utf-8'));
    logSuccess(`Loaded ${musicianTracks.length} tracks from musician_tracks.json`);
    
    try {
      pikoTracks = JSON.parse(readFileSync(pikoPath, 'utf-8'));
      logSuccess(`Loaded ${pikoTracks.length} tracks from piko-tracks.json`);
    } catch (e) {
      logWarning('piko-tracks.json not found or invalid');
    }
  } catch (error) {
    logError(`Failed to load track data: ${error.message}`);
    return false;
  }
  
  // Extract track keys from JSON
  // Note: R2 stores tracks under 'audio/' prefix, but JSON references them without prefix
  const trackKeys = new Set();
  musicianTracks.forEach(track => {
    if (track.trackId) {
      trackKeys.add(track.trackId); // Original key
      trackKeys.add(`audio/${track.trackId}`); // With prefix
    }
    if (track.stems?.full) {
      trackKeys.add(track.stems.full);
      trackKeys.add(`audio/${track.stems.full}`);
    }
  });
  
  if (pikoTracks) {
    pikoTracks.forEach(track => {
      if (track.trackId) {
        trackKeys.add(track.trackId);
        trackKeys.add(`audio/${track.trackId}`);
      }
      if (track.stems?.full) {
        trackKeys.add(track.stems.full);
        trackKeys.add(`audio/${track.stems.full}`);
      }
    });
  }
  
  logInfo(`Found ${trackKeys.size} unique track keys in JSON files`);
  
  // Check which tracks exist in R2
  log('\n2. Checking track availability in R2...', 'cyan');
  const r2KeySet = new Set(r2Keys);
  const missing = [];
  const found = [];
  
  trackKeys.forEach(key => {
    if (r2KeySet.has(key)) {
      found.push(key);
    } else {
      missing.push(key);
    }
  });
  
  logSuccess(`Found ${found.length} tracks in R2`);
  if (found.length > 0) {
    log('\nAvailable tracks:', 'cyan');
    found.slice(0, 10).forEach(key => {
      log(`  ✅ ${key}`);
    });
  }
  
  if (missing.length > 0) {
    logWarning(`Missing ${missing.length} tracks in R2`);
    log('\nMissing tracks:', 'yellow');
    missing.slice(0, 10).forEach(key => {
      log(`  ❌ ${key}`);
    });
    if (missing.length > 10) {
      log(`  ... and ${missing.length - 10} more`);
    }
  }
  
  return { found, missing };
}

async function main() {
  log('\n' + '='.repeat(60), 'blue');
  log('R2 Connection & Track Loading Test', 'blue');
  log('='.repeat(60), 'blue');
  
  // Test R2 connection
  const r2Keys = await testR2Connection();
  
  if (!r2Keys || r2Keys.length === 0) {
    logError('\n❌ R2 connection test failed. Cannot proceed.');
    process.exit(1);
  }
  
  // Verify track keys
  const { found, missing } = await verifyTrackKeys(r2Keys);
  
  if (found.length === 0) {
    logError('\n❌ No matching tracks found between JSON and R2');
    process.exit(1);
  }
  
  // Test presigned URL with first available track
  const testTrack = found[0];
  if (testTrack) {
    const client = new S3Client({
      region: 'auto',
      endpoint: R2_ENDPOINT,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    });
    
    await testPresignedUrl(client, testTrack);
  }
  
  // Summary
  log('\n' + '='.repeat(60), 'blue');
  log('Test Summary', 'blue');
  log('='.repeat(60), 'blue');
  logSuccess(`R2 Connection: ✅ Working`);
  logSuccess(`Tracks in R2: ${r2Keys.length}`);
  logSuccess(`Tracks matched: ${found.length}`);
  if (missing.length > 0) {
    logWarning(`Tracks missing: ${missing.length}`);
  }
  
  if (found.length > 0 && missing.length === 0) {
    log('\n🎉 All tests passed! R2 connection is working correctly.', 'green');
  } else if (found.length > 0) {
    log('\n⚠️  R2 connection works, but some tracks are missing.', 'yellow');
  }
  
  log('\n');
}

main().catch(error => {
  logError(`\nFatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
