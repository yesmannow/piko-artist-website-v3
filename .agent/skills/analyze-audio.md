---
name: analyze-audio
description: How to use essentia.js and Meyda to extract BPM, Camelot Key, and Energy. Include mapping for Energy 5-bar meter.
---

# Analyze Audio Skill

When a new track is loaded into a deck, follow these intelligence extraction procedures:

1. **Decoding**: Pass the raw `AudioBuffer` to an asynchronous Web Worker to prevent UI blocking.
2. **Feature Extraction (Essentia/Meyda)**:
   - Run `PercivalBpmEstimator` or equivalent for accurate BPM.
   - Run `KeyExtractor` to compute musical key, mapping standard notation (e.g., "A minor") to Camelot Notation (e.g., "8A").
   - Compute `RMS` (Root Mean Square) energy across the buffer to derive dynamic intensity.
3. **Energy Normalization**: Convert the raw dynamic intensity into a normalized `0.0` to `1.0` float.
4. **Energy 5-Bar Meter Mapping**:
   The `EnergyIndicator` component translates the normalized float into a 5-bar visual meter:
   - **0.00 - 0.20** -> 1 Bar (Chill / Ambient)
   - **0.21 - 0.40** -> 2 Bars (Warmup)
   - **0.41 - 0.60** -> 3 Bars (Groove / Steady)
   - **0.61 - 0.80** -> 4 Bars (Peak Time)
   - **0.81 - 1.00** -> 5 Bars (Climax / Aggressive)
