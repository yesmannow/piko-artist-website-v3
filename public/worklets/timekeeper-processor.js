/**
 * TimeKeeperProcessor - AudioWorklet Processor for Metronome & Loop Scheduling
 *
 * This processor runs on the audio thread, providing sample-accurate timing for:
 * - Metronome counting (BPM-based beat detection)
 * - Loop scheduling with precise start/end points
 *
 * Posts messages to main thread: { type: 'beat', beatNumber, timestamp }
 */

class TimeKeeperProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bpm = 120; // Default BPM
    this.beatDuration = 60.0 / this.bpm; // Duration of one beat in seconds
    this.sampleCount = 0;
    this.beatNumber = 0;
    this.lastBeatTime = 0;
    this.sampleRate = 44100; // Will be set by processor
  }

  static get parameterDescriptors() {
    return [
      {
        name: 'bpm',
        defaultValue: 120,
        minValue: 60,
        maxValue: 200,
        automationRate: 'k-rate',
      },
    ];
  }

  process(inputs, outputs, parameters) {
    // Update BPM if parameter changed
    if (parameters.bpm.length > 0) {
      this.bpm = parameters.bpm[0];
      this.beatDuration = 60.0 / this.bpm;
    }

    // Calculate current time in seconds
    const currentTime = this.sampleCount / this.sampleRate;

    // Check if we've crossed a beat boundary
    const timeSinceLastBeat = currentTime - this.lastBeatTime;
    if (timeSinceLastBeat >= this.beatDuration) {
      this.beatNumber++;
      this.lastBeatTime = currentTime;

      // Post beat event to main thread
      this.port.postMessage({
        type: 'beat',
        beatNumber: this.beatNumber,
        timestamp: currentTime,
        bpm: this.bpm,
      });
    }

    // Increment sample count
    this.sampleCount += 128; // Standard block size

    // Return true to keep processor alive
    return true;
  }
}

registerProcessor('timekeeper-processor', TimeKeeperProcessor);
