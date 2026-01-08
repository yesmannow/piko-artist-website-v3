"use client";

import { useState, useEffect } from 'react';
import { X, Trash2, Radio } from 'lucide-react';
import { useMIDIStore } from '@/store/useMIDIStore';
import { triggerHaptic, HAPTIC_PATTERNS } from '@/utils/haptics';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'AUDIO' | 'MIDI' | 'ABOUT';

/**
 * PHASE 9: Settings Modal
 * 
 * Provides user interface for:
 * - Audio output device selection
 * - Latency hint configuration
 * - MIDI device management
 * - MIDI mapping customization
 * - App information
 */
export const SettingsModal = ({ isOpen, onClose }: SettingsModalProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('AUDIO');
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('default');
  const [latencyHint, setLatencyHint] = useState<'interactive' | 'balanced'>('interactive');

  // MIDI store
  const midiConnected = useMIDIStore((state) => state.isConnected);
  const midiDeviceName = useMIDIStore((state) => state.deviceName);
  const midiMappings = useMIDIStore((state) => state.mappings);
  const learnMode = useMIDIStore((state) => state.learnMode);
  const startLearn = useMIDIStore((state) => state.startLearn);
  const stopLearn = useMIDIStore((state) => state.stopLearn);
  const removeMapping = useMIDIStore((state) => state.removeMapping);
  const clearMappings = useMIDIStore((state) => state.clearMappings);

  // Load audio devices
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices()
        .then((devices) => {
          const audioOutputs = devices.filter((device) => device.kind === 'audiooutput');
          setAudioDevices(audioOutputs);
        })
        .catch((err) => {
          console.warn('Failed to enumerate audio devices:', err);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTabChange = (tab: TabType) => {
    triggerHaptic(HAPTIC_PATTERNS.CLICK);
    setActiveTab(tab);
  };

  const handleClose = () => {
    triggerHaptic(HAPTIC_PATTERNS.CLICK);
    if (learnMode) {
      stopLearn();
    }
    onClose();
  };

  const handleDeleteMapping = (midiKey: string) => {
    triggerHaptic(HAPTIC_PATTERNS.CLICK);
    removeMapping(midiKey);
  };

  const handleClearAllMappings = () => {
    triggerHaptic(HAPTIC_PATTERNS.CLICK);
    if (confirm('Clear all MIDI mappings?')) {
      clearMappings();
    }
  };

  const handleToggleLearnMode = () => {
    triggerHaptic(HAPTIC_PATTERNS.CLICK);
    if (learnMode) {
      stopLearn();
    } else {
      // Will be activated when user clicks a control
      alert('Click any control (Play, Cue, Fader) to map it to a MIDI input');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      {/* Modal Container */}
      <div className="w-full max-w-2xl h-[80vh] bg-gray-900 rounded-lg shadow-2xl flex flex-col overflow-hidden border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-xl font-barlow uppercase tracking-wider text-white font-bold">
            Settings
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-800 rounded transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800">
          {(['AUDIO', 'MIDI', 'ABOUT'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`flex-1 py-3 px-4 font-barlow uppercase text-sm font-bold transition-colors ${
                activeTab === tab
                  ? 'bg-gray-800 text-white border-b-2 border-blue-500'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* AUDIO TAB */}
          {activeTab === 'AUDIO' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-barlow uppercase tracking-wider text-gray-400 mb-3">
                  Audio Output Device
                </h3>
                {audioDevices.length > 0 ? (
                  <select
                    value={selectedDevice}
                    onChange={(e) => setSelectedDevice(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white font-mono text-sm"
                  >
                    <option value="default">System Default</option>
                    {audioDevices.map((device) => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `Device ${device.deviceId.slice(0, 8)}`}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm text-gray-500">
                    Audio device selection not supported in this browser
                  </p>
                )}
              </div>

              <div>
                <h3 className="text-sm font-barlow uppercase tracking-wider text-gray-400 mb-3">
                  Latency Hint
                </h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 bg-gray-800 rounded cursor-pointer hover:bg-gray-750 transition-colors">
                    <input
                      type="radio"
                      name="latency"
                      value="interactive"
                      checked={latencyHint === 'interactive'}
                      onChange={(e) => setLatencyHint(e.target.value as 'interactive')}
                      className="w-4 h-4"
                    />
                    <div>
                      <div className="font-barlow uppercase text-sm font-bold text-white">
                        Interactive (Recommended)
                      </div>
                      <div className="text-xs text-gray-500">
                        Lowest latency for real-time performance
                      </div>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 bg-gray-800 rounded cursor-pointer hover:bg-gray-750 transition-colors">
                    <input
                      type="radio"
                      name="latency"
                      value="balanced"
                      checked={latencyHint === 'balanced'}
                      onChange={(e) => setLatencyHint(e.target.value as 'balanced')}
                      className="w-4 h-4"
                    />
                    <div>
                      <div className="font-barlow uppercase text-sm font-bold text-white">
                        Balanced
                      </div>
                      <div className="text-xs text-gray-500">
                        Balance between latency and stability
                      </div>
                    </div>
                  </label>
                </div>
                <p className="text-xs text-gray-600 mt-3">
                  Note: Changes require app restart
                </p>
              </div>
            </div>
          )}

          {/* MIDI TAB */}
          {activeTab === 'MIDI' && (
            <div className="space-y-6">
              {/* Connection Status */}
              <div>
                <h3 className="text-sm font-barlow uppercase tracking-wider text-gray-400 mb-3">
                  Connection Status
                </h3>
                <div className="flex items-center gap-3 p-3 bg-gray-800 rounded">
                  <Radio className={`w-5 h-5 ${midiConnected ? 'text-green-500' : 'text-gray-600'}`} />
                  <div>
                    <div className="font-mono text-sm text-white">
                      {midiConnected ? midiDeviceName || 'Connected' : 'No device connected'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {midiConnected ? 'MIDI device active' : 'Connect a MIDI controller to get started'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Learn Mode */}
              <div>
                <h3 className="text-sm font-barlow uppercase tracking-wider text-gray-400 mb-3">
                  MIDI Learn
                </h3>
                <button
                  onClick={handleToggleLearnMode}
                  disabled={!midiConnected}
                  className={`w-full py-3 px-4 rounded font-barlow uppercase font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                    learnMode
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-750'
                  }`}
                >
                  {learnMode ? 'Exit Learn Mode' : 'Enter Learn Mode'}
                </button>
                <p className="text-xs text-gray-600 mt-2">
                  In Learn Mode, click any control then press a MIDI button/knob to map it
                </p>
              </div>

              {/* Current Mappings */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-barlow uppercase tracking-wider text-gray-400">
                    Current Mappings ({Object.keys(midiMappings).length})
                  </h3>
                  {Object.keys(midiMappings).length > 0 && (
                    <button
                      onClick={handleClearAllMappings}
                      className="text-xs text-red-500 hover:text-red-400 font-barlow uppercase"
                    >
                      Clear All
                    </button>
                  )}
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {Object.keys(midiMappings).length === 0 ? (
                    <div className="text-center py-8 text-gray-600 text-sm">
                      No MIDI mappings configured
                    </div>
                  ) : (
                    Object.entries(midiMappings).map(([midiKey, mapping]) => (
                      <div
                        key={midiKey}
                        className="flex items-center justify-between p-3 bg-gray-800 rounded"
                      >
                        <div>
                          <div className="font-mono text-sm text-white">
                            {mapping.label}
                          </div>
                          <div className="text-xs text-gray-500">
                            → {mapping.action.replace('_', ' ').toUpperCase()}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteMapping(midiKey)}
                          className="p-2 hover:bg-gray-700 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ABOUT TAB */}
          {activeTab === 'ABOUT' && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-2xl font-barlow uppercase tracking-wider text-white font-bold mb-2">
                  Piko Studio V2
                </h3>
                <p className="text-sm text-gray-500">
                  Professional Mobile DJ Workstation
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-gray-800 rounded">
                  <h4 className="text-xs font-barlow uppercase tracking-wider text-gray-400 mb-2">
                    Version
                  </h4>
                  <p className="text-sm text-white font-mono">3.0.0-beta</p>
                </div>

                <div className="p-4 bg-gray-800 rounded">
                  <h4 className="text-xs font-barlow uppercase tracking-wider text-gray-400 mb-2">
                    Features
                  </h4>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>✓ Dual deck audio engine</li>
                    <li>✓ High-fidelity waveform visualization</li>
                    <li>✓ Automatic BPM detection & sync</li>
                    <li>✓ Loop & hot cue system</li>
                    <li>✓ WebMIDI hardware support</li>
                    <li>✓ PWA with offline capability</li>
                  </ul>
                </div>

                <div className="p-4 bg-gray-800 rounded">
                  <h4 className="text-xs font-barlow uppercase tracking-wider text-gray-400 mb-2">
                    Browser Compatibility
                  </h4>
                  <p className="text-sm text-gray-300">
                    Chrome/Edge 90+, Safari 14+ (iOS/iPadOS)
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    WebMIDI requires Chrome/Edge
                  </p>
                </div>

                <div className="p-4 bg-gray-800 rounded">
                  <h4 className="text-xs font-barlow uppercase tracking-wider text-gray-400 mb-2">
                    Credits
                  </h4>
                  <p className="text-sm text-gray-300">
                    Built with Next.js, React Three Fiber, Web Audio API
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
