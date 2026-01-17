"use client";

import { useEffect, useRef, useState } from "react";
import { ensureAudioEngineReady } from "@/engine/AudioEngine";

export default function LivePage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    const setup = async () => {
      try {
        const display = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
        setStream(display);
        if (videoRef.current) {
          videoRef.current.srcObject = display;
          await videoRef.current.play();
        }

        // Merge audio from engine master bus
        const engine = await ensureAudioEngineReady();
        const audioDest = (engine as any).mediaDestination as
          | MediaStreamAudioDestinationNode
          | undefined;
        if (audioDest) {
          const mixed = new MediaStream([
            ...display.getTracks(),
            ...audioDest.stream.getAudioTracks(),
          ]);
          setStream(mixed);
          if (videoRef.current) {
            videoRef.current.srcObject = mixed;
            await videoRef.current.play();
          }
        }
      } catch (err) {
        console.error("Live preview failed", err);
      }
    };
    void setup();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 gap-4">
      <h1 className="text-2xl font-bold">Live Preview</h1>
      <p className="text-sm text-white/60 text-center">
        Capture display + master audio. Use virtual audio cable for OBS
        ingestion.
      </p>
      <div className="w-full max-w-3xl rounded-xl border border-white/10 bg-white/5 p-3">
        <video
          ref={videoRef}
          className="w-full rounded-lg bg-black"
          playsInline
          muted
        />
      </div>
      {stream ? (
        <div className="text-xs text-white/70">
          Streaming {stream.getTracks().length} tracks
        </div>
      ) : (
        <div className="text-xs text-red-400">No stream yet</div>
      )}
    </div>
  );
}
