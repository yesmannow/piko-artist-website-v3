/**
 * FXPresetIO - Import/Export utilities for FX presets and automation
 *
 * Allows users to save and share FX preset configurations as JSON files.
 */

import type { FXPreset } from '@/hooks/useFXEngine';
import type { AutomationTrack } from './FXAutomation';
import { exportAutomationTracks, importAutomationTracks } from './FXAutomation';

/**
 * Export FX presets to JSON
 */
export function exportFXPresets(presets: FXPreset[]): string {
  return JSON.stringify(
    {
      version: '1.0',
      presets,
      exportedAt: new Date().toISOString(),
    },
    null,
    2
  );
}

/**
 * Import FX presets from JSON
 */
export function importFXPresets(json: string): FXPreset[] {
  try {
    const data = JSON.parse(json);

    // Handle both old format (array) and new format (object with version)
    if (Array.isArray(data)) {
      return data as FXPreset[];
    }

    if (data.presets && Array.isArray(data.presets)) {
      return data.presets as FXPreset[];
    }

    throw new Error('Invalid preset format');
  } catch (e) {
    console.error('Failed to import FX presets:', e);
    return [];
  }
}

/**
 * Download presets as JSON file
 */
export function downloadPresets(presets: FXPreset[], filename = 'fx-presets.json') {
  const json = exportFXPresets(presets);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Upload presets from file
 */
export function uploadPresets(
  file: File
): Promise<FXPreset[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = e.target?.result as string;
        const presets = importFXPresets(json);
        resolve(presets);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

/**
 * Export automation tracks
 */
export function downloadAutomationTracks(
  tracks: AutomationTrack[],
  filename = 'fx-automation.json'
) {
  const json = exportAutomationTracks(tracks);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
