---
name: midi-bridge
description: Instructions for interacting with Prolink hardware and maintaining MIDI state in the UI.
---

# MIDI Bridge Skill

Piko Artist Studio bridges software with physical DJ controllers (Pioneer CDJs, MIDI controllers, etc).

## Execution Directives
1. **Connection Initialization**:
   - Call `navigator.requestMIDIAccess()` inside a dedicated `useMidiBridge` hook.
   - Listen for `statechange` events to detect plug/unplug of USB interfaces.
2. **Message Handling**:
   - Parse raw MIDI hexadecimal arrays into CC (Control Change) or Note On/Off commands.
   - Map standard MIDI codes to Zustand dispatchers (e.g., CC 01 to `setMasterBpm`, CC 07 to `setDeckVolume`).
3. **UI Synchronization**:
   - When active, update the `StudioTopBar` indicator with a neon green `MIDI: LINKED` status pip.
   - If connection is lost or permission denied, fallback to `MIDI: DISCONNECTED` with a red indicator.
4. **Prolink Network Script**:
   - Future scope: Listen to UDP broadcast packets from CDJs via WebSockets bridged via a local Node script (`scripts/bridge.js`).
