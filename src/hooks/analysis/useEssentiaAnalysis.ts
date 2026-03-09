import { useState, useCallback } from 'react';

const KEY_TO_CAMELOT: Record<string, string> = {
  'C major': '8B', 'G major': '9B', 'D major': '10B', 'A major': '11B', 'E major': '12B',
  'B major': '1B', 'F# major': '2B', 'Gb major': '2B', 'Db major': '3B', 'C# major': '3B',
  'Ab major': '4B', 'Eb major': '5B', 'Bb major': '6B', 'F major': '7B',
  'A minor': '8A', 'E minor': '9A', 'B minor': '10A', 'F# minor': '11A', 'C# minor': '12A',
  'G# minor': '1A', 'Ab minor': '1A', 'Eb minor': '2A', 'D# minor': '2A', 'Bb minor': '3A',
  'A# minor': '3A', 'F minor': '4A', 'C minor': '5A', 'G minor': '6A', 'D minor': '7A',
};

export const analyzeAudioBuffer = async (audioBuffer: AudioBuffer) => {
  return new Promise<any>((resolve, reject) => {
      const worker = new Worker(
        new URL('../../workers/analysis.worker.ts', import.meta.url),
        { type: 'module' }
      );
      
      const numberOfChannels = audioBuffer.numberOfChannels;
      const length = audioBuffer.length;
      const leftChannel = audioBuffer.getChannelData(0);
      const rightChannel = numberOfChannels > 1 ? audioBuffer.getChannelData(1) : leftChannel;
      const monoData = new Float32Array(length);
      for (let i = 0; i < length; i++) {
        monoData[i] = (leftChannel[i] + rightChannel[i]) / 2;
      }
      
      const requestId = Date.now().toString();
      worker.onmessage = (e) => {
         if (e.data.id === requestId) {
           worker.terminate();
           if (e.data.success) {
             const res = e.data.result;
             const camelot = KEY_TO_CAMELOT[res.key?.trim() || ''] || '??';
             
             resolve({
                bpm: Math.round(res.bpm || 0).toString(),
                key: camelot,
                confidence: res.danceability || 0,
                energy: (res.energy > 0.05 ? 'High' : res.energy > 0.02 ? 'Medium' : 'Low'),
                hasVocal: false
             });
           } else {
             reject(new Error(e.data.error));
           }
         }
      };
      
      worker.postMessage({ id: requestId, audioBuffer: monoData }, [monoData.buffer]);
  });
};

export function useEssentiaAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const analyze = useCallback(async (audioBuffer: AudioBuffer) => {
    setIsAnalyzing(true);
    try {
      const result = await analyzeAudioBuffer(audioBuffer);
      setIsAnalyzing(false);
      return result;
    } catch(e) {
      setIsAnalyzing(false);
      throw e;
    }
  }, []);
  
  return { analyze, isAnalyzing };
}
