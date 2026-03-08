---
name: hardware-bridge
description: Instructions for polling the scripts/bridge WebSocket for MIDI/Hardware support.
---

# Hardware Bridge Skill

1. **WebSocket Polling**: Poll the `scripts/bridge` WebSocket connection to maintain communication with the hardware bridge.
2. **Heartbeat & Relaunch**: Implement a heartbeat check. If the heartbeat fails, use terminal execution permissions to automatically relaunch the node process running the bridge.
