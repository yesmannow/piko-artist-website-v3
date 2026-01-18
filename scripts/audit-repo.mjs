import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const PROJECT_ROOT = process.cwd();
// Only scan top-level dirs to avoid duplicate scanning of subdirectories
const TARGET_DIRS = ['public', 'src/assets', 'src/components'];

const hashFile = (filePath) =>
  new Promise((resolve) => {
    const hash = crypto.createHash('sha1');
    const stream = fs.createReadStream(filePath);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve({ filePath, hash: hash.digest('hex') }));
  });

const scanDirectory = async (dir, results = []) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await scanDirectory(fullPath, results);
    } else {
      const stat = fs.statSync(fullPath);
      if (stat.size > MAX_FILE_SIZE) {
        console.warn(
          `[⚠️ Large File] ${fullPath} → ${(stat.size / 1024 / 1024).toFixed(2)} MB`
        );
      }
      results.push({ path: fullPath, size: stat.size });
    }
  }

  return results;
};

const main = async () => {
  const allFiles = [];

  for (const dir of TARGET_DIRS) {
    const fullPath = path.join(PROJECT_ROOT, dir);
    if (fs.existsSync(fullPath)) {
      const files = await scanDirectory(fullPath);
      allFiles.push(...files);
    }
  }

  const hashed = await Promise.all(allFiles.map((f) => hashFile(f.path)));
  const hashMap = new Map();

  for (const { filePath, hash } of hashed) {
    if (hashMap.has(hash)) {
      const existing = hashMap.get(hash);
      // Only report if it's a different file (not the same path)
      if (existing !== filePath) {
        console.log(`[🧱 Duplicate] ${filePath} ↔ ${existing}`);
      }
    } else {
      hashMap.set(hash, filePath);
    }
  }

  console.log('\n✅ Repo audit complete.');
};

main();
