# WASM Binaries Directory

This directory is reserved for WebAssembly binaries required by the DJ Studio Mixer.

## Purpose

Static location for .wasm binaries to ensure correct serving with proper MIME types and headers.

## Files (to be added)

- `essentia-wasm.wasm` - Essentia.js WASM module for audio analysis
- `ffmpeg-core.wasm` - FFmpeg.wasm core module for audio export
- Additional WASM modules as needed

## Configuration

The Next.js configuration (next.config.mjs) includes:
- Webpack rules to handle .wasm files as asset resources
- Cross-Origin headers (COOP/COEP) to enable SharedArrayBuffer
- Fallbacks for Node.js modules (fs, path, crypto) in browser context

## Phase II: Core Architecture

This directory is part of the Phase II implementation of the DJ Studio Mixer rebuild.
