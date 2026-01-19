/**
 * Prolink Bridge Server
 *
 * Node.js sidecar application that:
 * 1. Listens to Pioneer Pro DJ Link UDP broadcasts
 * 2. Parses binary packets into JSON
 * 3. Relays data to web clients via WebSocket
 *
 * Run this on the DJ's laptop (connected to the DJ network via Ethernet)
 * The web app connects to ws://localhost:8080
 */

import { bringOnline } from 'prolink-connect';
import { WebSocketServer } from 'ws';

interface CDJStatus {
  trackId: number;
  playState: 'playing' | 'paused' | 'cued';
  sliderPitch: number; // 0-1
  currentBpm: number;
  deviceId: number;
}

// WebSocket server
const wss = new WebSocketServer({ port: 8080 });

console.log('🚀 Prolink Bridge Server starting...');
console.log('📡 WebSocket server listening on ws://localhost:8080');

// Track last state for diffing
const lastState = new Map<number, CDJStatus>();

// Initialize Prolink
const network = bringOnline({
  vcdjId: 5, // Virtual Device ID 5 (standard for software)
});

network.on('connected', (device) => {
  console.log(`✅ Connected to device: ${device.name} (ID: ${device.id})`);

  // Listen for status updates
  device.on('status', (status) => {
    const cdjStatus: CDJStatus = {
      trackId: status.trackId || 0,
      playState: status.isPlaying ? 'playing' : status.isCued ? 'cued' : 'paused',
      sliderPitch: status.sliderPitch || 0,
      currentBpm: status.currentBpm || 0,
      deviceId: device.id,
    };

    // State diffing: only broadcast if data changed
    const last = lastState.get(device.id);
    const hasChanged =
      !last ||
      last.trackId !== cdjStatus.trackId ||
      last.playState !== cdjStatus.playState ||
      Math.abs(last.sliderPitch - cdjStatus.sliderPitch) > 0.01 ||
      Math.abs(last.currentBpm - cdjStatus.currentBpm) > 0.1;

    if (hasChanged) {
      lastState.set(device.id, cdjStatus);

      // Broadcast to all connected WebSocket clients
      wss.clients.forEach((client) => {
        if (client.readyState === 1) { // OPEN
          client.send(JSON.stringify(cdjStatus));
        }
      });
    }
  });
});

// Handle WebSocket connections
wss.on('connection', (ws) => {
  console.log('📱 WebSocket client connected');

  ws.on('close', () => {
    console.log('📱 WebSocket client disconnected');
  });

  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
  });

  // Send current state to new client
  lastState.forEach((status) => {
    ws.send(JSON.stringify(status));
  });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  wss.close();
  process.exit(0);
});

console.log('✅ Bridge server ready. Waiting for CDJ connections...');
