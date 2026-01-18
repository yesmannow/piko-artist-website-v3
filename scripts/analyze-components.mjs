import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Get all component files
function getAllComponents(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllComponents(filePath, fileList);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

// Get component name from file
function getComponentName(filePath) {
  const relativePath = path.relative(path.join(rootDir, 'src'), filePath);
  const name = path.basename(filePath, path.extname(filePath));
  return { name, path: relativePath.replace(/\\/g, '/') };
}

// Find all imports of a component
function findImports(componentName, componentPath, allFiles) {
  const imports = [];
  const searchPatterns = [
    new RegExp(`from\\s+["'].*${componentName}["']`, 'g'),
    new RegExp(`import\\s+.*${componentName}`, 'g'),
    new RegExp(`import\\s+.*from\\s+["'].*${componentPath.replace(/\.tsx?$/, '')}["']`, 'g'),
  ];

  allFiles.forEach(file => {
    if (file === componentPath) return; // Skip self

    try {
      const content = fs.readFileSync(file, 'utf-8');
      const hasImport = searchPatterns.some(pattern => pattern.test(content));

      if (hasImport) {
        imports.push(path.relative(rootDir, file));
      }
    } catch (e) {
      // Skip files that can't be read
    }
  });

  return imports;
}

// Main analysis
const componentsDir = path.join(rootDir, 'src', 'components');
const allComponents = getAllComponents(componentsDir);
const allSourceFiles = getAllComponents(path.join(rootDir, 'src'));

const analysis = {
  wrappers: [],
  unused: [],
  duplicates: [],
  used: [],
  total: allComponents.length,
};

// Known duplicates/wrappers
const knownDuplicates = {
  'DJInterface': 'RefactoredDJInterface',
  'DJDeck': 'RefactoredDJDeck',
  'DJMixerModule': 'RefactoredDJMixerModule',
  'Navbar': 'NavBar', // Check if Navbar is used
  'MobileNav': null, // Check if used
  'Player': 'PersistentPlayer', // Check if Player is used
};

allComponents.forEach(compPath => {
  const { name, path: relPath } = getComponentName(compPath);
  const imports = findImports(name, compPath, allSourceFiles);

  // Check if it's a wrapper
  if (knownDuplicates[name]) {
    const content = fs.readFileSync(compPath, 'utf-8');
    if (content.includes('export') && content.includes(knownDuplicates[name])) {
      analysis.wrappers.push({
        name,
        path: relPath,
        wraps: knownDuplicates[name],
        imports: imports.length,
      });
      return;
    }
  }

  // Check for duplicates
  const duplicate = Object.entries(knownDuplicates).find(([k, v]) => v === name);
  if (duplicate) {
    analysis.duplicates.push({
      name,
      path: relPath,
      original: duplicate[0],
      imports: imports.length,
    });
  }

  if (imports.length === 0) {
    analysis.unused.push({
      name,
      path: relPath,
    });
  } else {
    analysis.used.push({
      name,
      path: relPath,
      imports: imports.length,
      usedIn: imports.slice(0, 5), // First 5 files
    });
  }
});

// Output results
console.log('\n=== COMPONENT ANALYSIS ===\n');
console.log(`Total Components: ${analysis.total}\n`);

console.log('📦 WRAPPER COMPONENTS (can be removed):');
analysis.wrappers.forEach(w => {
  console.log(`  - ${w.name} → wraps ${w.wraps} (${w.imports} imports)`);
});

console.log('\n🗑️  UNUSED COMPONENTS (candidates for removal):');
analysis.unused.slice(0, 20).forEach(u => {
  console.log(`  - ${u.name} (${u.path})`);
});
if (analysis.unused.length > 20) {
  console.log(`  ... and ${analysis.unused.length - 20} more`);
}

console.log('\n📋 DUPLICATE COMPONENTS:');
analysis.duplicates.forEach(d => {
  console.log(`  - ${d.name} (duplicate of ${d.original})`);
});

console.log('\n✅ USED COMPONENTS:', analysis.used.length);
console.log('\n📊 SUMMARY:');
console.log(`  Wrappers: ${analysis.wrappers.length}`);
console.log(`  Unused: ${analysis.unused.length}`);
console.log(`  Duplicates: ${analysis.duplicates.length}`);
console.log(`  Used: ${analysis.used.length}`);

// Write detailed report
const report = {
  summary: {
    total: analysis.total,
    wrappers: analysis.wrappers.length,
    unused: analysis.unused.length,
    duplicates: analysis.duplicates.length,
    used: analysis.used.length,
  },
  wrappers: analysis.wrappers,
  unused: analysis.unused,
  duplicates: analysis.duplicates,
};

fs.writeFileSync(
  path.join(rootDir, 'component-analysis.json'),
  JSON.stringify(report, null, 2)
);

console.log('\n📄 Detailed report saved to component-analysis.json');
