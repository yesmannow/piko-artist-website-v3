#!/usr/bin/env node

import { existsSync } from 'fs';
import { join } from 'path';

const outputDir = '.open-next';

console.log('🔍 Verifying Cloudflare Pages build output...');

const requiredFiles = [
  'worker.js',
];

let hasErrors = false;

for (const file of requiredFiles) {
  const filePath = join(process.cwd(), outputDir, file);
  if (existsSync(filePath)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.error(`❌ ${file} is missing`);
    hasErrors = true;
  }
}

if (!existsSync(outputDir)) {
  console.error(`❌ Output directory ${outputDir} does not exist`);
  hasErrors = true;
} else {
  console.log(`✅ Output directory ${outputDir} exists`);
}

if (hasErrors) {
  console.error('\n❌ Build verification failed!');
  process.exit(1);
} else {
  console.log('\n✅ Build verification passed!');
  process.exit(0);
}
