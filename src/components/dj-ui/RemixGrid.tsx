"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, Square, Music, Drum, Mic, Grid3X3 } from "lucide-react";
import { getStepSequencer, type GridStep } from "@/engine/StepSequencer";
import { getSampleLibrary } from "@/engine/SampleLibrary";
import { type SampleInfo } from "@/engine/SamplePlayer";
import { Tooltip } from "./Tooltip";

export interface RemixGridProps {
  width?: number;
  height?: number;
  bpm?: number;
  isPlaying?: boolean;
  onSampleTrigger?: (sample: SampleInfo, velocity: number) => void;
  helpText?: string;
}

export function RemixGrid({
  width = 400,
  height = 400,
  bpm = 120,
  onSampleTrigger,
  helpText,
}: RemixGridProps) {
  const stepSequencer = getStepSequencer();
  const sampleLibrary = getSampleLibrary();

  const [grid, setGrid] = useState<GridStep[][]>(() =>
    Array(4).fill(null).map(() =>
      Array(4).fill(null).map(() => ({
        sampleId: null,
        active: false,
        velocity: 0.8
      }))
    )
  );

  const [currentStep, setCurrentStep] = useState({ row: 0, col: 0 });
  const [isSequencerPlaying, setIsSequencerPlaying] = useState(false);
  const [tempo, setTempo] = useState(bpm);
  const [samples] = useState<SampleInfo[]>(() => sampleLibrary.getAllSamples());
  const [selectedSample, setSelectedSample] = useState<SampleInfo | null>(null);
  const [showSampleSelector, setShowSampleSelector] = useState(false);

  // Sample assignment mode
  const [assignMode, setAssignMode] = useState(false);
  const [assignPosition, setAssignPosition] = useState<{row: number, col: number} | null>(null);

  // Sample packs for organization
  const [selectedPack, setSelectedPack] = useState<string | null>(null);

  // Initialize services
  useEffect(() => {
    const initServices = async () => {
      await stepSequencer.initialize();
      // Load default packs
      samplePacks.forEach(pack => {
        sampleLibrary.loadPack(pack.id);
      });
    };
    initServices();

    // Set up sequencer callbacks
    stepSequencer.setOnStepChange((step) => {
      setCurrentStep(step);
    });

    return () => {
      stepSequencer.stop();
    };
  }, []);

  // Update tempo when bpm prop changes
  useEffect(() => {
    setTempo(bpm);
    stepSequencer.setTempo(bpm);
  }, [bpm, stepSequencer]);

  // Handle grid cell click
  const handleCellClick = (row: number, col: number) => {
    if (assignMode && selectedSample) {
      // Assign sample to grid cell
      const newGrid = [...grid];
      newGrid[row][col] = {
        sampleId: selectedSample.id,
        active: true,
        velocity: 0.8
      };
      setGrid(newGrid);
      stepSequencer.setStep(row, col, newGrid[row][col]);
      setAssignMode(false);
      setSelectedSample(null);
    } else {
      // Toggle active state
      const newGrid = [...grid];
      newGrid[row][col] = {
        ...newGrid[row][col],
        active: !newGrid[row][col].active
      };
      setGrid(newGrid);
      stepSequencer.setStep(row, col, newGrid[row][col]);
    }
  };

  // Handle cell right-click (assign mode)
  const handleCellRightClick = (row: number, col: number) => {
    setAssignMode(true);
    setAssignPosition({ row, col });
    setShowSampleSelector(true);
  };

  // Assign sample to position
  const assignSample = (sample: SampleInfo) => {
    if (assignPosition) {
      const newGrid = [...grid];
      newGrid[assignPosition.row][assignPosition.col] = {
        sampleId: sample.id,
        active: true,
        velocity: 0.8
      };
      setGrid(newGrid);
      stepSequencer.setStep(assignPosition.row, assignPosition.col, newGrid[assignPosition.row][assignPosition.col]);
    }
    setAssignMode(false);
    setAssignPosition(null);
    setShowSampleSelector(false);
    setSelectedSample(null);
  };

  // Get filtered samples based on selected pack
  const getFilteredSamples = () => {
    if (!selectedPack) return samples;
    const pack = samplePacks.find(p => p.id === selectedPack);
    return pack ? pack.samples : [];
  };

  // Get sample info for display
  const getSampleInfo = (sampleId: string | null) => {
    if (!sampleId) return null;
    return samples.find(s => s.id === sampleId);
  };

  // Handle tempo changes
  const handleTempoChange = (newTempo: number) => {
    const clampedTempo = Math.max(60, Math.min(200, newTempo));
    setTempo(clampedTempo);
    stepSequencer.setTempo(clampedTempo);
  };

  // Start/stop sequencer
  const handleSequencerToggle = () => {
    if (isSequencerPlaying) {
      stepSequencer.stop();
      setIsSequencerPlaying(false);
    } else {
      stepSequencer.start();
      setIsSequencerPlaying(true);
    }
  };

  const gridContent = (
    <div className="flex flex-col gap-4">
      {/* Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleSequencerToggle}
          className={`p-2 rounded ${
            isSequencerPlaying
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-green-500 hover:bg-green-600 text-white'
          } transition-colors`}
        >
          {isSequencerPlaying ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-300">BPM:</label>
          <input
            type="number"
            value={tempo}
            onChange={(e) => handleTempoChange(Number(e.target.value))}
            className="w-16 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
            min="60"
            max="200"
          />
        </div>

        <div className="flex-1" />

        <button
          onClick={() => setAssignMode(!assignMode)}
          className={`px-3 py-1 rounded text-sm ${
            assignMode
              ? 'bg-blue-500 text-white'
              : 'bg-gray-600 hover:bg-gray-500 text-gray-300'
          } transition-colors`}
        >
          {assignMode ? 'Assigning...' : 'Assign Samples'}
        </button>
      </div>

      {/* 4x4 Grid */}
      <div
        className="grid grid-cols-4 gap-1 p-4 bg-black/50 rounded-lg border border-gray-700"
        style={{ width, height }}
      >
        {grid.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const sample = getSampleInfo(cell.sampleId);
            const isCurrentStep = isSequencerPlaying &&
              currentStep.row === rowIndex &&
              currentStep.col === colIndex;
            const isActive = cell.active;

            return (
              <motion.button
                key={`${rowIndex}-${colIndex}`}
                onClick={() => handleCellClick(rowIndex, colIndex)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  handleCellRightClick(rowIndex, colIndex);
                }}
                className={`
                  relative w-full aspect-square rounded border-2 transition-all duration-150
                  ${isActive
                    ? 'border-toxic-lime bg-toxic-lime/20'
                    : 'border-gray-600 bg-gray-800/50 hover:bg-gray-700/50'
                  }
                  ${isCurrentStep
                    ? 'ring-2 ring-cyan-400 ring-opacity-75 animate-pulse'
                    : ''
                  }
                  ${assignMode && assignPosition?.row === rowIndex && assignPosition?.col === colIndex
                    ? 'border-blue-400 bg-blue-400/20'
                    : ''
                  }
                `}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {/* Sample indicator */}
                {sample && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-xs text-center">
                      {sample.category === 'drum' && <Drum className="w-3 h-3 mx-auto mb-1 text-yellow-400" />}
                      {sample.category === 'scratch' && <Music className="w-3 h-3 mx-auto mb-1 text-purple-400" />}
                      {sample.category === 'stem' && <Mic className="w-3 h-3 mx-auto mb-1 text-green-400" />}
                      {sample.category === 'fx' && <Grid3X3 className="w-3 h-3 mx-auto mb-1 text-red-400" />}
                      {sample.category === 'vocal' && <Mic className="w-3 h-3 mx-auto mb-1 text-pink-400" />}
                      <div className="text-[10px] truncate px-1">
                        {sample.name}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step indicator */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-600 rounded-b">
                  {isActive && (
                    <motion.div
                      className="h-full bg-toxic-lime rounded-b"
                      initial={{ width: '0%' }}
                      animate={{ width: `${cell.velocity * 100}%` }}
                      transition={{ duration: 0.2 }}
                    />
                  )}
                </div>
              </motion.button>
            );
          })
        )}
      </div>

      {/* Sample Selector Modal */}
      {showSampleSelector && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setShowSampleSelector(false)}
        >
          <div
            className="bg-gray-800 rounded-lg p-4 max-w-lg w-full mx-4 max-h-96 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-4 text-white">Select Sample</h3>

            {/* Pack selector */}
            <div className="mb-4">
              <select
                value={selectedPack || ''}
                onChange={(e) => setSelectedPack(e.target.value || null)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
              >
                <option value="">All Packs</option>
                {samplePacks.map((pack) => (
                  <option key={pack.id} value={pack.id}>
                    {pack.name} ({pack.samples.length} samples)
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {getFilteredSamples().map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => assignSample(sample)}
                  className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded flex items-center gap-3 transition-colors"
                >
                  <div className="flex-shrink-0">
                    {sample.category === 'drum' && <Drum className="w-4 h-4 text-yellow-400" />}
                    {sample.category === 'scratch' && <Music className="w-4 h-4 text-purple-400" />}
                    {sample.category === 'stem' && <Mic className="w-4 h-4 text-green-400" />}
                    {sample.category === 'fx' && <Grid3X3 className="w-4 h-4 text-red-400" />}
                    {sample.category === 'vocal' && <Mic className="w-4 h-4 text-pink-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white truncate">{sample.name}</div>
                    <div className="text-sm text-gray-400 capitalize">{sample.category}</div>
                  </div>
                  {sample.bpm && (
                    <div className="text-xs text-gray-500">
                      {sample.bpm} BPM
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );

  if (helpText) {
    return <Tooltip content={helpText}>{gridContent}</Tooltip>;
  }

  return gridContent;
}
