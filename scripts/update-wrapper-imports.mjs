import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Import mappings: old path -> new path
const importMappings = [
  {
    old: '@/components/DJInterface',
    new: '@/components/RefactoredDJInterface',
    description: 'DJInterface → RefactoredDJInterface'
  },
  {
    old: '@/components/DJDeck',
    new: '@/components/RefactoredDJDeck',
    description: 'DJDeck → RefactoredDJDeck'
  },
  {
    old: '@/components/DJMixerModule',
    new: '@/components/RefactoredDJMixerModule',
    description: 'DJMixerModule → RefactoredDJMixerModule'
  },
  // Also handle relative imports
  {
    old: '../DJInterface',
    new: '../RefactoredDJInterface',
    description: 'Relative DJInterface → RefactoredDJInterface'
  },
  {
    old: './DJInterface',
    new: './RefactoredDJInterface',
    description: 'Local DJInterface → RefactoredDJInterface'
  },
  {
    old: '../DJDeck',
    new: '../RefactoredDJDeck',
    description: 'Relative DJDeck → RefactoredDJDeck'
  },
  {
    old: './DJDeck',
    new: './RefactoredDJDeck',
    description: 'Local DJDeck → RefactoredDJDeck'
  },
  {
    old: '../DJMixerModule',
    new: '../RefactoredDJMixerModule',
    description: 'Relative DJMixerModule → RefactoredDJMixerModule'
  },
  {
    old: './DJMixerModule',
    new: './RefactoredDJMixerModule',
    description: 'Local DJMixerModule → RefactoredDJMixerModule'
  },
];

// Get all source files
function getAllSourceFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      // Skip node_modules, .next, .trash, etc.
      if (!['node_modules', '.next', '.trash', 'dist'].includes(file)) {
        getAllSourceFiles(filePath, fileList);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

console.log('🔄 Updating wrapper imports...\n');

const allFiles = getAllSourceFiles(path.join(rootDir, 'src'));
let totalUpdated = 0;
const updatedFiles = [];

allFiles.forEach(filePath => {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    let fileUpdated = false;
    let changes = [];

    importMappings.forEach(({ old, new: newPath, description }) => {
      // Match import/export statements
      const patterns = [
        // import ... from 'old'
        new RegExp(`(import\\s+.*\\s+from\\s+["'])${old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(["'])`, 'g'),
        // export ... from 'old'
        new RegExp(`(export\\s+.*\\s+from\\s+["'])${old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(["'])`, 'g'),
        // import('old')
        new RegExp(`(import\\s*\\(\\s*["'])${old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(["'])`, 'g'),
      ];

      patterns.forEach(pattern => {
        if (pattern.test(content)) {
          content = content.replace(pattern, `$1${newPath}$2`);
          fileUpdated = true;
          if (!changes.includes(description)) {
            changes.push(description);
          }
        }
      });
    });

    if (fileUpdated) {
      fs.writeFileSync(filePath, content, 'utf-8');
      totalUpdated++;
      updatedFiles.push({
        file: path.relative(rootDir, filePath),
        changes
      });
      console.log(`  ✓ ${path.relative(rootDir, filePath)}`);
      changes.forEach(c => console.log(`    → ${c}`));
    }
  } catch (e) {
    console.error(`  ❌ Error processing ${filePath}: ${e.message}`);
  }
});

console.log(`\n📊 Summary:`);
console.log(`  Files updated: ${totalUpdated}`);
console.log(`  Total files scanned: ${allFiles.length}`);

if (updatedFiles.length > 0) {
  console.log(`\n✅ Import updates complete!\n`);
} else {
  console.log(`\n⚠️  No files needed updating.\n`);
}
