#!/usr/bin/env node
/**
 * Quick Status Check - Phase 1 Performance Pads
 * Run: node scripts/check-phase1-status.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
  bold: '\x1b[1m',
};

// Phase 1 files to check
const phase1Files = [
  // Components
  'src/components/studio/pads/PerformancePadGrid.tsx',
  'src/components/studio/pads/PadModeSelector.tsx',
  'src/components/studio/pads/HotCuePads.tsx',
  'src/components/studio/pads/LoopPads.tsx',
  'src/components/studio/pads/SlicerPads.tsx',
  'src/components/studio/pads/BeatJumpPads.tsx',
  'src/components/studio/pads/PadVisualizer.tsx',
  // Hooks
  'src/hooks/audio/useHotCues.ts',
  'src/hooks/audio/useLoops.ts',
  'src/hooks/audio/useSlicer.ts',
  // Audio Engine
  'src/audio/performance/CueEngine.ts',
  'src/audio/performance/LoopEngine.ts',
  'src/audio/performance/SlicerEngine.ts',
  // Database
  'src/lib/db/cues.ts',
  'src/lib/db/loops.ts',
  // Store
  'src/store/usePadStore.ts',
];

/**
 * Check if file exists and analyze its status
 */
function analyzeFile(filePath) {
  const fullPath = path.join(rootDir, filePath);

  if (!fs.existsSync(fullPath)) {
    return { exists: false, status: 'missing', todos: 0, lines: 0 };
  }

  const content = fs.readFileSync(fullPath, 'utf-8');
  const lines = content.split('\n').length;
  const todos = (content.match(/TODO:/g) || []).length;

  // Determine status based on content
  let status = 'skeleton';
  if (todos === 0 && lines > 50) {
    status = 'complete';
  } else if (todos > 0 && content.includes('export function') || content.includes('export class')) {
    status = 'partial';
  }

  return { exists: true, status, todos, lines };
}

/**
 * Main status check
 */
function checkStatus() {
  console.log(`\n${colors.bold}${colors.blue}🎯 Phase 1 - Performance Pads System - Status Check${colors.reset}\n`);
  console.log(`${colors.gray}${'─'.repeat(80)}${colors.reset}\n`);

  const results = {
    missing: [],
    skeleton: [],
    partial: [],
    complete: [],
  };

  let totalTodos = 0;
  let totalLines = 0;

  // Analyze each file
  phase1Files.forEach((file) => {
    const analysis = analyzeFile(file);
    const fileName = path.basename(file);

    if (!analysis.exists) {
      results.missing.push(file);
      console.log(`${colors.red}✗ ${colors.reset}${fileName} ${colors.red}(MISSING)${colors.reset}`);
    } else {
      totalTodos += analysis.todos;
      totalLines += analysis.lines;

      if (analysis.status === 'complete') {
        results.complete.push(file);
        console.log(`${colors.green}✓ ${colors.reset}${fileName} ${colors.green}(COMPLETE)${colors.reset} - ${analysis.lines} lines`);
      } else if (analysis.status === 'partial') {
        results.partial.push(file);
        console.log(`${colors.yellow}◐ ${colors.reset}${fileName} ${colors.yellow}(IN PROGRESS)${colors.reset} - ${analysis.todos} TODOs, ${analysis.lines} lines`);
      } else {
        results.skeleton.push(file);
        console.log(`${colors.gray}○ ${colors.reset}${fileName} ${colors.gray}(SKELETON)${colors.reset} - ${analysis.todos} TODOs, ${analysis.lines} lines`);
      }
    }
  });

  // Summary
  console.log(`\n${colors.gray}${'─'.repeat(80)}${colors.reset}\n`);
  console.log(`${colors.bold}📊 Summary${colors.reset}\n`);
  console.log(`Total Files:     ${phase1Files.length}`);
  console.log(`${colors.green}✓ Complete:${colors.reset}      ${results.complete.length}`);
  console.log(`${colors.yellow}◐ In Progress:${colors.reset}   ${results.partial.length}`);
  console.log(`${colors.gray}○ Skeleton:${colors.reset}      ${results.skeleton.length}`);
  console.log(`${colors.red}✗ Missing:${colors.reset}       ${results.missing.length}`);
  console.log(`\nTotal TODOs:     ${totalTodos}`);
  console.log(`Total Lines:     ${totalLines}`);

  // Progress percentage
  const completed = results.complete.length;
  const total = phase1Files.length;
  const progress = Math.round((completed / total) * 100);

  console.log(`\n${colors.bold}Progress:${colors.reset}        ${progress}% (${completed}/${total} files)`);

  // Progress bar
  const barLength = 50;
  const filledLength = Math.round((progress / 100) * barLength);
  const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
  console.log(`${colors.green}${bar}${colors.reset} ${progress}%`);

  // Next steps
  console.log(`\n${colors.bold}🚀 Next Steps${colors.reset}\n`);

  if (results.skeleton.length > 0) {
    console.log(`${colors.yellow}Start implementing:${colors.reset}`);
    const nextFile = results.skeleton[0];
    const nextFileName = path.basename(nextFile);
    console.log(`  1. Open ${colors.blue}${nextFileName}${colors.reset}`);
    console.log(`  2. Use Copilot Chat: ${colors.gray}@workspace Implement ${nextFile}${colors.reset}`);
    console.log(`  3. Follow ${colors.blue}docs/PHASE_1_QUICKSTART.md${colors.reset}`);
  } else if (results.partial.length > 0) {
    console.log(`${colors.yellow}Continue working on:${colors.reset}`);
    results.partial.forEach((file) => {
      console.log(`  - ${path.basename(file)}`);
    });
  } else if (results.complete.length === total) {
    console.log(`${colors.green}✅ Phase 1 complete! Generate Phase 2:${colors.reset}`);
    console.log(`  ${colors.gray}npm run generate:phase phase2-sampler${colors.reset}`);
  }

  console.log(`\n${colors.gray}${'─'.repeat(80)}${colors.reset}\n`);

  // Exit code
  if (results.missing.length > 0) {
    process.exit(1);
  }
}

// Run
checkStatus();
