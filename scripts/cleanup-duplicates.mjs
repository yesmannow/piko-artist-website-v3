#!/usr/bin/env node

/**
 * cleanup-duplicates.mjs - Remove duplicate studio components
 *
 * This script identifies and removes duplicate files, keeping only the canonical versions
 * in src/components/studio/
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

// Files to DELETE (keeping src/components/studio/ versions)
const filesToDelete = [
  // Duplicate Fader/Knob in controls folder (keep ui/controls versions)
  'src/components/studio/controls/Fader.tsx',
  'src/components/studio/controls/Knob.tsx',
  'src/components/studio/controls/StemRack.tsx',
  'src/components/studio/controls/index.ts',

  // Duplicate StudioGrid (keep layout version)
  'src/components/studio/StudioGrid.tsx',
  'src/components/studio/StudioHeader.tsx',

  // Deprecated UI components (replaced by StudioMonitor)
  'src/components/ui/TerminalLog.tsx',
  'src/components/ui/ComplexityToggle.tsx',
  'src/components/ui/DiagnosticsPanel.tsx',
  'src/components/ui/JogArtwork.tsx',
  'src/components/ui/JogArtwork.css',
  'src/components/ui/JogWheelPress.tsx',
  'src/components/ui/OverlayShell.tsx',
  'src/components/ui/Pad.tsx',
  'src/components/ui/PadMenu.tsx',
  'src/components/ui/ShortcutsOverlay.tsx',
  'src/components/ui/Skeleton.tsx',
  'src/components/ui/SmartSuggestions.tsx',
  'src/components/ui/StateBadge.tsx',
  'src/components/ui/StatusBar.tsx',

  // Deprecated top-level components
  'src/components/StudioControlBar.tsx',
  'src/components/StudioShell.tsx',

  // Legacy deck components (replaced by studio/ui/Deck.tsx)
  'src/components/deck/DeckDesktop.tsx',
  'src/components/deck/DeckMobile.tsx',
  'src/components/deck/DeckTablet.tsx',
];

// Directories to remove (empty after file cleanup)
const dirsToRemove = [
  'src/components/studio/controls',
  'src/components/ui',
];

async function cleanup() {
  console.log('🧹 Starting duplicate file cleanup...\n');

  let deletedCount = 0;
  let errorCount = 0;

  // Delete files
  for (const relPath of filesToDelete) {
    const fullPath = path.join(rootDir, relPath);
    try {
      await fs.access(fullPath);
      await fs.unlink(fullPath);
      console.log(`✅ Deleted: ${relPath}`);
      deletedCount++;
    } catch (err) {
      if (err.code !== 'ENOENT') {
        console.log(`⚠️  Error deleting ${relPath}: ${err.message}`);
        errorCount++;
      }
    }
  }

  // Remove empty directories
  for (const relPath of dirsToRemove) {
    const fullPath = path.join(rootDir, relPath);
    try {
      const files = await fs.readdir(fullPath);
      if (files.length === 0) {
        await fs.rmdir(fullPath);
        console.log(`✅ Removed empty dir: ${relPath}`);
      } else {
        console.log(`⚠️  Skipped ${relPath} (not empty)`);
      }
    } catch (err) {
      if (err.code !== 'ENOENT') {
        console.log(`⚠️  Error removing ${relPath}: ${err.message}`);
      }
    }
  }

  console.log(`\n✨ Cleanup complete!`);
  console.log(`   Deleted: ${deletedCount} files`);
  console.log(`   Errors: ${errorCount}`);
}

await cleanup();
