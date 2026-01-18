import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Reorganization mapping: old path -> new path
const reorgMappings = [
  // Studio components
  {
    from: 'src/components/RefactoredDJInterface.tsx',
    to: 'src/components/studio/RefactoredDJInterface.tsx',
    description: 'Move RefactoredDJInterface to studio/'
  },
  {
    from: 'src/components/RefactoredDJDeck.tsx',
    to: 'src/components/studio/RefactoredDJDeck.tsx',
    description: 'Move RefactoredDJDeck to studio/'
  },
  {
    from: 'src/components/RefactoredDJMixerModule.tsx',
    to: 'src/components/studio/RefactoredDJMixerModule.tsx',
    description: 'Move RefactoredDJMixerModule to studio/'
  },
  // Studio controls
  {
    from: 'src/components/dj-ui/AudioReactiveVisualizer.tsx',
    to: 'src/components/studio/controls/AudioReactiveVisualizer.tsx',
    description: 'Move AudioReactiveVisualizer to studio/controls/'
  },
  {
    from: 'src/components/dj-ui/Crossfader.tsx',
    to: 'src/components/studio/controls/Crossfader.tsx',
    description: 'Move Crossfader to studio/controls/'
  },
  {
    from: 'src/components/dj-ui/Fader.tsx',
    to: 'src/components/studio/controls/Fader.tsx',
    description: 'Move Fader to studio/controls/'
  },
  {
    from: 'src/components/dj-ui/JogWheel3D.tsx',
    to: 'src/components/studio/controls/JogWheel3D.tsx',
    description: 'Move JogWheel3D to studio/controls/'
  },
  {
    from: 'src/components/dj-ui/Knob.tsx',
    to: 'src/components/studio/controls/Knob.tsx',
    description: 'Move Knob to studio/controls/'
  },
  {
    from: 'src/components/dj-ui/VUMeter.tsx',
    to: 'src/components/studio/controls/VUMeter.tsx',
    description: 'Move VUMeter to studio/controls/'
  },
  {
    from: 'src/components/dj-ui/Waveform.tsx',
    to: 'src/components/studio/controls/Waveform.tsx',
    description: 'Move Waveform to studio/controls/'
  },
  {
    from: 'src/components/dj-ui/XYPad.tsx',
    to: 'src/components/studio/controls/XYPad.tsx',
    description: 'Move XYPad to studio/controls/'
  },
  {
    from: 'src/components/dj-ui/RemixGrid.tsx',
    to: 'src/components/studio/controls/RemixGrid.tsx',
    description: 'Move RemixGrid to studio/controls/'
  },
  {
    from: 'src/components/dj-ui/DeskProps.tsx',
    to: 'src/components/studio/controls/DeskProps.tsx',
    description: 'Move DeskProps to studio/controls/'
  },
  // Mobile shell stays in mobile-shell/ (already organized)
  // Timeline components
  {
    from: 'src/components/timeline/TimelineEditor.tsx',
    to: 'src/components/studio/timeline/TimelineEditor.tsx',
    description: 'Move TimelineEditor to studio/timeline/'
  },
  {
    from: 'src/components/timeline/ExportTimelineModal.tsx',
    to: 'src/components/studio/timeline/ExportTimelineModal.tsx',
    description: 'Move ExportTimelineModal to studio/timeline/'
  },
  {
    from: 'src/components/timeline/TemplateLibrary.tsx',
    to: 'src/components/studio/timeline/TemplateLibrary.tsx',
    description: 'Move TemplateLibrary to studio/timeline/'
  },
  // 3D components
  {
    from: 'src/components/3d/HolographicDeck.tsx',
    to: 'src/components/studio/3d/HolographicDeck.tsx',
    description: 'Move HolographicDeck to studio/3d/'
  },
  {
    from: 'src/components/3d/GlitchController.tsx',
    to: 'src/components/studio/3d/GlitchController.tsx',
    description: 'Move GlitchController to studio/3d/'
  },
  {
    from: 'src/components/3d/materials/HolographicMaterial.tsx',
    to: 'src/components/studio/3d/materials/HolographicMaterial.tsx',
    description: 'Move HolographicMaterial to studio/3d/materials/'
  },
  // Audio components
  {
    from: 'src/components/PersistentPlayer.tsx',
    to: 'src/components/audio/PersistentPlayer.tsx',
    description: 'Move PersistentPlayer to audio/'
  },
  {
    from: 'src/components/FloatingVideoPlayer.tsx',
    to: 'src/components/audio/FloatingVideoPlayer.tsx',
    description: 'Move FloatingVideoPlayer to audio/'
  },
  {
    from: 'src/components/EmbedPlayer.tsx',
    to: 'src/components/audio/EmbedPlayer.tsx',
    description: 'Move EmbedPlayer to audio/'
  },
  {
    from: 'src/components/EnhancedAudioVisualizer.tsx',
    to: 'src/components/audio/EnhancedAudioVisualizer.tsx',
    description: 'Move EnhancedAudioVisualizer to audio/'
  },
  {
    from: 'src/components/WaveformPreview.tsx',
    to: 'src/components/audio/WaveformPreview.tsx',
    description: 'Move WaveformPreview to audio/'
  },
  // Content components
  {
    from: 'src/components/Contact.tsx',
    to: 'src/components/content/Contact.tsx',
    description: 'Move Contact to content/'
  },
  {
    from: 'src/components/ChatPanel.tsx',
    to: 'src/components/content/ChatPanel.tsx',
    description: 'Move ChatPanel to content/'
  },
  {
    from: 'src/components/LibraryHeader.tsx',
    to: 'src/components/content/LibraryHeader.tsx',
    description: 'Move LibraryHeader to content/'
  },
  {
    from: 'src/components/TrackDrawer.tsx',
    to: 'src/components/content/TrackDrawer.tsx',
    description: 'Move TrackDrawer to content/'
  },
  {
    from: 'src/components/TrackList.tsx',
    to: 'src/components/content/TrackList.tsx',
    description: 'Move TrackList to content/'
  },
  {
    from: 'src/components/video/VideoFilterNav.tsx',
    to: 'src/components/content/video/VideoFilterNav.tsx',
    description: 'Move VideoFilterNav to content/video/'
  },
  // Visual components
  {
    from: 'src/components/visual/ArtistSignalMeter.tsx',
    to: 'src/components/visual/ArtistSignalMeter.tsx',
    description: 'Keep ArtistSignalMeter in visual/'
  },
  {
    from: 'src/components/ParticlesBackground.tsx',
    to: 'src/components/visual/ParticlesBackground.tsx',
    description: 'Move ParticlesBackground to visual/'
  },
  // Shared components
  {
    from: 'src/components/PageTransition.tsx',
    to: 'src/components/shared/PageTransition.tsx',
    description: 'Move PageTransition to shared/'
  },
  {
    from: 'src/components/SmoothScroll.tsx',
    to: 'src/components/shared/SmoothScroll.tsx',
    description: 'Move SmoothScroll to shared/'
  },
  {
    from: 'src/components/ScrollRestorationManager.tsx',
    to: 'src/components/shared/ScrollRestorationManager.tsx',
    description: 'Move ScrollRestorationManager to shared/'
  },
  {
    from: 'src/components/ServiceWorkerRegistration.tsx',
    to: 'src/components/shared/ServiceWorkerRegistration.tsx',
    description: 'Move ServiceWorkerRegistration to shared/'
  },
  {
    from: 'src/components/ProdRuntimeGuards.tsx',
    to: 'src/components/shared/ProdRuntimeGuards.tsx',
    description: 'Move ProdRuntimeGuards to shared/'
  },
  {
    from: 'src/components/DevAudioDebug.tsx',
    to: 'src/components/shared/DevAudioDebug.tsx',
    description: 'Move DevAudioDebug to shared/'
  },
  {
    from: 'src/components/InstallApp.tsx',
    to: 'src/components/shared/InstallApp.tsx',
    description: 'Move InstallApp to shared/'
  },
  {
    from: 'src/components/PWAInstallPrompt.tsx',
    to: 'src/components/shared/PWAInstallPrompt.tsx',
    description: 'Move PWAInstallPrompt to shared/'
  },
  {
    from: 'src/components/pwa/InstallPrompt.tsx',
    to: 'src/components/shared/pwa/InstallPrompt.tsx',
    description: 'Move InstallPrompt to shared/pwa/'
  },
];

console.log('📁 Reorganizing components...\n');

let moved = 0;
let skipped = 0;
const errors = [];

reorgMappings.forEach(({ from, to, description }) => {
  const fromPath = path.join(rootDir, from);
  const toPath = path.join(rootDir, to);
  const toDir = path.dirname(toPath);

  if (!fs.existsSync(fromPath)) {
    skipped++;
    console.log(`  ⚠ Skipped (not found): ${from}`);
    return;
  }

  try {
    // Create destination directory
    if (!fs.existsSync(toDir)) {
      fs.mkdirSync(toDir, { recursive: true });
    }

    // Use git mv to preserve history
    try {
      execSync(`git mv "${fromPath}" "${toPath}"`, { cwd: rootDir, stdio: 'pipe' });
      moved++;
      console.log(`  ✓ ${description}`);
    } catch (gitError) {
      // Fallback to regular move if not in git
      fs.renameSync(fromPath, toPath);
      moved++;
      console.log(`  ✓ ${description} (non-git move)`);
    }
  } catch (e) {
    errors.push({ from, error: e.message });
    console.log(`  ❌ Error: ${from} - ${e.message}`);
  }
});

console.log(`\n📊 Summary:`);
console.log(`  Files moved: ${moved}`);
console.log(`  Skipped: ${skipped}`);
console.log(`  Errors: ${errors.length}`);

if (errors.length > 0) {
  console.log(`\n❌ Errors:`);
  errors.forEach(e => console.log(`  - ${e.from}: ${e.error}`));
}

console.log(`\n✅ Reorganization complete!`);
console.log(`   Next: Run 'node scripts/update-imports.mjs' to update all import paths.\n`);
