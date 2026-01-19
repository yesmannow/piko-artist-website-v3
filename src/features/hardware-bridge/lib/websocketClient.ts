/**
 * WebSocket Client for Prolink Bridge
 *
 * Handles connection to the Node.js bridge server (ws://localhost:8080)
 */

import type { CDJStatus, BridgeConnectionState } from '../types';

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  private onStatusCallback?: (status: CDJStatus) => void;
  private onStateChangeCallback?: (state: BridgeConnectionState) => void;

  constructor(url: string = 'ws://localhost:8080') {
    this.url = url;
  }

  /**
   * Connect to the bridge server
   */
  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    try {
      this.ws = new WebSocket(this.url);
      this.updateState('connecting');

      this.ws.onopen = () => {
        console.log('[WebSocketClient] Connected to bridge');
        this.reconnectAttempts = 0;
        this.updateState('connected');
      };

      this.ws.onmessage = (event) => {
        try {
          const status: CDJStatus = JSON.parse(event.data);
          this.onStatusCallback?.(status);
        } catch (error) {
          console.error('[WebSocketClient] Failed to parse message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('[WebSocketClient] WebSocket error:', error);
        this.updateState('error');
      };

      this.ws.onclose = () => {
        console.log('[WebSocketClient] Connection closed');
        this.updateState('disconnected');
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('[WebSocketClient] Failed to create WebSocket:', error);
      this.updateState('error');
    }
  }

  /**
   * Disconnect from the bridge server
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.updateState('disconnected');
  }

  /**
   * Attempt to reconnect
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('[WebSocketClient] Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    setTimeout(() => {
      console.log(`[WebSocketClient] Reconnecting (attempt ${this.reconnectAttempts})...`);
      this.connect();
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  /**
   * Update connection state and notify callback
   */
  private updateState(state: BridgeConnectionState): void {
    this.onStateChangeCallback?.(state);
  }

  /**
   * Set callback for CDJ status updates
   */
  onStatus(callback: (status: CDJStatus) => void): void {
    this.onStatusCallback = callback;
  }

  /**
   * Set callback for connection state changes
   */
  onStateChange(callback: (state: BridgeConnectionState) => void): void {
    this.onStateChangeCallback = callback;
  }

  /**
   * Get current connection state
   */
  getState(): BridgeConnectionState {
    if (!this.ws) return 'disconnected';
    if (this.ws.readyState === WebSocket.OPEN) return 'connected';
    if (this.ws.readyState === WebSocket.CONNECTING) return 'connecting';
    return 'disconnected';
  }
}
