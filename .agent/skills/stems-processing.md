---
name: stems-processing
description: Define logic for V/D/B/M micro-toggles and fallback filters.
---

# Stems Processing Skill

This outlines the logic for the (V, D, B, M) micro-toggles on the Deck UI.

1. **Stem-Separation Worker (Primary)**: Use the dedicated Web Worker (or API) for primary full isolation of Vocals, Drums, Bass, and Melody.
2. **Filter Fallbacks (Secondary)**: If the primary Stem-Separation worker is busy or unavailable, use high/low-pass filters to emulate isolation:
   - Vocals: Band-pass.
   - Drums/Bass: Low-pass.
   - Melody: High-pass.

3. **Build-up Macro Chain (Phase SE-1)**: A single macro knob (0→1) that triggers the following pre-set chain for professional build-ups:
   - **Ramp Delay Mix**: 0 → 0.7 (linear ramp as macro increases).
   - **Ramp Delay Feedback**: 0.35 → 0.85 (intensifying feedback loop).
   - **HPF (High-Pass Filter)**: 0.5 → 1.0 (from center to full high-pass, cutting low frequencies for a rising tension effect).
   - **Usage**: Implemented in `DeckFXRack.tsx` as the "Build-up" knob. Wire to the deck's FX chain via `setDeckFX()`.
