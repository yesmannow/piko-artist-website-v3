// This runs on the Audio Thread, NOT the Main Thread.
// It creates that professional "pumping" effect when the kick drum hits.

class SidechainProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      {
        name: "threshold",
        defaultValue: 0.5,
        minValue: 0.0,
        maxValue: 1.0,
      },
      {
        name: "ratio",
        defaultValue: 4.0,
        minValue: 1.0,
        maxValue: 20.0,
      },
      {
        name: "release", // How fast volume recovers
        defaultValue: 0.1, // Seconds
        minValue: 0.01,
        maxValue: 1.0,
      },
    ];
  }

  constructor() {
    super();
    this.envelope = 0;
  }

  process(inputs, outputs, parameters) {
    // Input 0: The Music (Stereo)
    // Input 1: The Kick/Trigger (Mono/Stereo)
    const musicInput = inputs[0];
    const triggerInput = inputs[1];
    const output = outputs[0];

    // If no music, silence output
    if (!musicInput || musicInput.length === 0) return true;

    const bufferSize = musicInput[0].length;

    // Get parameters
    const threshold = parameters.threshold[0];
    const ratio = parameters.ratio[0];
    const release = parameters.release[0];

    // Calculate release coefficient (exponential decay)
    // sampleRate is a global variable in AudioWorklet scope
    const releaseCoeff = Math.exp(-1.0 / (sampleRate * release));

    for (let i = 0; i < bufferSize; i++) {
      // 1. Detect Trigger Level (Sidechain Input)
      let triggerLevel = 0;
      if (triggerInput && triggerInput.length > 0) {
        // Average the trigger channels
        for (let channel = 0; channel < triggerInput.length; channel++) {
          triggerLevel += Math.abs(triggerInput[channel][i]);
        }
        triggerLevel /= triggerInput.length;
      }

      // 2. Update Envelope (Simple Follower)
      if (triggerLevel > this.envelope) {
        this.envelope = triggerLevel; // Attack is instant
      } else {
        this.envelope = this.envelope * releaseCoeff; // Release is exponential
      }

      // 3. Calculate Gain Reduction
      let gain = 1.0;
      if (this.envelope > threshold) {
        const over = this.envelope - threshold;
        const reduction = over * (1.0 - 1.0 / ratio);
        gain = Math.max(0.0, 1.0 - reduction);
      }

      // 4. Apply Gain to Music Output
      for (let channel = 0; channel < output.length; channel++) {
        const inputChannel = musicInput[channel];
        const outputChannel = output[channel];

        // Safety check
        if (inputChannel) {
          outputChannel[i] = inputChannel[i] * gain;
        }
      }
    }

    return true; // Keep processor alive
  }
}

registerProcessor("sidechain-processor", SidechainProcessor);
