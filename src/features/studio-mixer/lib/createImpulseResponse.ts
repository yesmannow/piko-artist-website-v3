export function createImpulseResponse(
  audioContext: AudioContext,
  seconds: number,
  decay: number
): AudioBuffer {
  const rate = audioContext.sampleRate;
  const length = Math.max(1, Math.floor(rate * seconds));
  const buffer = audioContext.createBuffer(2, length, rate);

  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      const t = i / length;
      // Exponential decay noise
      const amp = Math.pow(1 - t, decay);
      data[i] = (Math.random() * 2 - 1) * amp;
    }
  }

  return buffer;
}

