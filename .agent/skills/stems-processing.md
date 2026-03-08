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
