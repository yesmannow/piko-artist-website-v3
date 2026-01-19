// AudioWorklet recorder processor (mono PCM chunks)
// - Posts Float32Array chunks to main thread
// - Passes audio through unchanged (can be connected to a silent gain)

class RecorderProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.chunkSize = 4096;
    this.buffer = new Float32Array(this.chunkSize);
    this.writeIndex = 0;

    this.port.onmessage = (evt) => {
      const msg = evt.data;
      if (msg && msg.type === "flush") {
        this.flush();
      }
      if (msg && msg.type === "reset") {
        this.buffer = new Float32Array(this.chunkSize);
        this.writeIndex = 0;
      }
    };
  }

  flush() {
    if (this.writeIndex <= 0) return;
    const out = this.buffer.slice(0, this.writeIndex);
    this.port.postMessage({ type: "chunk", samples: out }, [out.buffer]);
    this.buffer = new Float32Array(this.chunkSize);
    this.writeIndex = 0;
  }

  process(inputs, outputs) {
    const input = inputs[0];
    const output = outputs[0];

    if (input && input.length > 0) {
      const channels = input.length;
      const frames = input[0].length;

      // Pass-through + mono record
      for (let i = 0; i < frames; i++) {
        let mono = 0;
        for (let ch = 0; ch < channels; ch++) {
          mono += input[ch][i] || 0;
        }
        mono = mono / channels;

        // write to record buffer
        this.buffer[this.writeIndex++] = mono;
        if (this.writeIndex >= this.chunkSize) {
          const outChunk = this.buffer;
          this.port.postMessage({ type: "chunk", samples: outChunk }, [outChunk.buffer]);
          this.buffer = new Float32Array(this.chunkSize);
          this.writeIndex = 0;
        }
      }

      // Pass-through output
      if (output && output.length > 0) {
        for (let ch = 0; ch < output.length; ch++) {
          const outCh = output[ch];
          const inCh = input[Math.min(ch, input.length - 1)] || input[0];
          for (let i = 0; i < frames; i++) {
            outCh[i] = inCh[i] || 0;
          }
        }
      }
    } else if (output && output.length > 0) {
      // Silence output if no input
      for (let ch = 0; ch < output.length; ch++) {
        output[ch].fill(0);
      }
    }

    return true;
  }
}

registerProcessor("recorder-processor", RecorderProcessor);

