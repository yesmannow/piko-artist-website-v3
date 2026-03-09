'use client';

import React, { useState, useRef } from 'react';
import { AudioEngine } from '@/lib/audioEngine';
import { Download, Mic, Square } from 'lucide-react';
import { clsx } from 'clsx';

export function ProductionExport() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const startRecording = async () => {
    const engine = AudioEngine.getInstance();
    await engine.resume();
    
    // We record the overall masterStreamNode
    const stream = engine.masterStreamNode.stream;
    try {
      // In a real stem export, we would create multiple MediaRecorders here for engine.stems
      // For this prototype, we record the masterStream
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = recorder;
      
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      
      recorder.onstop = () => {
        setRecordedChunks(chunks);
      };
      
      recorder.start(100); // chunk every 100ms
      setIsRecording(true);
    } catch (err) {
      console.error('Recording failed:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleDownload = () => {
    if (recordedChunks.length === 0) return;
    const blob = new Blob(recordedChunks, { type: 'audio/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Studio_Session_${new Date().toISOString().slice(0, 10)}.webm`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className="w-full bg-slate-900/40 border border-slate-800 rounded-lg p-2 flex flex-col gap-2 mt-auto backdrop-blur-md">
      <div className="text-[9px] text-accent font-bold uppercase tracking-widest text-center">Mastering & Export</div>
      
      <div className="flex gap-2 w-full">
        {!isRecording ? (
          <button 
            onClick={startRecording}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded bg-red-500/10 text-red-500 border border-red-500/50 hover:bg-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.2)] transition-colors"
          >
            <Mic size={10} className="animate-pulse" />
            <span className="text-[9px] font-bold">REC MIX</span>
          </button>
        ) : (
          <button 
            onClick={stopRecording}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded bg-slate-800 text-slate-300 border border-slate-600 hover:bg-slate-700 transition-colors"
          >
            <Square size={10} />
            <span className="text-[9px] font-bold">STOP</span>
          </button>
        )}
        
        <button 
          onClick={handleDownload}
          disabled={recordedChunks.length === 0 || isRecording}
          className={clsx(
            "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded border transition-colors",
            (recordedChunks.length > 0 && !isRecording) 
              ? "bg-accent/20 text-accent border-accent/50 hover:bg-accent/30 shadow-[0_0_10px_rgba(0,242,255,0.2)]" 
              : "bg-slate-900 text-slate-600 border-slate-800 opacity-50 cursor-not-allowed"
          )}
        >
          <Download size={10} />
          <span className="text-[9px] font-bold">SAVE</span>
        </button>
      </div>
    </div>
  );
}
