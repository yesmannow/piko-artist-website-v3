#!/usr/bin/env node

/**
 * check-workers.js - Verify workers are compiled before build
 *
 * This script checks that all TypeScript workers have corresponding
 * compiled JavaScript files in public/workers/
 *
 * Usage: node scripts/check-workers.js
 */

import { readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const WORKERS_SRC_DIR = join(projectRoot, 'src/workers');
const WORKERS_PUBLIC_DIR = join(projectRoot, 'public/workers');

function checkWorkers() {
  console.log('[check-workers] Checking worker compilation status...\n');

  if (!existsSync(WORKERS_SRC_DIR)) {
    console.log('[check-workers] ✅ No src/workers directory (no workers to check)');
    return true;
  }

  if (!existsSync(WORKERS_PUBLIC_DIR)) {
    console.error('[check-workers] ❌ public/workers/ directory does not exist');
    console.error('[check-workers] Run: npm run build:workers');
    return false;
  }

  const srcFiles = readdirSync(WORKERS_SRC_DIR).filter((f) => f.endsWith('.worker.ts'));
  const publicFiles = readdirSync(WORKERS_PUBLIC_DIR).filter((f) => f.endsWith('.worker.js'));

  if (srcFiles.length === 0) {
    console.log('[check-workers] ✅ No worker files to check');
    return true;
  }

  const missing = [];
  const extra = [];

  // Check each source file has a compiled version
  for (const srcFile of srcFiles) {
    const expectedJs = srcFile.replace('.ts', '.js');
    if (!publicFiles.includes(expectedJs)) {
      missing.push({ src: srcFile, expected: expectedJs });
    }
  }

  // Check for extra compiled files (orphaned)
  for (const publicFile of publicFiles) {
    const expectedTs = publicFile.replace('.js', '.ts');
    if (!srcFiles.includes(expectedTs)) {
      extra.push(publicFile);
    }
  }

  if (missing.length > 0) {
    console.error('[check-workers] ❌ Missing compiled workers:');
    for (const { src, expected } of missing) {
      console.error(`  - ${src} -> ${expected}`);
    }
    console.error('\n[check-workers] Run: npm run build:workers');
    return false;
  }

  if (extra.length > 0) {
    console.warn('[check-workers] ⚠️  Extra compiled workers (no source):');
    for (const file of extra) {
      console.warn(`  - ${file}`);
    }
    console.warn('[check-workers] These may be orphaned and can be removed\n');
  }

  console.log(`[check-workers] ✅ All ${srcFiles.length} worker(s) are compiled`);
  return true;
}

// Run if called directly
const success = checkWorkers();
process.exit(success ? 0 : 1);
