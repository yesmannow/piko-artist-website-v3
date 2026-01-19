/**
 * MeterProcessor - AudioWorklet Processor for RMS Volume Metering
 *
 * This processor runs on the audio thread, isolated from the main UI thread.
 * It calculates RMS (Root Mean Square) volume every 1024 frames and posts
 * minimal data to the main thread to prevent audio glitches.
 */

class MeterProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.frameCount = 0;
    this.sampleCount = 0;
    this.sumSquares = 0;
    this.updateInterval = 1024; // Update every 1024 frames (~23ms at 44.1kHz)
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];

    // If no input, post zero and continue
    if (!input || input.length === 0) {
      this.port.postMessage({ type: 'rms', value: 0 });
      return true;
    }

    const inputChannel = input[0]; // Use first channel (mono) or mix to mono

    // Calculate RMS for this block
    for (let i = 0; i < inputChannel.length; i++) {
      const sample = inputChannel[i];
      this.sumSquares += sample * sample;
      this.sampleCount++;
    }

    this.frameCount += inputChannel.length;

    // Post RMS value every updateInterval frames
    if (this.frameCount >= this.updateInterval) {
      const rms = Math.sqrt(this.sumSquares / this.sampleCount);
      const normalizedRMS = Math.min(1.0, rms * Math.SQRT2); // Normalize to 0-1

      this.port.postMessage({
        type: 'rms',
        value: normalizedRMS
      });

      // Reset counters
      this.frameCount = 0;
      this.sampleCount = 0;
      this.sumSquares = 0;
    }

    // Return true to keep the processor alive
    return true;
  }
}

registerProcessor('meter-processor', MeterProcessor);
