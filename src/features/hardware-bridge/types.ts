/**
 * Hardware Bridge Type Definitions
 */

export interface CDJStatus {
  trackId: number;
  playState: 'playing' | 'paused' | 'cued';
  sliderPitch: number; // 0-1
  currentBpm: number;
  deviceId: number;
}

export type BridgeConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';
