// src/components/studio/modals/ExportModal.tsx
import React, { useState } from 'react';
import { useAudioEngine } from '@/hooks/useAudioEngine';
import { useExporter } from '@/hooks/useExporter';
import { Loader2, Download, Share2, Disc } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const { startRecording, stopRecording, isRecording } = useAudioEngine();
  const { transcode, isTranscoding, progress, error } = useExporter();
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);

  if (!isOpen) return null;

  const handleToggleRecord = async () => {
    if (isRecording) {
      const blob = await stopRecording();
      setRecordedBlob(blob);
    } else {
      startRecording();
    }
  };

  const handleExport = () => {
    if (recordedBlob) {
      transcode(recordedBlob, `PikoFG-Remix-${Date.now()}`);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Piko FG Remix',
          text: 'Check out this mix I made on Piko Studio V3!',
          url: window.location.href
        });
      } catch (err) {
        console.error('Share failed', err);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md">
      <div className="w-full max-w-md p-8 bg-zinc-900/80 border border-zinc-700 rounded-3xl shadow-2xl relative overflow-hidden">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Export Session</h2>
          <p className="text-zinc-400 text-sm font-mono mt-2">Studio V3 // High Fidelity Output</p>
        </div>

        {/* State Machine UI */}
        <div className="flex flex-col gap-6">
          
          {/* State 1: Capture */}
          {!recordedBlob && (
            <div className="relative group">
              <button
                onClick={handleToggleRecord}
                className={`w-full h-24 rounded-2xl flex items-center justify-center gap-4 transition-all duration-300 ${
                  isRecording 
                    ? 'bg-red-500/20 border-2 border-red-500 text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.4)]' 
                    : 'bg-white text-black hover:scale-[1.02]'
                }`}
              >
                {isRecording ? (
                  <>
                    <div className="w-4 h-4 bg-red-500 rounded-sm animate-pulse" />
                    <span className="font-bold tracking-widest">STOP & SAVE</span>
                  </>
                ) : (
                  <>
                    <div className="w-4 h-4 bg-red-500 rounded-full" />
                    <span className="font-bold tracking-widest">REC MASTER</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* State 2: Processing & Action */}
          {recordedBlob && (
            <div className="space-y-4">
              <div className="p-4 bg-zinc-800/50 rounded-xl flex justify-between items-center border border-white/5">
                <div className="flex items-center gap-3">
                  <Disc className="text-indigo-500 animate-spin-slow" />
                  <div className="text-left">
                    <p className="text-white text-sm font-bold">Session Captured</p>
                    <p className="text-zinc-500 text-xs">{(recordedBlob.size / 1024 / 1024).toFixed(2)} MB • WebM</p>
                  </div>
                </div>
                <button 
                  onClick={() => setRecordedBlob(null)} 
                  className="text-xs text-red-400 hover:text-red-300 underline"
                >
                  Discard
                </button>
              </div>

              {isTranscoding ? (
                <div className="h-14 bg-zinc-800 rounded-xl flex items-center justify-between px-6 border border-white/5">
                  <span className="text-zinc-400 text-sm animate-pulse">Encoding MP3 320k...</span>
                  <span className="text-indigo-400 font-mono">{progress}%</span>
                </div>
              ) : (
                <button
                  onClick={handleExport}
                  className="w-full h-14 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)]"
                >
                  <Download size={18} />
                  {error ? 'DOWNLOAD RAW (Fallback)' : 'DOWNLOAD MP3'}
                </button>
              )}

              {/* Social Sharing */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button className="py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-white transition-colors text-sm font-medium">
                  Share to TikTok
                </button>
                <button 
                  onClick={handleNativeShare}
                  className="py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-white transition-colors flex items-center justify-center gap-2"
                >
                  <Share2 size={16} /> Native Share
                </button>
              </div>
            </div>
          )}
        </div>

        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-600 hover:text-white transition-colors"
        >
          CLOSE
        </button>
      </div>
    </div>
  );
};
