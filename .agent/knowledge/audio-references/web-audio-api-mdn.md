# Web Audio API — MDN Reference (Curated for Piko Studio)

> **Source**: [MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) — Scraped 2026-03-08
>
> **Usage**: This file is the **strict reference** for all Web Audio code in this project.
> Avoid legacy patterns (e.g., `createJavaScriptNode`). Use `AudioWorklet` for custom DSP.

---

## 1. AudioContext

The `AudioContext` interface represents an audio-processing graph built from `AudioNode` modules linked together. It controls both node creation and audio processing execution.

> **Critical Rule**: Create **one** `AudioContext` and reuse it. Never instantiate a new context inside a component.

### Inheritance Chain

```
EventTarget → BaseAudioContext → AudioContext
```

### Constructor

| Signature | Description |
|---|---|
| `new AudioContext(options?)` | Creates and returns a new `AudioContext`. Options: `{ latencyHint, sampleRate, sinkId }` |

### Instance Properties

| Property | Type | Description |
|---|---|---|
| `baseLatency` | `number` (seconds) | Processing latency from `AudioDestinationNode` to audio subsystem |
| `outputLatency` | `number` (seconds) | Estimation of output latency |
| `sinkId` | `string \| AudioSinkInfo` | Current output audio device ID |
| `state` *(inherited)* | `'suspended' \| 'running' \| 'closed'` | Current context state |
| `currentTime` *(inherited)* | `number` | Ever-increasing hardware timestamp (seconds) |
| `sampleRate` *(inherited)* | `number` | Sample rate in Hz (e.g., 44100, 48000) |
| `destination` *(inherited)* | `AudioDestinationNode` | Final output node |
| `audioWorklet` *(inherited)* | `AudioWorklet` | Access point for registering worklet processors |
| `listener` *(inherited)* | `AudioListener` | Spatial audio listener |

### Instance Methods

| Method | Returns | Description |
|---|---|---|
| `close()` | `Promise<void>` | Closes context, releases system resources |
| `resume()` | `Promise<void>` | Resumes a suspended context (**required for autoplay policy**) |
| `suspend()` | `Promise<void>` | Suspends time progression, reduces CPU/battery |
| `createMediaElementSource(element)` | `MediaElementAudioSourceNode` | Connects an `<audio>` or `<video>` element |
| `createMediaStreamSource(stream)` | `MediaStreamAudioSourceNode` | Connects a `MediaStream` (e.g., microphone) |
| `createMediaStreamDestination()` | `MediaStreamAudioDestinationNode` | Creates a stream output for recording |
| `getOutputTimestamp()` | `AudioTimestamp` | Returns `{ contextTime, performanceTime }` |
| `setSinkId(sinkId)` | `Promise<void>` | Routes output to a specific audio device |

### Inherited Factory Methods (from BaseAudioContext)

| Method | Creates |
|---|---|
| `createOscillator()` | `OscillatorNode` |
| `createGain()` | `GainNode` |
| `createBiquadFilter()` | `BiquadFilterNode` |
| `createDelay(maxDelay?)` | `DelayNode` |
| `createDynamicsCompressor()` | `DynamicsCompressorNode` |
| `createConvolver()` | `ConvolverNode` |
| `createWaveShaper()` | `WaveShaperNode` |
| `createPanner()` | `PannerNode` |
| `createStereoPanner()` | `StereoPannerNode` |
| `createAnalyser()` | `AnalyserNode` |
| `createChannelSplitter()` | `ChannelSplitterNode` |
| `createChannelMerger()` | `ChannelMergerNode` |
| `createBuffer(channels, length, sampleRate)` | `AudioBuffer` |
| `createBufferSource()` | `AudioBufferSourceNode` |
| `decodeAudioData(arrayBuffer)` | `Promise<AudioBuffer>` |
| `createConstantSource()` | `ConstantSourceNode` |
| `createIIRFilter(feedforward, feedback)` | `IIRFilterNode` |

### Events

| Event | Description |
|---|---|
| `sinkchange` | Fired when the output audio device changes |
| `statechange` *(inherited)* | Fired when the context state changes |

### Lifecycle States

```
                ┌──────────┐
    new ───────►│ suspended │◄──── suspend()
                └─────┬────┘
                      │ resume()
                ┌─────▼────┐
                │ running  │
                └─────┬────┘
                      │ close()
                ┌─────▼────┐
                │  closed  │   (terminal — cannot be reopened)
                └──────────┘
```

---

## 2. AudioWorklet

The `AudioWorklet` interface provides **low-latency custom DSP** on a separate audio thread.

> **Requires Secure Context (HTTPS)** in production.

### Inheritance Chain

```
Worklet → AudioWorklet
```

### Access

```typescript
const audioWorklet = audioContext.audioWorklet;
```

### Key Method (inherited from Worklet)

| Method | Returns | Description |
|---|---|---|
| `addModule(moduleURL)` | `Promise<void>` | Loads a processor script into the worklet scope |

### Instance Properties

| Property | Type | Description |
|---|---|---|
| `port` | `MessagePort` | For custom communication between main thread and worklet scope |

---

## 3. AudioWorkletProcessor

The base class for custom audio processing code that runs on the audio thread.

> **Cannot be instantiated directly** — created internally by `AudioWorkletNode`.

### Inheritance Chain

```
AudioWorkletProcessor (user subclass)
```

### Constructor

| Signature | Description |
|---|---|
| `AudioWorkletProcessor(options?)` | Called internally when an associated `AudioWorkletNode` is created |

### Instance Properties

| Property | Type | Description |
|---|---|---|
| `port` | `MessagePort` | Bidirectional communication with the owning `AudioWorkletNode` |

### Required Override

| Method | Signature | Description |
|---|---|---|
| `process()` | `process(inputs, outputs, parameters): boolean` | Called for each block of **128 sample-frames**. Return `true` to keep alive, `false` to garbage-collect |

### Static Getter (Optional)

| Property | Returns | Description |
|---|---|---|
| `parameterDescriptors` | `AudioParamDescriptor[]` | Defines custom `AudioParam`s on the node |

### `AudioParamDescriptor` Shape

```typescript
{
  name: string;
  defaultValue?: number;      // default: 0
  minValue?: number;           // default: -3.4028235e38
  maxValue?: number;           // default: 3.4028235e38
  automationRate?: 'a-rate' | 'k-rate';  // default: 'a-rate'
}
```

---

## 4. Implementation Pattern (AudioWorklet)

```typescript
// === Step 1: Create processor file (e.g., public/worklets/gain-processor.js) ===
class GainProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [{ name: 'gain', defaultValue: 1, minValue: 0, maxValue: 1 }];
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];
    const gain = parameters.gain;

    for (let channel = 0; channel < input.length; channel++) {
      const inputChannel = input[channel];
      const outputChannel = output[channel];
      for (let i = 0; i < inputChannel.length; i++) {
        outputChannel[i] = inputChannel[i] * (gain.length > 1 ? gain[i] : gain[0]);
      }
    }
    return true; // Keep processor alive
  }
}
registerProcessor('gain-processor', GainProcessor);

// === Step 2: Load and use in main thread ===
await audioContext.audioWorklet.addModule('/worklets/gain-processor.js');
const gainNode = new AudioWorkletNode(audioContext, 'gain-processor');
gainNode.parameters.get('gain').linearRampToValueAtTime(0.5, audioContext.currentTime + 1);
source.connect(gainNode).connect(audioContext.destination);
```

---

## 5. Legacy Patterns to AVOID

> [!CAUTION]
> **Never use these deprecated APIs in new code.**

| ❌ Legacy (Deprecated) | ✅ Modern Replacement |
|---|---|
| `createJavaScriptNode()` | `AudioWorkletNode` + `AudioWorkletProcessor` |
| `createScriptProcessor()` | `AudioWorkletNode` + `AudioWorkletProcessor` |
| `webkitAudioContext` | `AudioContext` (standard, unprefixed) |
| `noteOn()` / `noteOff()` | `start()` / `stop()` on `AudioScheduledSourceNode` |

---

## 6. Autoplay Policy Notes

Browsers require a **user gesture** before `AudioContext` can enter the `'running'` state:

```typescript
// Resume on first user interaction
document.addEventListener('click', () => {
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
}, { once: true });
```

This project handles this in the audio engine singleton — see `lib/audio-engine.ts`.
