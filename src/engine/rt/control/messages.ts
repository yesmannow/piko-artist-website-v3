/**
 * messages.ts - AudioWorklet Message Types
 * 
 * Phase 4: Discriminated union types for AudioWorklet communication
 * 
 * All messages use discriminated unions with a 'kind' field for type safety.
 * This enables exhaustive pattern matching and prevents type errors.
 */

/**
 * Worklet initialization message
 * Sent once from main thread to AudioWorklet to provide SharedArrayBuffer
 */
export interface WorkletInitMessage {
  kind: 'INIT';
  sab: SharedArrayBuffer;
}

/**
 * Worklet ready acknowledgment
 * Sent from AudioWorklet to main thread after successful initialization
 */
export interface WorkletReadyMessage {
  kind: 'READY';
  success: boolean;
  error?: string;
}

/**
 * Worklet error message
 * Sent from AudioWorklet to main thread when an error occurs
 */
export interface WorkletErrorMessage {
  kind: 'ERROR';
  error: string;
  timestamp: number;
}

/**
 * Union of all messages sent TO the AudioWorklet
 */
export type ToWorkletMessage = WorkletInitMessage;

/**
 * Union of all messages sent FROM the AudioWorklet
 */
export type FromWorkletMessage = WorkletReadyMessage | WorkletErrorMessage;

/**
 * Type guard for WorkletInitMessage
 */
export function isWorkletInitMessage(msg: unknown): msg is WorkletInitMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    'kind' in msg &&
    msg.kind === 'INIT' &&
    'sab' in msg &&
    msg.sab instanceof SharedArrayBuffer
  );
}

/**
 * Type guard for WorkletReadyMessage
 */
export function isWorkletReadyMessage(msg: unknown): msg is WorkletReadyMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    'kind' in msg &&
    msg.kind === 'READY' &&
    'success' in msg &&
    typeof msg.success === 'boolean'
  );
}

/**
 * Type guard for WorkletErrorMessage
 */
export function isWorkletErrorMessage(msg: unknown): msg is WorkletErrorMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    'kind' in msg &&
    msg.kind === 'ERROR' &&
    'error' in msg &&
    typeof msg.error === 'string'
  );
}
