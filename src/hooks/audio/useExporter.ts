import { useState, useRef } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import * as Tone from 'tone';

export const useExporter = () => {
  const [loaded, setLoaded] = useState(false);
  const [isTranscoding, setIsTranscoding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const ffmpegRef = useRef(new FFmpeg());
  const recorderRef = useRef<Tone.Recorder | null>(null);

  const load = async () => {
    // Explicitly use version 0.12.6 to avoid known issues with .10 in some environments
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    const ffmpeg = ffmpegRef.current;

    ffmpeg.on('progress', ({ progress }) => {
      setProgress(Math.round(progress * 100));
    });

    try {
      // Attempt to load Multi-threaded Core (Requires SharedArrayBuffer / COOP+COEP)
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      setLoaded(true);
    } catch (e) {
      console.error('FFmpeg WASM Load Failed (likely Security Headers):', e);
      setError('Enhanced export unavailable. Using raw export.');
    }
  };

  /**
   * Record Master Bus output using Tone.Recorder
   * @param masterBus - The master bus node to record from
   * @param duration - Recording duration in seconds (optional, for fixed-length recordings)
   * @returns Promise<Blob> - Recorded audio blob
   */
  const recordMasterBus = async (
    masterBus: Tone.ToneAudioNode,
    duration?: number
  ): Promise<Blob> => {
    if (!recorderRef.current) {
      recorderRef.current = new Tone.Recorder();
    }

    const recorder = recorderRef.current;
    masterBus.connect(recorder);
    recorder.start();

    if (duration) {
      // Fixed duration recording
      await new Promise((resolve) => setTimeout(resolve, duration * 1000));
      const blob = await recorder.stop();
      masterBus.disconnect(recorder);
      return blob;
    } else {
      // Manual stop - return a promise that resolves when stop() is called
      return new Promise((resolve) => {
        // Store resolve function for manual stop
        (recorder as Tone.Recorder & { _resolve?: (value: Blob) => void })._resolve = resolve;
      });
    }
  };

  /**
   * Stop recording and return the blob
   */
  const stopRecording = async (): Promise<Blob | null> => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state !== 'started') return null;

    const blob = await recorder.stop();
    recorderRef.current = null;
    return blob;
  };

  const transcode = async (blob: Blob, filename = 'Piko-Studio-Remix') => {
    if (!loaded && !error) await load();
    
    // Fallback: If FFmpeg failed to load, download raw WebM
    if (error) {
      downloadBlob(blob, `${filename}.webm`);
      return;
    }

    setIsTranscoding(true);
    const ffmpeg = ffmpegRef.current;
    
    try {
      await ffmpeg.writeFile('input.webm', await fetchFile(blob));
      
      // High-Fidelity 320k MP3 Transcode with metadata
      await ffmpeg.exec([
        '-i', 'input.webm',
        '-vn',
        '-ac', '2',
        '-ar', '44100',
        '-b:a', '320k',
        '-metadata', 'artist=Piko',
        '-metadata', 'album=Studio Remix',
        '-metadata', 'title=Studio Remix',
        'output.mp3'
      ]);

      const data = await ffmpeg.readFile('output.mp3');
      // `@ffmpeg/util` types allow SharedArrayBuffer-backed views; BlobPart is stricter in TS.
      // Copy into a fresh Uint8Array so the underlying buffer is a plain ArrayBuffer.
      const bytes =
        typeof data === 'string' ? new TextEncoder().encode(data) : new Uint8Array(data);
      const mp3Blob = new Blob([bytes], { type: 'audio/mpeg' });
      downloadBlob(mp3Blob, `${filename}.mp3`);
      
      // Cleanup MEMFS
      await ffmpeg.deleteFile('input.webm');
      await ffmpeg.deleteFile('output.mp3');
      
    } catch (e) {
      console.error('Transcode Error:', e);
      // Fallback on crash
      downloadBlob(blob, `${filename}.webm`);
    } finally {
      setIsTranscoding(false);
      setProgress(0);
    }
  };

  const downloadBlob = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return { 
    transcode, 
    recordMasterBus, 
    stopRecording,
    isTranscoding, 
    progress, 
    error 
  };
};
