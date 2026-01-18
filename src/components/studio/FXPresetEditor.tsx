"use client";

import { useState, useRef } from 'react';
import { useFXEngine, type FXPreset } from '@/hooks/useFXEngine';
import { Knob } from '@/components/studio/controls/Knob';
import { AutomationTrackEditor } from './fx/AutomationTrackEditor';
import { FXAutomationCurveEditor } from './fx/FXAutomationCurveEditor';
import { useInputBindings } from '@/hooks/useInputBindings';
import { downloadPresets, uploadPresets } from '@/lib/fx/FXPresetIO';
import { Save, Trash2, Play, RotateCcw, Plus, Settings, Download, Upload } from 'lucide-react';

/**
 * FXPresetEditor - Component for editing and managing FX presets
 * 
 * Features:
 * - Real-time FX parameter control (delay, reverb, filter)
 * - Save/load/delete presets
 * - Deck selection (deckA/deckB)
 * - Integration with TimelinePlayer for automation
 */
export function FXPresetEditor() {
  const fx = useFXEngine();
  const [presetName, setPresetName] = useState('');
  const [delay, setDelay] = useState(0);
  const [reverb, setReverb] = useState(0);
  const [filter, setFilter] = useState(0);
  const [selectedTrackForCurve, setSelectedTrackForCurve] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Enable input bindings (keyboard, MIDI, audio)
  useInputBindings();

  const handleDelayChange = async (value: number) => {
    setDelay(value);
    await fx.setFX(fx.activeDeck, 'delay', value);
  };

  const handleReverbChange = async (value: number) => {
    setReverb(value);
    await fx.setFX(fx.activeDeck, 'reverb', value);
  };

  const handleFilterChange = async (value: number) => {
    setFilter(value);
    await fx.setFX(fx.activeDeck, 'filter', value);
  };

  const handleSavePreset = () => {
    if (!presetName.trim()) return;
    
    fx.savePreset({
      name: presetName.trim(),
      delay,
      reverb,
      filter,
      deck: fx.activeDeck,
    });
    
    setPresetName('');
  };

  const handleLoadPreset = async (preset: FXPreset) => {
    await fx.loadPreset(preset);
    setDelay(preset.delay);
    setReverb(preset.reverb);
    setFilter(preset.filter);
  };

  const handleReset = async () => {
    await fx.resetFX(fx.activeDeck);
    setDelay(0);
    setReverb(0);
    setFilter(0);
  };

  const handleExport = () => {
    downloadPresets(fx.presets, `fx-presets-${Date.now()}.json`);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const importedPresets = await uploadPresets(file);
      // Add imported presets to existing ones
      importedPresets.forEach((preset) => {
        fx.savePreset(preset);
      });
      alert(`Imported ${importedPresets.length} preset(s)`);
    } catch (error) {
      console.error('Failed to import presets:', error);
      alert('Failed to import presets. Please check the file format.');
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6 rounded-lg border border-white/10 bg-black/40 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">FX Preset Editor</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            disabled={fx.presets.length === 0}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10 transition"
          >
            <Upload className="h-4 w-4" />
            Import
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
          <div className="flex gap-2">
          <button
            onClick={() => fx.setActiveDeck('deckA')}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
              fx.activeDeck === 'deckA'
                ? 'bg-[#c1ff00] text-black'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            Deck A
          </button>
          <button
            onClick={() => fx.setActiveDeck('deckB')}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
              fx.activeDeck === 'deckB'
                ? 'bg-[#c1ff00] text-black'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            Deck B
          </button>
        </div>
      </div>

      {/* FX Controls */}
      <div className="grid grid-cols-3 gap-6">
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-wider text-white/60">
            Delay
          </label>
          <Knob
            value={delay}
            onChange={handleDelayChange}
            min={0}
            max={1}
            label="Delay"
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-wider text-white/60">
            Reverb
          </label>
          <Knob
            value={reverb}
            onChange={handleReverbChange}
            min={0}
            max={1}
            label="Reverb"
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-wider text-white/60">
            Filter
          </label>
          <Knob
            value={filter}
            onChange={handleFilterChange}
            min={0}
            max={1}
            label="Filter"
          />
        </div>
      </div>

      {/* Preset Management */}
      <div className="space-y-4 border-t border-white/10 pt-6">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            placeholder="Preset name..."
            className="flex-1 rounded-lg border border-white/10 bg-black/40 px-4 py-2 text-white placeholder:text-white/40 focus:border-[#c1ff00] focus:outline-none"
          />
          <button
            onClick={handleSavePreset}
            disabled={!presetName.trim()}
            className="flex items-center gap-2 rounded-lg bg-[#c1ff00] px-4 py-2 text-black font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#c1ff00]/80 transition"
          >
            <Save className="h-4 w-4" />
            Save
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white hover:bg-white/10 transition"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
          <button
            onClick={() => fx.addAutomationTrack('Delay Automation', 'delay', fx.activeDeck)}
            className="flex items-center gap-2 rounded-lg border border-[#7c3aed]/50 bg-[#7c3aed]/10 px-4 py-2 text-[#7c3aed] hover:bg-[#7c3aed]/20 transition"
          >
            <Settings className="h-4 w-4" />
            Add Automation
          </button>
        </div>

        {/* Preset List */}
        {fx.presets.length > 0 && (
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-white/60">
              Saved Presets
            </label>
            <div className="grid gap-2">
              {fx.presets.map((preset) => (
                <div
                  key={preset.id}
                  className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3"
                >
                  <div>
                    <p className="font-semibold text-white">{preset.name}</p>
                    <p className="text-xs text-white/60">
                      {preset.deck || 'Both'} • D:{preset.delay.toFixed(2)} R:{preset.reverb.toFixed(2)} F:{preset.filter.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleLoadPreset(preset)}
                      className="rounded-lg bg-[#7c3aed] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#7c3aed]/80 transition"
                    >
                      <Play className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => fx.deletePreset(preset.id)}
                      className="rounded-lg border border-red-500/50 bg-red-500/10 px-3 py-1.5 text-sm font-semibold text-red-400 hover:bg-red-500/20 transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Automation Tracks */}
      <div className="border-t border-white/10 pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Automation Tracks</h3>
          <div className="flex gap-2">
            <button
              onClick={() => fx.addAutomationTrack('Delay Automation', 'delay', fx.activeDeck)}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white hover:bg-white/10 transition"
            >
              <Plus className="h-4 w-4" />
              Delay
            </button>
            <button
              onClick={() => fx.addAutomationTrack('Reverb Automation', 'reverb', fx.activeDeck)}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white hover:bg-white/10 transition"
            >
              <Plus className="h-4 w-4" />
              Reverb
            </button>
            <button
              onClick={() => fx.addAutomationTrack('Filter Automation', 'filter', fx.activeDeck)}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white hover:bg-white/10 transition"
            >
              <Plus className="h-4 w-4" />
              Filter
            </button>
          </div>
          </div>
        </div>
        
        {fx.automationTracks.length > 0 ? (
          <div className="space-y-4">
            {fx.automationTracks.map((track) => (
              <div key={track.id} className="space-y-3">
                <AutomationTrackEditor
                  track={track}
                  duration={60}
                  onUpdate={(updated) => fx.updateAutomationTrack(track.id, updated)}
                  onDelete={() => fx.removeAutomationTrack(track.id)}
                  onAddKeyframe={(time, value) => fx.addKeyframeToTrack(track.id, time, value)}
                  onRemoveKeyframe={(time) => fx.removeKeyframeFromTrack(track.id, time)}
                  onUpdateKeyframe={(time, value) => fx.updateKeyframeInTrack(track.id, time, value)}
                />
                {/* Curve Editor Toggle */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={() =>
                      setSelectedTrackForCurve(
                        selectedTrackForCurve === track.id ? null : track.id
                      )
                    }
                    className="text-xs text-white/60 hover:text-white/80 transition"
                  >
                    {selectedTrackForCurve === track.id
                      ? 'Hide Curve Editor'
                      : 'Show Curve Editor'}
                  </button>
                </div>
                {/* Curve Editor */}
                {selectedTrackForCurve === track.id && (
                  <FXAutomationCurveEditor
                    keyframes={track.keyframes}
                    onChange={(newKeyframes) => {
                      fx.updateAutomationTrack(track.id, {
                        ...track,
                        keyframes: newKeyframes,
                      });
                    }}
                    duration={60}
                  />
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-white/10 bg-white/5 p-8 text-center">
            <p className="text-white/60 text-sm">
              No automation tracks yet. Click above to add one.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
