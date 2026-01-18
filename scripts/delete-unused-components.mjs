import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Read the analysis
const analysis = JSON.parse(
  fs.readFileSync(path.join(rootDir, 'component-analysis.json'), 'utf-8')
);

// Create .trash directory
const trashDir = path.join(rootDir, '.trash');
if (!fs.existsSync(trashDir)) {
  fs.mkdirSync(trashDir, { recursive: true });
  console.log('📁 Created .trash/ directory\n');
}

// Components to move to trash
const toTrash = [
  ...analysis.unused.map(u => ({
    from: path.join(rootDir, 'src', u.path),
    name: u.name,
    category: 'unused'
  })),
  ...analysis.wrappers.map(w => ({
    from: path.join(rootDir, 'src', w.path),
    name: w.name,
    category: 'wrapper'
  })),
];

// Additional duplicates to remove
const duplicatesToRemove = [
  { from: path.join(rootDir, 'src/components/Navbar.tsx'), name: 'Navbar', category: 'duplicate' },
  { from: path.join(rootDir, 'src/components/Player.tsx'), name: 'Player', category: 'duplicate' },
];

const allToTrash = [...toTrash, ...duplicatesToRemove];

console.log(`🗑️  Preparing to move ${allToTrash.length} components to .trash/...\n`);

let moved = 0;
let skipped = 0;
let errors = [];

// Group by category for reporting
const byCategory = {
  unused: [],
  wrapper: [],
  duplicate: []
};

allToTrash.forEach(({ from, name, category }) => {
  if (!fs.existsSync(from)) {
    skipped++;
    console.log(`  ⚠ Skipped (not found): ${path.relative(rootDir, from)}`);
    return;
  }

  const relativePath = path.relative(rootDir, from);
  const trashPath = path.join(trashDir, relativePath);
  const trashDirPath = path.dirname(trashPath);

  try {
    // Create directory structure in trash
    if (!fs.existsSync(trashDirPath)) {
      fs.mkdirSync(trashDirPath, { recursive: true });
    }

    // Move file to trash
    fs.renameSync(from, trashPath);
    moved++;
    byCategory[category].push(name);
    console.log(`  ✓ Moved: ${relativePath}`);
  } catch (e) {
    errors.push({ file: relativePath, error: e.message });
    console.log(`  ❌ Error: ${relativePath} - ${e.message}`);
  }
});

console.log(`\n📊 Summary:`);
console.log(`  Total files: ${allToTrash.length}`);
console.log(`  Moved to .trash/: ${moved}`);
console.log(`  Skipped: ${skipped}`);
console.log(`  Errors: ${errors.length}`);

if (Object.keys(byCategory).some(cat => byCategory[cat].length > 0)) {
  console.log(`\n📦 By Category:`);
  if (byCategory.unused.length > 0) {
    console.log(`  Unused: ${byCategory.unused.length} components`);
  }
  if (byCategory.wrapper.length > 0) {
    console.log(`  Wrappers: ${byCategory.wrapper.length} components`);
  }
  if (byCategory.duplicate.length > 0) {
    console.log(`  Duplicates: ${byCategory.duplicate.length} components`);
  }
}

if (errors.length > 0) {
  console.log(`\n❌ Errors:`);
  errors.forEach(e => console.log(`  - ${e.file}: ${e.error}`));
}

console.log(`\n✅ Components moved to .trash/ for safe backup.`);
console.log(`   Review and delete .trash/ when confident everything works.\n`);
