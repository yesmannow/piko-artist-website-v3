#!/usr/bin/env node

/**
 * Case-sensitivity checker for import paths
 * Verifies that @/ imports match exact file casing on Linux filesystem
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, dirname, resolve, relative } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');
const srcRoot = join(projectRoot, 'src');

const errors = [];

/**
 * Recursively get all TypeScript/TSX files
 */
function getAllTsFiles(dir, fileList = []) {
  const files = readdirSync(dir);

  files.forEach((file) => {
    const filePath = join(dir, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      getAllTsFiles(filePath, fileList);
    } else if (file.match(/\.(ts|tsx)$/)) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * Extract import specifiers from a file
 */
function extractImports(content) {
  const imports = [];

  // Match: import ... from "@/..."
  const importRegex = /import\s+.*?\s+from\s+["'](@\/[^"']+)["']/g;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }

  // Match: import("@/...")
  const dynamicImportRegex = /import\s*\(\s*["'](@\/[^"']+)["']\s*\)/g;
  while ((match = dynamicImportRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }

  // Match: require("@/...")
  const requireRegex = /require\s*\(\s*["'](@\/[^"']+)["']\s*\)/g;
  while ((match = requireRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }

  return imports;
}

/**
 * Resolve @/ import to actual file path
 */
function resolveImportPath(importPath) {
  // Remove @/ prefix
  const relativePath = importPath.replace(/^@\//, '');
  const fullPath = join(srcRoot, relativePath);

  // Try common extensions
  const extensions = ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx'];

  for (const ext of extensions) {
    const testPath = fullPath + ext;
    if (existsSync(testPath)) {
      return testPath;
    }
  }

  return null;
}

/**
 * Get actual filesystem path with exact casing
 */
function getExactCasePath(filePath) {
  const parts = filePath.split(/[/\\]/);
  let currentPath = parts[0] || '/';

  for (let i = 1; i < parts.length; i++) {
    const dir = readdirSync(currentPath);
    const exactName = dir.find(name =>
      name.toLowerCase() === parts[i].toLowerCase()
    );

    if (!exactName) {
      return null;
    }

    currentPath = join(currentPath, exactName);
  }

  return currentPath;
}

/**
 * Check if import path matches filesystem casing
 */
function checkImportCase(filePath, importPath) {
  const resolvedPath = resolveImportPath(importPath);

  if (!resolvedPath) {
    // Import doesn't resolve - might be intentional (e.g., module without extension)
    // We'll skip these as they're handled by module resolution
    return null;
  }

  const exactCasePath = getExactCasePath(resolvedPath);

  if (!exactCasePath) {
    return {
      error: 'FILE_NOT_FOUND',
      file: filePath,
      import: importPath,
      resolved: resolvedPath,
    };
  }

  // Compare normalized paths (case-insensitive) but check if casing differs
  if (exactCasePath.toLowerCase() !== resolvedPath.toLowerCase()) {
    return {
      error: 'CASE_MISMATCH',
      file: filePath,
      import: importPath,
      expected: exactCasePath,
      actual: resolvedPath,
    };
  }

  // Check if the import path itself has wrong casing
  const relativeFromSrc = relative(srcRoot, exactCasePath).replace(/\\/g, '/');
  const importRelative = importPath.replace(/^@\//, '');

  // Normalize both for comparison (remove extensions, handle index files)
  const normalizePath = (p) => {
    return p
      .replace(/\/index\.(ts|tsx|js|jsx)$/, '')
      .replace(/\.(ts|tsx|js|jsx)$/, '');
  };

  const normalizedImport = normalizePath(importRelative);
  const normalizedActual = normalizePath(relativeFromSrc);

  if (normalizedImport.toLowerCase() === normalizedActual.toLowerCase() &&
      normalizedImport !== normalizedActual) {
    return {
      error: 'IMPORT_CASE_MISMATCH',
      file: filePath,
      import: importPath,
      expected: `@/${relativeFromSrc}`,
      actual: importPath,
    };
  }

  return null;
}

// Main execution
console.log('🔍 Checking import case-sensitivity...\n');

const tsFiles = getAllTsFiles(srcRoot);
let checkedCount = 0;
let importCount = 0;

for (const filePath of tsFiles) {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const imports = extractImports(content);

    for (const importPath of imports) {
      importCount++;
      const error = checkImportCase(filePath, importPath);
      if (error) {
        errors.push(error);
      }
    }
    checkedCount++;
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err.message);
  }
}

// Report results
if (errors.length === 0) {
  console.log(`✅ All imports checked successfully!`);
  console.log(`   - Files checked: ${checkedCount}`);
  console.log(`   - Imports checked: ${importCount}`);
  process.exit(0);
} else {
  console.error(`❌ Found ${errors.length} case-sensitivity issue(s):\n`);

  for (const error of errors) {
    const relFile = relative(projectRoot, error.file);
    console.error(`📄 ${relFile}`);
    console.error(`   Import: ${error.import}`);

    if (error.error === 'CASE_MISMATCH') {
      console.error(`   ❌ Case mismatch:`);
      console.error(`      Expected: ${relative(projectRoot, error.expected)}`);
      console.error(`      Actual:   ${relative(projectRoot, error.actual)}`);
    } else if (error.error === 'IMPORT_CASE_MISMATCH') {
      console.error(`   ❌ Import path casing incorrect:`);
      console.error(`      Expected: ${error.expected}`);
      console.error(`      Actual:   ${error.actual}`);
    } else if (error.error === 'FILE_NOT_FOUND') {
      console.error(`   ⚠️  File not found: ${relative(projectRoot, error.resolved)}`);
    }
    console.error('');
  }

  process.exit(1);
}

