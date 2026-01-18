import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Import path mappings: old -> new
const importMappings = [
  // Studio components
  { old: '@/components/RefactoredDJInterface', new: '@/components/studio/RefactoredDJInterface' },
  { old: '@/components/RefactoredDJDeck', new: '@/components/studio/RefactoredDJDeck' },
  { old: '@/components/RefactoredDJMixerModule', new: '@/components/studio/RefactoredDJMixerModule' },
  
  // Studio controls
  { old: '@/components/dj-ui/AudioReactiveVisualizer', new: '@/components/studio/controls/AudioReactiveVisualizer' },
  { old: '@/components/dj-ui/Crossfader', new: '@/components/studio/controls/Crossfader' },
  { old: '@/components/dj-ui/Fader', new: '@/components/studio/controls/Fader' },
  { old: '@/components/dj-ui/JogWheel3D', new: '@/components/studio/controls/JogWheel3D' },
  { old: '@/components/dj-ui/Knob', new: '@/components/studio/controls/Knob' },
  { old: '@/components/dj-ui/VUMeter', new: '@/components/studio/controls/VUMeter' },
  { old: '@/components/dj-ui/Waveform', new: '@/components/studio/controls/Waveform' },
  { old: '@/components/dj-ui/XYPad', new: '@/components/studio/controls/XYPad' },
  { old: '@/components/dj-ui/RemixGrid', new: '@/components/studio/controls/RemixGrid' },
  { old: '@/components/dj-ui/DeskProps', new: '@/components/studio/controls/DeskProps' },
  
  // Timeline
  { old: '@/components/timeline/TimelineEditor', new: '@/components/studio/timeline/TimelineEditor' },
  { old: '@/components/timeline/ExportTimelineModal', new: '@/components/studio/timeline/ExportTimelineModal' },
  { old: '@/components/timeline/TemplateLibrary', new: '@/components/studio/timeline/TemplateLibrary' },
  
  // 3D
  { old: '@/components/3d/HolographicDeck', new: '@/components/studio/3d/HolographicDeck' },
  { old: '@/components/3d/GlitchController', new: '@/components/studio/3d/GlitchController' },
  { old: '@/components/3d/materials/HolographicMaterial', new: '@/components/studio/3d/materials/HolographicMaterial' },
  
  // Audio
  { old: '@/components/PersistentPlayer', new: '@/components/audio/PersistentPlayer' },
  { old: '@/components/FloatingVideoPlayer', new: '@/components/audio/FloatingVideoPlayer' },
  { old: '@/components/EmbedPlayer', new: '@/components/audio/EmbedPlayer' },
  { old: '@/components/EnhancedAudioVisualizer', new: '@/components/audio/EnhancedAudioVisualizer' },
  { old: '@/components/WaveformPreview', new: '@/components/audio/WaveformPreview' },
  
  // Content
  { old: '@/components/Contact', new: '@/components/content/Contact' },
  { old: '@/components/ChatPanel', new: '@/components/content/ChatPanel' },
  { old: '@/components/LibraryHeader', new: '@/components/content/LibraryHeader' },
  { old: '@/components/TrackDrawer', new: '@/components/content/TrackDrawer' },
  { old: '@/components/TrackList', new: '@/components/content/TrackList' },
  { old: '@/components/video/VideoFilterNav', new: '@/components/content/video/VideoFilterNav' },
  
  // Visual
  { old: '@/components/ParticlesBackground', new: '@/components/visual/ParticlesBackground' },
  
  // Shared
  { old: '@/components/PageTransition', new: '@/components/shared/PageTransition' },
  { old: '@/components/SmoothScroll', new: '@/components/shared/SmoothScroll' },
  { old: '@/components/ScrollRestorationManager', new: '@/components/shared/ScrollRestorationManager' },
  { old: '@/components/ServiceWorkerRegistration', new: '@/components/shared/ServiceWorkerRegistration' },
  { old: '@/components/ProdRuntimeGuards', new: '@/components/shared/ProdRuntimeGuards' },
  { old: '@/components/DevAudioDebug', new: '@/components/shared/DevAudioDebug' },
  { old: '@/components/InstallApp', new: '@/components/shared/InstallApp' },
  { old: '@/components/PWAInstallPrompt', new: '@/components/shared/PWAInstallPrompt' },
  { old: '@/components/pwa/InstallPrompt', new: '@/components/shared/pwa/InstallPrompt' },
];

// Also handle relative imports
const relativeMappings = importMappings.map(({ old, new: newPath }) => {
  const oldParts = old.split('/');
  const newParts = newPath.split('/');
  return {
    old: oldParts[oldParts.length - 1], // Just the component name
    new: newPath,
    fullOld: old
  };
});

// Get all source files
function getAllSourceFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (!['node_modules', '.next', '.trash', 'dist'].includes(file)) {
        getAllSourceFiles(filePath, fileList);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

console.log('🔄 Updating import paths after reorganization...\n');

const allFiles = getAllSourceFiles(path.join(rootDir, 'src'));
let totalUpdated = 0;
const updatedFiles = [];

allFiles.forEach(filePath => {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    let fileUpdated = false;
    const changes = [];

    // Update absolute imports (@/components/...)
    importMappings.forEach(({ old, new: newPath }) => {
      const escapedOld = old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const patterns = [
        new RegExp(`(["'])${escapedOld}(["'])`, 'g'),
        new RegExp(`(["'])${escapedOld}(/.*)?(["'])`, 'g'),
      ];

      patterns.forEach(pattern => {
        if (pattern.test(content)) {
          content = content.replace(pattern, `$1${newPath}$2`);
          fileUpdated = true;
          if (!changes.includes(newPath)) {
            changes.push(`${old} → ${newPath}`);
          }
        }
      });
    });

    // Update relative imports (need to calculate relative path)
    // This is more complex, so we'll do a simpler pattern match
    relativeMappings.forEach(({ old, new: newPath, fullOld }) => {
      // Match relative imports like: import X from '../components/ComponentName'
      const relativePattern = new RegExp(
        `(from\\s+["'])(\\.\\.?/)+components/[^"']*${old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(["'])`,
        'g'
      );
      
      if (relativePattern.test(content)) {
        // For relative imports, we'd need to calculate the actual relative path
        // For now, convert to absolute import
        content = content.replace(
          new RegExp(`(from\\s+["'])(\\.\\.?/)+components/[^"']*${old}(["'])`, 'g'),
          `$1${newPath}$3`
        );
        fileUpdated = true;
        if (!changes.includes(newPath)) {
          changes.push(`relative ${old} → ${newPath}`);
        }
      }
    });

    if (fileUpdated) {
      fs.writeFileSync(filePath, content, 'utf-8');
      totalUpdated++;
      updatedFiles.push({
        file: path.relative(rootDir, filePath),
        changes: changes.length
      });
      console.log(`  ✓ ${path.relative(rootDir, filePath)} (${changes.length} updates)`);
    }
  } catch (e) {
    console.error(`  ❌ Error processing ${filePath}: ${e.message}`);
  }
});

console.log(`\n📊 Summary:`);
console.log(`  Files updated: ${totalUpdated}`);
console.log(`  Total files scanned: ${allFiles.length}`);

if (updatedFiles.length > 0) {
  console.log(`\n✅ Import path updates complete!\n`);
} else {
  console.log(`\n⚠️  No files needed updating.\n`);
}
