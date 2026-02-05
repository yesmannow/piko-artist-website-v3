#!/usr/bin/env node
/**
 * Phase Skeleton Generator
 * Generates all files for a roadmap phase with boilerplate code
 *
 * Usage: node scripts/generate-phase.mjs phase1-pads
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..');

// Phase definitions with file structures and templates
const PHASES = {
  'phase1-pads': {
    name: 'Performance Pads System',
    files: {
      // Components
      'src/components/studio/pads/PerformancePadGrid.tsx': {
        template: 'react-component',
        imports: ['React', 'Framer Motion', 'usePadStore'],
        description: 'Main 8-pad grid with mode selector',
      },
      'src/components/studio/pads/PadModeSelector.tsx': {
        template: 'react-component',
        imports: ['React', 'usePadStore'],
        description: 'Switch between Hot Cue/Loop/Slicer/Sampler modes',
      },
      'src/components/studio/pads/HotCuePads.tsx': {
        template: 'react-component',
        imports: ['React', 'useHotCues', 'useAudioEngine'],
        description: '8 hot cue buttons with set/jump/delete',
      },
      'src/components/studio/pads/LoopPads.tsx': {
        template: 'react-component',
        imports: ['React', 'useLoops', 'useAudioEngine'],
        description: 'Auto-loop pads (4/8/16/32 beats)',
      },
      'src/components/studio/pads/SlicerPads.tsx': {
        template: 'react-component',
        imports: ['React', 'useSlicer', 'useAudioEngine'],
        description: 'Beat slicer mode (divide loop into 8 slices)',
      },
      'src/components/studio/pads/BeatJumpPads.tsx': {
        template: 'react-component',
        imports: ['React', 'useAudioEngine'],
        description: 'Jump forward/backward by beats',
      },
      'src/components/studio/pads/PadVisualizer.tsx': {
        template: 'react-component',
        imports: ['React', 'Framer Motion'],
        description: 'Visual feedback for pad triggers',
      },

      // Hooks
      'src/hooks/audio/useHotCues.ts': {
        template: 'custom-hook',
        imports: ['useState', 'useEffect', 'Dexie'],
        description: 'Manage hot cue points per track',
      },
      'src/hooks/audio/useLoops.ts': {
        template: 'custom-hook',
        imports: ['useState', 'useEffect', 'Tone.js'],
        description: 'Loop management and beat-synced loops',
      },
      'src/hooks/audio/useSlicer.ts': {
        template: 'custom-hook',
        imports: ['useState', 'useEffect', 'Tone.js'],
        description: 'Beat slicing engine',
      },

      // Audio Engine
      'src/audio/performance/CueEngine.ts': {
        template: 'class',
        imports: ['Tone.js'],
        description: 'Cue point management and jump logic',
      },
      'src/audio/performance/LoopEngine.ts': {
        template: 'class',
        imports: ['Tone.js'],
        description: 'Loop playback and beat quantization',
      },
      'src/audio/performance/SlicerEngine.ts': {
        template: 'class',
        imports: ['Tone.js'],
        description: 'Beat slicing and slice triggering',
      },

      // Database
      'src/lib/db/cues.ts': {
        template: 'dexie-table',
        imports: ['Dexie'],
        description: 'Hot cue points storage (per track)',
      },
      'src/lib/db/loops.ts': {
        template: 'dexie-table',
        imports: ['Dexie'],
        description: 'Saved loops storage (per track)',
      },

      // Store
      'src/store/usePadStore.ts': {
        template: 'zustand-store',
        imports: ['Zustand'],
        description: 'Pad mode state (Hot Cue/Loop/Slicer per deck)',
      },
    },
  },

  'phase2-sampler': {
    name: 'Sampler & Sequencer',
    files: {
      'src/components/studio/sampler/SamplerRack.tsx': {
        template: 'react-component',
        description: 'Main sampler UI with 8 slots',
      },
      'src/components/studio/sampler/SampleSlot.tsx': {
        template: 'react-component',
        description: 'Individual sample pad',
      },
      'src/components/studio/sampler/SampleRecorder.tsx': {
        template: 'react-component',
        description: 'Record samples from deck/master output',
      },
      'src/components/studio/sampler/SampleBrowser.tsx': {
        template: 'react-component',
        description: 'R2 sample library browser',
      },
      'src/components/studio/sampler/SequencerGrid.tsx': {
        template: 'react-component',
        description: '8-track loop sequencer',
      },
      'src/hooks/audio/useSampler.ts': {
        template: 'custom-hook',
        description: 'Sample playback and management',
      },
      'src/audio/sampler/SamplerEngine.ts': {
        template: 'class',
        description: 'Tone.js sampler implementation',
      },
      'src/lib/db/samples.ts': {
        template: 'dexie-table',
        description: 'Sample metadata storage',
      },
      'src/store/useSamplerStore.ts': {
        template: 'zustand-store',
        description: 'Sampler state management',
      },
    },
  },

  'phase3-midi': {
    name: 'MIDI/Hardware Support',
    files: {
      'src/lib/midi/MIDIManager.ts': {
        template: 'class',
        description: 'Web MIDI API wrapper',
      },
      'src/lib/midi/MIDILearn.ts': {
        template: 'class',
        description: 'MIDI learn mode implementation',
      },
      'src/lib/midi/MIDIMapper.ts': {
        template: 'class',
        description: 'Mapping engine (CC/Note to controls)',
      },
      'src/lib/midi/mappings/pioneer-ddj-400.json': {
        template: 'midi-mapping',
        description: 'Pioneer DDJ-400 controller mapping',
      },
      'src/lib/midi/mappings/numark-mixtrack-pro-fx.json': {
        template: 'midi-mapping',
        description: 'Numark Mixtrack Pro FX mapping',
      },
      'src/components/studio/midi/MIDISettings.tsx': {
        template: 'react-component',
        description: 'MIDI settings panel',
      },
      'src/components/studio/midi/MIDILearnModal.tsx': {
        template: 'react-component',
        description: 'MIDI learn UI',
      },
      'src/hooks/useMIDI.ts': {
        template: 'custom-hook',
        description: 'MIDI connection and message handling',
      },
      'src/store/useMIDIStore.ts': {
        template: 'zustand-store',
        description: 'MIDI state and mappings',
      },
    },
  },

  'phase4-fx': {
    name: 'Effects Expansion',
    files: {
      'src/audio/fx/BeatSyncedFX.ts': {
        template: 'class',
        description: 'Base class for beat-aware effects',
      },
      'src/audio/fx/GateEffect.ts': {
        template: 'class',
        description: 'Rhythmic gate effect (1/4, 1/8, 1/16)',
      },
      'src/audio/fx/RollEffect.ts': {
        template: 'class',
        description: 'Beat roll effect',
      },
      'src/audio/fx/PhaserEffect.ts': {
        template: 'class',
        description: 'Phaser with LFO',
      },
      'src/audio/fx/BitCrusherEffect.ts': {
        template: 'class',
        description: 'Lo-fi bit crusher',
      },
      'src/components/studio/fx/BeatFXPanel.tsx': {
        template: 'react-component',
        description: 'Beat-synced FX controls',
      },
      'src/components/studio/fx/FXChainEditor.tsx': {
        template: 'react-component',
        description: 'Multi-FX chain routing',
      },
      'src/store/useFXStore.ts': {
        template: 'zustand-store',
        description: 'FX state and presets',
      },
    },
  },
};

// Code templates
const TEMPLATES = {
  'react-component': (fileName, meta) => `'use client';

import React from 'react';
${meta.imports?.map(imp => `// TODO: import ${imp}`).join('\n') || ''}

interface ${getComponentName(fileName)}Props {
  deckId?: 'A' | 'B';
}

/**
 * ${meta.description}
 *
 * @see DEVELOPMENT_ROADMAP_2026.md - ${PHASES[process.argv[2]]?.name}
 */
export function ${getComponentName(fileName)}({ deckId = 'A' }: ${getComponentName(fileName)}Props) {
  // TODO: Implement ${meta.description}

  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs font-mono text-white/60">
        ${getComponentName(fileName)} [Deck {deckId}]
      </div>
      {/* TODO: Add UI */}
    </div>
  );
}
`,

  'custom-hook': (fileName, meta) => `import { useState, useEffect } from 'react';
${meta.imports?.map(imp => `// TODO: import ${imp}`).join('\n') || ''}

/**
 * ${meta.description}
 *
 * @see DEVELOPMENT_ROADMAP_2026.md - ${PHASES[process.argv[2]]?.name}
 */
export function ${getHookName(fileName)}(deckId: 'A' | 'B') {
  // TODO: Implement ${meta.description}

  return {
    // TODO: Add hook return values
  };
}
`,

  'class': (fileName, meta) => `/**
 * ${meta.description}
 *
 * @see DEVELOPMENT_ROADMAP_2026.md - ${PHASES[process.argv[2]]?.name}
 */
export class ${getClassName(fileName)} {
  // TODO: Implement ${meta.description}

  constructor() {
    // TODO: Initialize
  }
}
`,

  'dexie-table': (fileName, meta) => `import { db } from '@/lib/db/client';

/**
 * ${meta.description}
 *
 * Schema:
 * - trackKey: string (indexed)
 * - data: object
 * - updatedAt: number
 *
 * @see DEVELOPMENT_ROADMAP_2026.md - ${PHASES[process.argv[2]]?.name}
 */

// TODO: Add to db.ts:
// ${getTableName(fileName)}: Dexie.Table<${getTypeName(fileName)}>;

export interface ${getTypeName(fileName)} {
  trackKey: string;
  // TODO: Add fields
  updatedAt: number;
}

// TODO: Add to db version schema:
// ${getTableName(fileName)}: 'trackKey, updatedAt'
`,

  'zustand-store': (fileName, meta) => `import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

/**
 * ${meta.description}
 *
 * @see DEVELOPMENT_ROADMAP_2026.md - ${PHASES[process.argv[2]]?.name}
 */

interface ${getStoreName(fileName)}State {
  // TODO: Add state properties
}

export const ${getStoreName(fileName)} = create<${getStoreName(fileName)}State>()(
  subscribeWithSelector((set, get) => ({
    // TODO: Implement state
  }))
);
`,

  'midi-mapping': (fileName, meta) => JSON.stringify({
    name: getControllerName(fileName),
    vendor: getVendorName(fileName),
    channels: {
      deckA: 0,
      deckB: 1,
    },
    controls: {
      // TODO: Add MIDI mappings
      crossfader: { type: 'cc', channel: 0, cc: 8, min: 0, max: 127 },
      deckA_volume: { type: 'cc', channel: 0, cc: 13, min: 0, max: 127 },
      deckA_playPause: { type: 'note', channel: 0, note: 11 },
      // See: https://github.com/djipco/webmidi
    },
  }, null, 2),
};

// Helper functions
function getComponentName(fileName) {
  return path.basename(fileName, '.tsx');
}

function getHookName(fileName) {
  return path.basename(fileName, '.ts');
}

function getClassName(fileName) {
  const base = path.basename(fileName, '.ts');
  return base.replace(/([A-Z])/g, ' $1').trim().replace(/\s+/g, '');
}

function getTableName(fileName) {
  return path.basename(fileName, '.ts');
}

function getTypeName(fileName) {
  const base = path.basename(fileName, '.ts');
  return base.charAt(0).toUpperCase() + base.slice(1);
}

function getStoreName(fileName) {
  return path.basename(fileName, '.ts');
}

function getControllerName(fileName) {
  return path.basename(fileName, '.json')
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function getVendorName(fileName) {
  return path.basename(fileName, '.json').split('-')[0];
}

// Main execution
async function main() {
  const phaseName = process.argv[2];

  if (!phaseName || !PHASES[phaseName]) {
    console.error('❌ Invalid phase name');
    console.log('\nAvailable phases:');
    Object.keys(PHASES).forEach(key => {
      console.log(`  - ${key}: ${PHASES[key].name}`);
    });
    console.log('\nUsage: node scripts/generate-phase.mjs phase1-pads');
    process.exit(1);
  }

  const phase = PHASES[phaseName];
  const files = phase.files;

  console.log(`\n🚀 Generating Phase: ${phase.name}`);
  console.log(`📁 Files to create: ${Object.keys(files).length}\n`);

  let created = 0;
  let skipped = 0;

  for (const [filePath, meta] of Object.entries(files)) {
    const fullPath = path.join(ROOT, filePath);

    // Check if file exists
    try {
      await fs.access(fullPath);
      console.log(`⏭️  Skipped (exists): ${filePath}`);
      skipped++;
      continue;
    } catch {
      // File doesn't exist, create it
    }

    // Create directory
    await fs.mkdir(path.dirname(fullPath), { recursive: true });

    // Generate content
    const template = TEMPLATES[meta.template];
    if (!template) {
      console.warn(`⚠️  Unknown template: ${meta.template} for ${filePath}`);
      continue;
    }

    const content = template(filePath, meta);
    await fs.writeFile(fullPath, content, 'utf-8');

    console.log(`✅ Created: ${filePath}`);
    created++;
  }

  console.log(`\n🎉 Phase skeleton generated!`);
  console.log(`   Created: ${created} files`);
  console.log(`   Skipped: ${skipped} files (already exist)`);
  console.log(`\n📝 Next steps:`);
  console.log(`   1. Review generated files`);
  console.log(`   2. Ask Copilot to implement TODOs`);
  console.log(`   3. Run: npm run build`);
  console.log(`   4. Run: npm run lint`);
  console.log(`\n💡 Tip: Use @workspace in Copilot Chat to implement features`);
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
