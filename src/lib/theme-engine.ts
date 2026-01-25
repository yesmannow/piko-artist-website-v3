/**
 * theme-engine.ts - Dynamic theme configuration based on track energy and BPM
 *
 * Maps audio metadata (energy, BPM) to visual themes that change the UI
 * colors, glow effects, and animation speeds in real-time.
 */

export interface ThemePreset {
  primary: string;   // Main accent color (e.g., rgba(59, 130, 246, 1))
  glow: string;      // Glow color for shadows (e.g., rgba(59, 130, 246, 0.4))
  accent: string;    // Secondary accent (e.g., 'cyan', 'orange')
  speed: number;     // Animation speed multiplier (1.0 = normal, 3.0 = fast)
}

export const themeMap: Record<'chill' | 'hype' | 'dark', ThemePreset> = {
  chill: {
    primary: 'rgba(59, 130, 246, 1)', // Blue
    glow: 'rgba(59, 130, 246, 0.4)',
    accent: 'cyan',
    speed: 1.0, // Slower, relaxed animations
  },
  hype: {
    primary: 'rgba(239, 68, 68, 1)', // Red
    glow: 'rgba(239, 68, 68, 0.5)',
    accent: 'orange',
    speed: 3.0, // Faster, intense animations
  },
  dark: {
    primary: 'rgba(147, 51, 234, 1)', // Purple
    glow: 'rgba(147, 51, 234, 0.4)',
    accent: 'fuchsia',
    speed: 1.5, // Medium speed
  },
};

/**
 * Get theme preset based on energy and BPM
 *
 * @param energy - Energy score (0.0 to 1.0)
 * @param bpm - Beats per minute
 * @returns Theme preset name
 */
export function getThemeByEnergy(energy: number, bpm: number): 'chill' | 'hype' | 'dark' {
  // High energy or fast BPM → hype theme
  if (energy > 0.8 || bpm > 130) {
    return 'hype';
  }

  // Low energy → chill theme
  if (energy < 0.4) {
    return 'chill';
  }

  // Default to dark/neutral theme
  return 'dark';
}

/**
 * Get theme preset object
 *
 * @param energy - Energy score (0.0 to 1.0)
 * @param bpm - Beats per minute
 * @returns Theme preset object
 */
export function getThemePreset(energy: number, bpm: number): ThemePreset {
  const themeName = getThemeByEnergy(energy, bpm);
  return themeMap[themeName];
}
