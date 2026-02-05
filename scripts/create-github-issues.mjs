#!/usr/bin/env node
/**
 * GitHub Issue Generator
 * Creates GitHub issues for all 8 roadmap phases
 *
 * Usage: node scripts/create-github-issues.mjs
 *
 * Requirements:
 * - GitHub CLI installed (gh)
 * - Authenticated: gh auth login
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const PHASES = [
  {
    title: 'Phase 1: Performance Pad Revolution 🎹',
    duration: '4-6 weeks',
    priority: 'CRITICAL',
    labels: ['enhancement', 'phase1', 'critical', 'audio-engine'],
    body: `
## Goal
Transform stem-only pads into a full performance system matching industry standards (VirtualDJ/djay Pro).

## Features

### 1.1 Hot Cue System (Week 1-2)
- [ ] 8 hot cues per deck (stored in Dexie)
- [ ] Visual cue markers on waveform
- [ ] Color-coded cue points
- [ ] Cue set/delete/jump controls
- [ ] Keyboard shortcuts (1-8 for cues)
- [ ] Persistent cue storage per track

### 1.2 Loop Performance Pads (Week 2-3)
- [ ] 4/8/16/32 beat auto-loops
- [ ] Manual loop in/out points
- [ ] Loop roll (temporary loops)
- [ ] Saved loops per track
- [ ] Loop doubling/halving
- [ ] Loop move (shift loop forward/back)

### 1.3 Pad Mode System (Week 3-4)
- [ ] Mode selector UI (Hot Cue / Loops / Sampler / Slicer)
- [ ] Per-deck pad mode independence
- [ ] Visual mode indicators
- [ ] Touch-optimized pad grid (8 pads)

### 1.4 Slicer Mode (Week 4-5)
- [ ] Beat slicer (divide loop into 8 slices)
- [ ] Slice playback on pad press
- [ ] Quantized slice triggering
- [ ] Slice loop mode

### 1.5 Beat Jump (Week 5-6)
- [ ] Jump forward/backward by beats (1/2/4/8/16)
- [ ] Jump to cue points
- [ ] Visual feedback on waveform

## Files to Create
See \`docs/DEVELOPMENT_ROADMAP_2026.md\` Phase 1 for complete file list.

## Success Criteria
- [ ] DJs can set 8 hot cues and jump to them instantly
- [ ] Auto-loops work perfectly in sync with beat grid
- [ ] Slicer mode enables creative chopping
- [ ] All pad modes work on mobile touch

## Architecture Requirements
- ✅ Tone.js for all audio playback (no WaveSurfer playback)
- ✅ Dexie for cue/loop persistence (use trackKey, not URLs)
- ✅ No client-side secrets
- ✅ Components <300 lines (split into smaller modules)

## Related
- Roadmap: \`docs/DEVELOPMENT_ROADMAP_2026.md\`
- Architecture: \`docs/ARCHITECTURE.md\`
- Copilot Instructions: \`.github/copilot-instructions.md\`
    `,
  },
  {
    title: 'Phase 2: Sampler & Sequencer 🎵',
    duration: '6-8 weeks',
    priority: 'CRITICAL',
    labels: ['enhancement', 'phase2', 'critical', 'audio-engine'],
    body: `
## Goal
Build professional sampler rivaling VirtualDJ's unlimited banks and djay Pro's looper.

## Features

### 2.1 Sample Player (Week 1-2)
- [ ] 8 sample slots per deck
- [ ] Playback modes (one-shot, loop, stutter, gate)
- [ ] Volume/pitch per sample
- [ ] BPM sync

### 2.2 Sample Recorder (Week 2-3)
- [ ] Record from master/deck output
- [ ] Record from external input
- [ ] Auto-quantize to beat
- [ ] Save to R2 bucket

### 2.3 Sample Library (Week 3-4)
- [ ] R2 sample browser
- [ ] Drag-and-drop loading
- [ ] Sample categories
- [ ] Built-in sample pack

### 2.4 Sequencer/Looper (Week 4-6)
- [ ] 8-track loop sequencer
- [ ] Real-time recording
- [ ] Overdub mode
- [ ] Export loop sessions

### 2.5 Sample Effects (Week 6-7)
- [ ] Per-sample filter/reverb/delay
- [ ] Sample reverse/pitch shift/time-stretch

### 2.6 Sample Banks (Week 7-8)
- [ ] Multiple banks (A/B/C/D)
- [ ] Save/load presets

## Success Criteria
- [ ] 8 samples per deck trigger instantly
- [ ] Sequencer enables live loop performance
- [ ] Samples sync to master BPM

## Related
- Depends on: Phase 1 (Performance Pads)
- Roadmap: \`docs/DEVELOPMENT_ROADMAP_2026.md\`
    `,
  },
  {
    title: 'Phase 3: MIDI/Hardware Revolution 🎛️',
    duration: '8-10 weeks',
    priority: 'CRITICAL',
    labels: ['enhancement', 'phase3', 'critical', 'hardware'],
    body: `
## Goal
Enable Piko Studio to work with physical DJ controllers via Web MIDI API.

## Features

### 3.1 Web MIDI Foundation (Week 1-2)
- [ ] Web MIDI API wrapper
- [ ] Controller auto-detection
- [ ] MIDI message parsing
- [ ] Multiple controller support

### 3.2 MIDI Learn System (Week 2-4)
- [ ] MIDI Learn mode toggle
- [ ] Visual feedback during learning
- [ ] Save mappings to localStorage
- [ ] Export/import mappings

### 3.3 Pre-Built Mappings (Week 4-7)
- [ ] Pioneer DDJ-400
- [ ] Pioneer DDJ-FLX4
- [ ] Numark Mixtrack Pro FX
- [ ] Numark Party Mix
- [ ] Hercules Inpulse 300
- [ ] Reloop Beatpad 2

### 3.4 Mapping Editor (Week 7-9)
- [ ] Visual mapping editor
- [ ] Curve adjustment
- [ ] LED feedback configuration

### 3.5 Controller Profiles (Week 9-10)
- [ ] Layout visualization
- [ ] Help overlay

## Success Criteria
- [ ] Pioneer DDJ-400 works plug-and-play
- [ ] MIDI Learn enables custom mappings
- [ ] Controller feedback (LEDs) works
- [ ] Mappings persist across sessions

## Related
- Roadmap: \`docs/DEVELOPMENT_ROADMAP_2026.md\`
    `,
  },
  {
    title: 'Phase 4: Effects Expansion 🎚️',
    duration: '6-8 weeks',
    priority: 'HIGH',
    labels: ['enhancement', 'phase4', 'effects'],
    body: `
## Goal
Expand from 5 basic effects to 30+ professional effects with beat-sync.

## Features

### Beat-Synced Effects
- [ ] Gate, Roll/Stutter, Beatmasher, Slicer, Beat Repeat

### Modulation Effects
- [ ] Phaser, Flanger, Tremolo, Auto-Pan, Ring Mod, Vibrato

### Frequency Effects
- [ ] Bit Crusher, Auto-Filter, Formant Filter, Comb Filter

### Creative Effects
- [ ] Enhanced Reverb/Delay/Echo, Distortion, Overdrive, Lo-Fi

### Color FX
- [ ] Jet, Zip, Crush, Spiral (Pioneer-style)

### FX Routing
- [ ] Multi-FX chains (up to 4 effects)
- [ ] Series/parallel routing
- [ ] FX presets

## Success Criteria
- [ ] 30+ effects available
- [ ] Beat-synced effects lock to tempo
- [ ] Multi-FX chains work smoothly

## Related
- Roadmap: \`docs/DEVELOPMENT_ROADMAP_2026.md\`
    `,
  },
  {
    title: 'Phase 5: Library & Playlist Management 📚',
    duration: '4-6 weeks',
    priority: 'HIGH',
    labels: ['enhancement', 'phase5', 'library'],
    body: `
## Goal
Transform basic track browser into professional library management system.

## Features

### 5.1 Playlist System
- [ ] Create/rename/delete playlists
- [ ] Nested playlists (folders)
- [ ] Smart playlists (auto-populate)
- [ ] Import/export (M3U, PLS)

### 5.2 Smart Folders
- [ ] Auto-filter by BPM/key/genre/energy
- [ ] Compatible songs (harmonic mixing)

### 5.3 Tag Editor
- [ ] Edit BPM, key, genre, cue points
- [ ] Batch edit

### 5.4 Duplicate Detection
- [ ] Scan for duplicates
- [ ] Acoustic fingerprinting

### 5.5 History & Analytics
- [ ] Play history, play count, session history

### 5.6 Advanced Search
- [ ] Multi-field search with operators

## Success Criteria
- [ ] Unlimited playlists
- [ ] Smart folders auto-update
- [ ] Tag editor works seamlessly

## Related
- Roadmap: \`docs/DEVELOPMENT_ROADMAP_2026.md\`
    `,
  },
  {
    title: 'Phase 6: Automix Engine 🤖',
    duration: '6-8 weeks',
    priority: 'HIGH',
    labels: ['enhancement', 'phase6', 'ai', 'automation'],
    body: `
## Goal
Enable automatic mixing for background music and hands-free performance.

## Features

### 6.1 Transition Planner
- [ ] Analyze track structure (intro/verse/chorus/outro)
- [ ] Detect best mix points
- [ ] Energy-level matching

### 6.2 Automix Engine
- [ ] Auto-load next track
- [ ] Auto-sync BPM
- [ ] Auto-crossfade at mix point
- [ ] EQ blending

### 6.3 Queue Management
- [ ] Drag-drop reordering
- [ ] Queue from playlist
- [ ] Shuffle/repeat modes

### 6.4 Transition Editor
- [ ] Manual mix point selection
- [ ] Custom transition length
- [ ] FX automation

### 6.5 Energy Curve
- [ ] Visualize energy levels
- [ ] Plan energy progression

### 6.6 Automix Settings
- [ ] Transition style (smooth/quick/creative)
- [ ] Key-matching priority

## Success Criteria
- [ ] Seamless transitions
- [ ] Professional sound quality
- [ ] Intuitive queue management

## Related
- Depends on: Phase 5 (Library)
- Roadmap: \`docs/DEVELOPMENT_ROADMAP_2026.md\`
    `,
  },
  {
    title: 'Phase 7: DVS & Advanced Vinyl 🎚️',
    duration: '8-10 weeks',
    priority: 'HIGH',
    labels: ['enhancement', 'phase7', 'dvs', 'hardware'],
    body: `
## Goal
Enable turntable/CDJ control via timecode vinyl/CDs (for Pro DJs).

## Features

### 7.1 Timecode Detection
- [ ] Analyze audio for timecode signal
- [ ] Detect pitch/direction
- [ ] Handle needle drops
- [ ] Support VirtualDJ/Serato/Traktor timecode

### 7.2 DVS Engine
- [ ] Low-latency playback (<5ms)
- [ ] Scratch detection
- [ ] Absolute vs relative mode

### 7.3 Audio Interface
- [ ] Web Audio input routing
- [ ] Calibration wizard
- [ ] Input level meters

### 7.4 DVS Settings
- [ ] Timecode selection
- [ ] Latency compensation
- [ ] Scratch sensitivity

### 7.5 Vinyl Emulation
- [ ] Motor start/stop, backspin, brake, reverse

## Success Criteria
- [ ] Timecode vinyl works with turntables
- [ ] <5ms latency (scratching feels natural)
- [ ] Needle drops work instantly

## Related
- Depends on: Phase 3 (MIDI/Hardware)
- Roadmap: \`docs/DEVELOPMENT_ROADMAP_2026.md\`
    `,
  },
  {
    title: 'Phase 8: Streaming & Social 🌐',
    duration: '6-8 weeks',
    priority: 'MEDIUM',
    labels: ['enhancement', 'phase8', 'integration', 'streaming'],
    body: `
## Goal
Add online music catalog integration and broadcasting capabilities.

## Features

### 8.1 Spotify Integration
- [ ] Spotify Web API
- [ ] Browse/search Spotify
- [ ] Load tracks (if SDK allows)
- [ ] Playlist import

### 8.2 SoundCloud Integration
- [ ] SoundCloud API
- [ ] Browse/load tracks

### 8.3 Local File Support
- [ ] Drag-drop MP3/WAV/FLAC/AAC
- [ ] File system API
- [ ] iTunes library import

### 8.4 Cloud Storage Sync
- [ ] Google Drive, Dropbox, OneDrive
- [ ] Auto-sync playlists/cue points

### 8.5 Broadcasting
- [ ] Shoutcast/Icecast streaming
- [ ] RTMP (Twitch/YouTube)
- [ ] Audio/video broadcasting

## Success Criteria
- [ ] Spotify tracks load and play
- [ ] Local files can be imported
- [ ] Broadcasting works to popular platforms

## Related
- Depends on: Phase 5 (Library)
- Roadmap: \`docs/DEVELOPMENT_ROADMAP_2026.md\`
    `,
  },
];

async function checkGitHubCLI() {
  try {
    const { stdout } = await execAsync('gh --version');
    console.log('✅ GitHub CLI found:', stdout.trim().split('\n')[0]);
    return true;
  } catch {
    console.error('❌ GitHub CLI not found');
    console.log('\nInstall GitHub CLI:');
    console.log('  Windows: winget install GitHub.cli');
    console.log('  macOS: brew install gh');
    console.log('  Linux: sudo apt install gh');
    console.log('\nThen authenticate:');
    console.log('  gh auth login');
    return false;
  }
}

async function checkAuth() {
  try {
    await execAsync('gh auth status');
    console.log('✅ GitHub authenticated\n');
    return true;
  } catch {
    console.error('❌ Not authenticated with GitHub');
    console.log('\nAuthenticate with:');
    console.log('  gh auth login');
    return false;
  }
}

async function createIssue(phase) {
  const labelsArg = phase.labels.map(l => `-l "${l}"`).join(' ');
  const bodyFile = `/tmp/gh-issue-body-${Date.now()}.txt`;

  // Write body to temp file (handles multiline)
  await import('fs').then(fs =>
    fs.promises.writeFile(bodyFile, phase.body.trim())
  );

  const command = `gh issue create --title "${phase.title}" ${labelsArg} --body-file "${bodyFile}" --repo yesmannow/piko-artist-website-v3`;

  try {
    const { stdout } = await execAsync(command);
    const issueUrl = stdout.trim();
    console.log(`✅ Created: ${phase.title}`);
    console.log(`   ${issueUrl}\n`);
    return issueUrl;
  } catch (err) {
    console.error(`❌ Failed to create: ${phase.title}`);
    console.error(`   ${err.message}\n`);
    return null;
  }
}

async function main() {
  console.log('\n🚀 GitHub Issue Generator for Piko Studio Roadmap\n');

  // Check prerequisites
  if (!(await checkGitHubCLI())) return;
  if (!(await checkAuth())) return;

  console.log(`📋 Creating ${PHASES.length} issues...\n`);

  const results = [];

  for (const phase of PHASES) {
    const url = await createIssue(phase);
    if (url) results.push({ phase: phase.title, url });

    // Rate limit: wait 1s between issues
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n' + '─'.repeat(60));
  console.log('\n📊 Summary');
  console.log(`   Created: ${results.length}/${PHASES.length} issues`);

  if (results.length > 0) {
    console.log('\n🔗 Issue Links:');
    results.forEach(({ phase, url }) => {
      console.log(`   - ${phase}`);
      console.log(`     ${url}`);
    });
  }

  console.log('\n💡 Next steps:');
  console.log('   1. Review issues on GitHub');
  console.log('   2. Add to project board');
  console.log('   3. Assign to milestones');
  console.log('   4. Start with Phase 1! 🎹\n');
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
