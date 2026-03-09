import type { StemChannels } from "@/workers/stem.types";

export function decodeStemsToAudioBuffers(
  stems: StemChannels,
  audioContext: AudioContext
): Record<string, AudioBuffer> {
  const result: Record<string, AudioBuffer> = {};
  const sampleRate = audioContext.sampleRate;

  for (const [stemName, channels] of Object.entries(stems)) {
    if (!channels.length) continue;

    const referenceLength = channels[0].length;
    if (referenceLength === 0) {
      throw new Error(`Stem ${stemName} provided empty channel data`);
    }

    const mismatched = channels.some((channel) => channel.length !== referenceLength);
    if (mismatched) {
      throw new Error(`Stem ${stemName} contains channels with differing lengths`);
    }

    const buffer = audioContext.createBuffer(channels.length, referenceLength, sampleRate);
    channels.forEach((data, channelIndex) => {
      buffer.copyToChannel(data, channelIndex);
    });
    result[stemName] = buffer;
  }

  return result;
}
