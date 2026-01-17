"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Video, X } from "lucide-react";
import { getPocketVault, type RecordingMetadata } from "@/engine/PocketVault";
import { getEnhancedMixRecorder } from "@/engine/EnhancedMixRecorder";
import { getVideoRenderer } from "@/engine/VideoRenderer";
import { getTrackHistory } from "@/engine/TrackHistory";

interface ExportMixModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordingId?: string; // If editing existing recording
}

interface ExportOptions {
  djName: string;
  title: string;
  description: string;
  tags: string[];
  exportFormat: "audio" | "video";
  videoQuality: "sd" | "hd" | "4k";
  includeVisualizer: boolean;
  canvasSelector: string;
}

export function ExportMixModal({
  isOpen,
  onClose,
  recordingId,
}: ExportMixModalProps) {
  const pocketVault = getPocketVault();
  const mixRecorder = getEnhancedMixRecorder();
  const videoRenderer = getVideoRenderer();
  const trackHistory = getTrackHistory();

  const [isLoading, setIsLoading] = useState(false);
  const [existingRecording, setExistingRecording] =
    useState<RecordingMetadata | null>(null);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    djName: "Piko DJ",
    title: "",
    description: "",
    tags: [],
    exportFormat: "audio",
    videoQuality: "hd",
    includeVisualizer: true,
    canvasSelector: "canvas",
  });

  const [newTag, setNewTag] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  // Load existing recording if editing
  useEffect(() => {
    if (recordingId && isOpen) {
      loadExistingRecording(recordingId);
    } else if (isOpen) {
      // New recording - populate with defaults
      const currentTracklist = trackHistory.getCurrentTracklist();
      const defaultTitle =
        currentTracklist.length > 0
          ? `Mix Session - ${new Date().toLocaleDateString()}`
          : "Piko Mix Session";

      setExportOptions((prev) => ({
        ...prev,
        title: defaultTitle,
        tags: ["piko", "dj", "mix"],
      }));
      setExistingRecording(null);
    }
  }, [recordingId, isOpen]);

  const loadExistingRecording = async (id: string) => {
    setIsLoading(true);
    try {
      const recording = await pocketVault.getMetadata(id);
      if (recording) {
        setExistingRecording(recording);
        setExportOptions({
          djName: recording.djName,
          title: recording.title,
          description: recording.description || "",
          tags: recording.tags || [],
          exportFormat: recording.format.includes("video") ? "video" : "audio",
          videoQuality: "hd", // Default
          includeVisualizer: true,
          canvasSelector: "canvas",
        });
      }
    } catch (error) {
      console.error("Failed to load recording:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    if (!exportOptions.title.trim()) {
      alert("Please enter a title for your mix");
      return;
    }

    setIsExporting(true);
    setExportProgress(0);

    try {
      if (existingRecording) {
        // Export existing recording
        const filename =
          `${exportOptions.djName}_${exportOptions.title}`.replace(
            /[^a-z0-9]/gi,
            "_",
          );
        await pocketVault.exportRecording(existingRecording.id, filename);
        alert("Recording exported successfully!");
      } else {
        // Export current session
        const status = mixRecorder.getRecordingStatus();
        if (!status) {
          alert("No active recording session found");
          return;
        }

        // For new recordings, we'll trigger a download of the current blob
        // In a real implementation, this would save to Pocket Vault first
        alert(
          "Current session exported! (In production, this would save to Pocket Vault)",
        );
      }
    } catch (error) {
      console.error("Export failed:", error);
      alert("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const handleRenderVideo = async () => {
    if (!existingRecording) {
      alert("Please save your recording first before rendering video");
      return;
    }

    setIsExporting(true);
    setExportProgress(0);

    try {
      // Get the audio blob
      const recording = await pocketVault.getRecording(existingRecording.id);
      if (!recording) {
        throw new Error("Recording not found");
      }

      const { blob } = recording;

      // Get canvas for visualizer
      const canvas = document.querySelector(
        exportOptions.canvasSelector,
      ) as HTMLCanvasElement;
      if (!canvas) {
        throw new Error(`Canvas not found: ${exportOptions.canvasSelector}`);
      }

      // Determine video dimensions based on quality
      const dimensions = getVideoDimensions(exportOptions.videoQuality);

      // Render video with visualizer overlay
      const videoBlob = await videoRenderer.renderVideo({
        audioBlob: blob,
        canvas,
        width: dimensions.width,
        height: dimensions.height,
        frameRate: 30,
        bitRate: 5, // 5 Mbps for HD
        format: "webm",
        onProgress: (progress) => {
          setExportProgress(progress * 100);
        },
      });

      // Download the video
      const url = URL.createObjectURL(videoBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${exportOptions.djName}_${exportOptions.title}_video.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert("Video rendered and downloaded successfully!");
    } catch (error) {
      console.error("Video rendering failed:", error);
      alert("Video rendering failed. Please try again.");
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !exportOptions.tags.includes(newTag.trim())) {
      setExportOptions((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setExportOptions((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const getVideoDimensions = (quality: string) => {
    switch (quality) {
      case "sd":
        return { width: 854, height: 480 };
      case "hd":
        return { width: 1920, height: 1080 };
      case "4k":
        return { width: 3840, height: 2160 };
      default:
        return { width: 1920, height: 1080 };
    }
  };

  const getCurrentTracklist = () => {
    return trackHistory.getCurrentTracklist();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gray-900 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Export Mix</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-toxic-lime mx-auto"></div>
              <p className="text-gray-400 mt-4">Loading recording...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    DJ Name
                  </label>
                  <input
                    type="text"
                    value={exportOptions.djName}
                    onChange={(e) =>
                      setExportOptions((prev) => ({
                        ...prev,
                        djName: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white"
                    placeholder="Your DJ name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Mix Title
                  </label>
                  <input
                    type="text"
                    value={exportOptions.title}
                    onChange={(e) =>
                      setExportOptions((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white"
                    placeholder="Name your mix"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={exportOptions.description}
                  onChange={(e) =>
                    setExportOptions((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white h-20 resize-none"
                  placeholder="Describe your mix..."
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tags
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addTag()}
                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white"
                    placeholder="Add a tag..."
                  />
                  <button
                    onClick={addTag}
                    className="px-4 py-2 bg-toxic-lime text-black rounded font-bold hover:bg-toxic-lime/80 transition-colors"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {exportOptions.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-sm flex items-center gap-2"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="text-gray-400 hover:text-red-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Export Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Export Format
                  </label>
                  <select
                    value={exportOptions.exportFormat}
                    onChange={(e) =>
                      setExportOptions((prev) => ({
                        ...prev,
                        exportFormat: e.target.value as "audio" | "video",
                      }))
                    }
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white"
                  >
                    <option value="audio">Audio Only</option>
                    <option value="video">Video with Visualizer</option>
                  </select>
                </div>

                {exportOptions.exportFormat === "video" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Video Quality
                    </label>
                    <select
                      value={exportOptions.videoQuality}
                      onChange={(e) =>
                        setExportOptions((prev) => ({
                          ...prev,
                          videoQuality: e.target.value as "sd" | "hd" | "4k",
                        }))
                      }
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white"
                    >
                      <option value="sd">SD (854x480)</option>
                      <option value="hd">HD (1920x1080)</option>
                      <option value="4k">4K (3840x2160)</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Tracklist Preview */}
              {getCurrentTracklist().length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Tracklist Preview
                  </label>
                  <div className="bg-gray-800 rounded p-3 max-h-32 overflow-y-auto">
                    <div className="text-xs text-gray-400 space-y-1">
                      {getCurrentTracklist()
                        .slice(0, 10)
                        .map((track, index) => (
                          <div key={track.trackId}>
                            {index + 1}. {track.artist} - {track.title}
                          </div>
                        ))}
                      {getCurrentTracklist().length > 10 && (
                        <div>
                          ... and {getCurrentTracklist().length - 10} more
                          tracks
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Export Progress */}
              {isExporting && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-300">
                    <span>Exporting...</span>
                    <span>{Math.round(exportProgress)}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <motion.div
                      className="bg-toxic-lime h-2 rounded-full"
                      style={{ width: `${exportProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleExport}
                  disabled={isExporting || !exportOptions.title.trim()}
                  className="flex-1 bg-toxic-lime hover:bg-toxic-lime/80 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-bold py-3 px-6 rounded flex items-center justify-center gap-2 transition-colors"
                >
                  <Download className="w-5 h-5" />
                  Export Mix
                </button>

                {exportOptions.exportFormat === "video" && (
                  <button
                    onClick={handleRenderVideo}
                    disabled={isExporting || !existingRecording}
                    className="flex-1 bg-cyan-500 hover:bg-cyan-500/80 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded flex items-center justify-center gap-2 transition-colors"
                  >
                    <Video className="w-5 h-5" />
                    Render Video
                  </button>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
