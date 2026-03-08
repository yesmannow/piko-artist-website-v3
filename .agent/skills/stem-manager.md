---
name: stem-manager
description: Logic for isolating Vocals, Drums, Bass, and Melody with fallback mechanisms.
---

# Stem Manager Skill

This defines the rules for handling isolated components of a track for the Stem Performance Pads.

## Target Stems
Tracks are broken into four distinct busses:
1. **Vocals (V)**
2. **Drums (D)**
3. **Bass (B)**
4. **Melody/Other (M)**

## Logic Path
When "Generate Stems" is invoked:

1. **Future Demucs API Integration (Primary)**:
   - Build async fetch request pushing the audio file to a cloud Python backend utilizing the Demucs transformer model.
   - Wait for response containing four distinct `.wav` URLs.
   - Load URLs into four synchronous `Tone.Player` instances locked to the same transport timeline.

2. **Fallback Filter-Based Isolation (Secondary)**:
   - If offline, processing fails, or waiting for API results, use Phase-Locked Crossover Filters (Tone.MultibandSplit or customized Biquads):
     - Drums/Bass: Low-pass filter < 250Hz + narrow spike at transient frequencies.
     - Vocals: Band-pass filter ~300Hz to ~3kHz.
     - Melody (Other): High-pass > 3kHz and spatial phase spreading.
   - Note: This is a hack approximation and causes phase coloration, but guarantees continuous playability.
