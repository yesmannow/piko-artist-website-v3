# Phase 3: Neural Stem Separation - Implementation Summary

## ✅ Completed Components

### 1. Device Detection (`src/utils/deviceDetection.ts`)
- **Purpose**: Prevents UI freezing on low-end devices
- **Features**:
  - Checks `navigator.hardwareConcurrency` for CPU cores
  - Requires minimum 4 cores for AI inference
  - Returns compute power level (high/medium/low)
- **Usage**: Used by `useStemSeparator` to disable feature on insufficient hardware

### 2. Web Worker (`public/workers/stem-worker.js`)
- **Purpose**: Runs AI inference in separate thread
- **Structure**: Message-based communication with main thread
- **Status**: ⚠️ **Placeholder** - Requires Sherpa-ONNX integration
- **TODO**:
  - Load Sherpa-ONNX WASM files
  - Initialize Demucs model
  - Implement actual stem separation logic

### 3. Stem Separator Hook (`src/hooks/useStemSeparator.ts`)
- **Purpose**: Manages AI-powered stem separation
- **Features**:
  - Initializes Web Worker
  - Handles device capability checks
  - Processes audio buffers
  - Returns separated stems (Vocals, Drums, Bass, Other)
- **State Management**: Tracks processing state, errors, and results

### 4. Stem Routing Hook (`src/hooks/useStemRouting.ts`)
- **Purpose**: Manages audio routing for separated stems
- **Features**:
  - Creates individual GainNodes for each stem
  - Implements Mute/Solo functionality
  - **CRITICAL**: Routes Drum stem to Sidechain input (Input 1)
  - Connects all stems to master gain
- **Audio Graph**:
  ```
  Vocals → GainNode → MasterGain
  Drums → GainNode → MasterGain + Sidechain Input 1
  Bass → GainNode → MasterGain
  Other → GainNode → MasterGain
  ```

### 5. Stem Control Component (`src/components/studio/StemControl.tsx`)
- **Purpose**: UI controls for individual stems
- **Features**:
  - Mute/Solo buttons with visual feedback
  - Framer Motion animations
  - "Hacker Terminal" aesthetic styling
  - Color-coded stems (Vocals: Cyan, Drums: Magenta, Bass: Orange, Other: Lime)

## 🔧 Integration Status

### Current State
- ✅ Device detection working
- ✅ Web Worker structure in place
- ✅ Audio routing architecture complete
- ✅ UI components ready
- ⚠️ **AI inference not yet implemented** (requires Sherpa-ONNX)

### Next Steps (Sherpa-ONNX Integration)

1. **Install Sherpa-ONNX**:
   ```bash
   # Add Sherpa-ONNX WASM files to public/sherpa-onnx/
   # Add Demucs model files to public/models/demucs/
   ```

2. **Update `public/workers/stem-worker.js`**:
   - Load Sherpa-ONNX WASM module
   - Initialize Demucs model
   - Implement actual separation logic:
   ```javascript
   // Example structure (needs actual Sherpa-ONNX API):
   await importScripts('/sherpa-onnx/sherpa-onnx.js');
   const engine = new SherpaOnnx.StemSeparator({
     model: '/models/demucs/model.onnx',
     // ... other config
   });

   const stems = await engine.separate(audioBuffer);
   ```

3. **Update `src/hooks/useStemSeparator.ts`**:
   - Handle AudioBuffer conversion from worker
   - Properly reconstruct AudioBuffers from worker data

4. **Update Studio Page** (`src/app/studio/page.tsx`):
   - Integrate `useStemSeparator` hook
   - Add stem separation trigger on file load
   - Display stem controls when stems are ready
   - Show processing status

## 📋 Required Files (Not Yet Created)

### Model Files (Need to be added to `public/`):
- `public/sherpa-onnx/` - Sherpa-ONNX WASM files
- `public/models/demucs/` - Quantized Demucs model files

### Documentation Needed:
- Sherpa-ONNX API reference
- Demucs model loading instructions
- AudioBuffer serialization/deserialization for Web Worker

## 🎯 Key Features Implemented

### 1. Device Guard
- Automatically disables stem separation on low-end devices
- Shows terminal-style error: `> SYSTEM_ERROR: INSUFFICIENT_COMPUTE_POWER`

### 2. Drum-to-Sidechain Routing
- **Most Important Feature**: Drum stem routes to SidechainProcessor Input 1
- Creates accurate "pumping" effect based on actual kick drum hits
- Not just bass frequencies - real drum detection

### 3. Individual Stem Control
- Each stem has its own GainNode
- Mute/Solo functionality
- Real-time volume control (ready for implementation)

### 4. Web Worker Architecture
- Prevents UI freezing during AI inference
- Runs in separate thread
- Message-based communication

## 🚀 Usage Example (Once Sherpa-ONNX is Integrated)

```tsx
import { useStemSeparator } from "@/hooks/useStemSeparator";
import { useStemRouting } from "@/hooks/useStemRouting";
import { StemControls } from "@/components/studio/StemControl";

function StudioPage() {
  const { separate, stems, isProcessing } = useStemSeparator();
  const { playStems, toggleMute, toggleSolo, stemStates } = useStemRouting();

  const handleFileLoad = async (audioBuffer: AudioBuffer) => {
    // Separate into stems
    await separate(audioBuffer);

    // Once stems are ready, play them
    if (stems.vocals && stems.drums && stems.bass && stems.other) {
      playStems(stems);
    }
  };

  return (
    <>
      <StemControls
        stems={stemStates}
        onMute={toggleMute}
        onSolo={toggleSolo}
      />
    </>
  );
}
```

## ⚠️ Important Notes

1. **Sherpa-ONNX Integration Required**: The actual AI inference code needs to be added based on Sherpa-ONNX documentation.

2. **Model Files**: The Demucs model files must be quantized and placed in the public folder for browser loading.

3. **Performance**: Stem separation is computationally intensive. Expect 10-30 seconds processing time depending on track length and device.

4. **Memory**: Large audio files will consume significant memory. Consider chunking for very long tracks.

5. **Browser Support**: Web Workers and AudioWorklet require modern browsers. Consider fallback for older browsers.

## 📝 Files Created

- ✅ `src/utils/deviceDetection.ts`
- ✅ `public/workers/stem-worker.js`
- ✅ `src/hooks/useStemSeparator.ts`
- ✅ `src/hooks/useStemRouting.ts`
- ✅ `src/components/studio/StemControl.tsx`

## 🔗 Integration Points

- `src/app/studio/page.tsx` - Needs stem separation integration
- `src/hooks/useAudioGraph.ts` - Already provides sidechainNode
- `public/worklets/sidechain-processor.js` - Already handles sidechain processing

---

**Status**: Architecture complete, awaiting Sherpa-ONNX model integration.

