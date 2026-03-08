---
name: analyze-track
description: How to use essentia.js WASM to extract BPM and Key, and map Energy levels.
---

# Analyze Track Skill

When analyzing a track:
1. **Essentia.js WASM**: Use essentia.js (WASM build) to extract the accurate BPM and the Camelot Key of the audio buffer.
2. **Energy Mapping**: Map the calculated "Energy" levels to the 5-bar UI meter.
   - 1 Bar: Low Energy (Chill)
   - 2 Bars: Medium-Low
   - 3 Bars: Medium (Groovy)
   - 4 Bars: Medium-High (Peak)
   - 5 Bars: High (Aggressive/Climax)
