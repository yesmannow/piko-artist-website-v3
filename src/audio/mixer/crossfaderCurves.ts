/**
 * Phase S7: Crossfader Curve Mappings
 *
 * Pure functions for different DJ crossfader curve types.
 * Input: x in [0..1] (0 = full A, 1 = full B)
 * Output: { gainA, gainB } normalized [0..1]
 */

export type CrossfaderCurve = 'linear' | 'constantPower' | 'dip' | 'cut';

export interface CrossfaderGains {
  gainA: number;
  gainB: number;
}

/**
 * Apply crossfader curve mapping
 * @param x Position in [0, 1] where 0 = full A, 1 = full B
 * @param curve Crossfader curve type
 * @returns Normalized gain values for both channels
 */
export function applyCrossfaderCurve(
  x: number,
  curve: CrossfaderCurve
): CrossfaderGains {
  // Clamp input to [0, 1]
  const position = Math.max(0, Math.min(1, x));

  switch (curve) {
    case 'linear':
      return applyLinearCurve(position);

    case 'constantPower':
      return applyConstantPowerCurve(position);

    case 'dip':
      return applyDipCurve(position);

    case 'cut':
      return applyCutCurve(position);

    default:
      return applyLinearCurve(position);
  }
}

/**
 * Linear crossfade: simple A/B blend
 */
function applyLinearCurve(x: number): CrossfaderGains {
  return {
    gainA: 1 - x,
    gainB: x,
  };
}

/**
 * Constant power crossfade: maintains perceived loudness
 * Sum of squares = 1 (equal power law)
 */
function applyConstantPowerCurve(x: number): CrossfaderGains {
  const angle = x * Math.PI / 2;
  return {
    gainA: Math.cos(angle),
    gainB: Math.sin(angle),
  };
}

/**
 * Dip curve: constant power with center dip (-3dB at center)
 * Creates a smooth blend feeling for long mixes
 */
function applyDipCurve(x: number): CrossfaderGains {
  const angle = x * Math.PI / 2;
  // Apply -3dB dip at center (0.707 = -3dB)
  const centerDipFactor = 1 - (0.3 * Math.sin(x * Math.PI));

  return {
    gainA: Math.cos(angle) * centerDipFactor,
    gainB: Math.sin(angle) * centerDipFactor,
  };
}

/**
 * Cut curve: fast cut near ends for scratch feel
 * Hard cut in 10% zones at each end, exponential in middle
 */
function applyCutCurve(x: number): CrossfaderGains {
  const threshold = 0.1; // 10% hard cut zone at each end

  if (x < threshold) {
    // Full A zone (hard cut)
    return { gainA: 1, gainB: 0 };
  } else if (x > 1 - threshold) {
    // Full B zone (hard cut)
    return { gainA: 0, gainB: 1 };
  } else {
    // Transition zone with exponential curve (sharper than linear)
    const normalizedPos = (x - threshold) / (1 - 2 * threshold);
    const exponent = 3; // Higher = sharper cut feel

    return {
      gainA: Math.pow(1 - normalizedPos, exponent),
      gainB: Math.pow(normalizedPos, exponent),
    };
  }
}

/**
 * Convert crossfader value from [-1, 1] range to [0, 1] range
 * @param value Crossfader value in [-1, 1] range
 * @returns Normalized value in [0, 1] range
 */
export function normalizeCrossfaderValue(value: number): number {
  return Math.max(0, Math.min(1, (value + 1) / 2));
}
