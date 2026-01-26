import fs from 'fs';
import path from 'path';

/**
 * Piko Studio V3 - "Dangling Logic" Scanner
 * Scans React components for UI controls and verifies they have 
 * corresponding handlers in the audio engine.
 */

const STUDIO_PATH = './src/components/studio';
const ENGINE_HOOK = 'src/hooks/useAudioEngine.ts';

function findDanglingLogic() {
  console.log('--- Starting Studio V3 Logic Audit ---');
  
  // 1. Read the Audio Engine to see what functions actually exist
  const engineContent = fs.readFileSync(ENGINE_HOOK, 'utf8');
  
  // 2. Scan for typical UI controls (Knobs, Faders, Buttons)
  const components = fs.readdirSync(path.join(STUDIO_PATH, 'ui'), { recursive: true });
  
  components.forEach(file => {
    if (!file.endsWith('.tsx')) return;
    
    const content = fs.readFileSync(path.join(STUDIO_PATH, 'ui', file), 'utf8');
    
    // Look for Knob/Fader/Button components
    const controls = content.match(/<(Knob|Fader|Button)[^>]*>/g) || [];
    
    controls.forEach(control => {
      // Check if it has an onChange or onClick that looks like a placeholder
      if (control.includes('onChange={() => {}}') || control.includes('onClick={() => {}}')) {
        console.warn(`[DANGLING LOGIC] Found placeholder in ${file}: ${control.trim()}`);
      }
      
      // Check if the handler name exists in the Audio Engine
      const handlerMatch = control.match(/(?:onChange|onClick)={([^}]+)}/);
      if (handlerMatch) {
        const handlerName = handlerMatch[1].split('.').pop();
        if (!engineContent.includes(handlerName) && !handlerName.includes('()')) {
          console.error(`[UNWIRED] ${file} uses '${handlerName}', but it is missing from useAudioEngine.ts`);
        }
      }
    });
  });
  
  console.log('--- Audit Complete ---');
}

findDanglingLogic();
