"use client";

import { useRef, useState } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

export const useSocialExport = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const ffmpegRef = useRef(new FFmpeg());
  const loadedRef = useRef(false);

  const convertToSocialMP4 = async (webmBlob: Blob, filename = 'piko-mix.mp4') => {
    setIsProcessing(true);
    setProgress(0);
    try {
      const ffmpeg = ffmpegRef.current;
      if (!loadedRef.current) {
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
        await ffmpeg.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
        loadedRef.current = true;
      }

      ffmpeg.on('progress', ({ progress }) => setProgress(progress * 100));

      await ffmpeg.writeFile('input.webm', await fetchFile(webmBlob));

      // Transcode to Instagram-friendly MP4 (H.264/AAC)
      await ffmpeg.exec([
        '-i', 'input.webm',
        '-c:v', 'libx264', '-preset', 'ultrafast',
        '-c:a', 'aac',
        filename,
      ]);

      const data = await ffmpeg.readFile(filename);
      const bytes =
        typeof data === 'string' ? new TextEncoder().encode(data) : new Uint8Array(data);
      const mp4Blob = new Blob([bytes], { type: 'video/mp4' });
      return URL.createObjectURL(mp4Blob);
    } catch (e) {
      console.error('[useSocialExport] MP4 export failed:', e);
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  return { convertToSocialMP4, isProcessing, progress };
};
