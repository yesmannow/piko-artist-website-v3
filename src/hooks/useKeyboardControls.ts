/**
 * useKeyboardControls Hook
 *
 * Phase VIII: Hardware-Style Keyboard Controls
 *
 * Implements global keyboard listeners for tactile, hardware-like studio control:
 * - Spacebar: Play/Pause master playback
 * - Keys 1-4: Toggle individual stems (Vocals, Drums, Bass, Other)
 * - Arrow Keys: Jog forward/backward (±1 beat)
 * - Shift + Arrow: Precision jog (±0.1s)
 * - Cmd/Ctrl + R: Start/Stop recording
 *
 * Features:
 * - Prevents conflicts with text inputs/textareas
 * - Visual feedback on key press (optional)
 * - Customizable key mappings
 * - Supports both decks independently
 *
 * Usage:
 * ```tsx
 * const { enableKeyboard, disableKeyboard, isEnabled } = useKeyboardControls({
 *   onPlayPause: () => togglePlay(),
 *   onStemToggle: (stemIndex) => toggleStem(stemIndex),
 * });
 * ```
 */

import { useEffect, useCallback, useState, useRef } from 'react';

interface KeyboardControlsConfig {
  /** Callback when spacebar is pressed (Play/Pause) */
  onPlayPause?: () => void;
  /** Callback when stem keys 1-4 are pressed */
  onStemToggle?: (stemIndex: number) => void;
  /** Callback when arrow keys are pressed for jogging */
  onJog?: (direction: 'forward' | 'backward', precision: boolean) => void;
  /** Callback when recording hotkey is pressed (Cmd/Ctrl + R) */
  onRecordToggle?: () => void;
  /** Callback when deck A/B is focused (Q/W keys) */
  onDeckFocus?: (deck: 'A' | 'B') => void;
  /** Enable/disable keyboard controls on mount (default: true) */
  enabled?: boolean;
  /** Whether to show visual feedback on key press (default: false) */
  showFeedback?: boolean;
}

interface KeyboardControlsReturn {
  /** Whether keyboard controls are currently enabled */
  isEnabled: boolean;
  /** Enable keyboard controls */
  enableKeyboard: () => void;
  /** Disable keyboard controls (useful when modal is open) */
  disableKeyboard: () => void;
  /** Last key pressed (for visual feedback) */
  lastKey: string | null;
}

export function useKeyboardControls(config: KeyboardControlsConfig = {}): KeyboardControlsReturn {
  const {
    onPlayPause,
    onStemToggle,
    onJog,
    onRecordToggle,
    onDeckFocus,
    enabled = true,
    showFeedback = false,
  } = config;

  const [isEnabled, setIsEnabled] = useState(enabled);
  const [lastKey, setLastKey] = useState<string | null>(null);
  const lastKeyTimeoutRef = useRef<number | null>(null);

  /**
   * Check if the active element is a text input
   * (to prevent keyboard shortcuts from interfering with typing)
   */
  const isTextInput = useCallback((): boolean => {
    const activeElement = document.activeElement;
    if (!activeElement) return false;

    const tagName = activeElement.tagName.toLowerCase();
    const isInput = tagName === 'input' || tagName === 'textarea';
    const isContentEditable = activeElement.getAttribute('contenteditable') === 'true';

    return isInput || isContentEditable;
  }, []);

  /**
   * Show visual feedback for key press
   */
  const flashKey = useCallback((key: string) => {
    if (!showFeedback) return;

    setLastKey(key);

    // Clear previous timeout
    if (lastKeyTimeoutRef.current !== null) {
      clearTimeout(lastKeyTimeoutRef.current);
    }

    // Reset after 300ms
    lastKeyTimeoutRef.current = window.setTimeout(() => {
      setLastKey(null);
    }, 300);
  }, [showFeedback]);

  /**
   * Main keyboard event handler
   */
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't interfere with text inputs
      if (isTextInput()) return;

      // Don't trigger if controls are disabled
      if (!isEnabled) return;

      const key = event.key.toLowerCase();
      const isShift = event.shiftKey;
      const isCtrlOrCmd = event.ctrlKey || event.metaKey;

      // Spacebar: Play/Pause
      if (key === ' ') {
        event.preventDefault();
        onPlayPause?.();
        flashKey('Space');
        return;
      }

      // Numbers 1-4: Toggle Stems
      if (['1', '2', '3', '4'].includes(key)) {
        event.preventDefault();
        const stemIndex = parseInt(key, 10) - 1;
        onStemToggle?.(stemIndex);
        flashKey(key);
        return;
      }

      // Arrow Keys: Jog
      if (key === 'arrowright') {
        event.preventDefault();
        onJog?.('forward', isShift);
        flashKey('→');
        return;
      }

      if (key === 'arrowleft') {
        event.preventDefault();
        onJog?.('backward', isShift);
        flashKey('←');
        return;
      }

      // Q/W: Focus Deck A/B
      if (key === 'q') {
        event.preventDefault();
        onDeckFocus?.('A');
        flashKey('Q');
        return;
      }

      if (key === 'w') {
        event.preventDefault();
        onDeckFocus?.('B');
        flashKey('W');
        return;
      }

      // Cmd/Ctrl + R: Toggle Recording
      if (isCtrlOrCmd && key === 'r') {
        event.preventDefault();
        onRecordToggle?.();
        flashKey('Ctrl+R');
        return;
      }
    },
    [
      isEnabled,
      isTextInput,
      onPlayPause,
      onStemToggle,
      onJog,
      onDeckFocus,
      onRecordToggle,
      flashKey,
    ]
  );

  /**
   * Enable keyboard controls
   */
  const enableKeyboard = useCallback(() => {
    setIsEnabled(true);
    console.log('[KeyboardControls] Enabled');
  }, []);

  /**
   * Disable keyboard controls
   */
  const disableKeyboard = useCallback(() => {
    setIsEnabled(false);
    console.log('[KeyboardControls] Disabled');
  }, []);

  /**
   * Attach/detach keyboard listeners
   */
  useEffect(() => {
    if (!isEnabled) return;

    globalThis.addEventListener('keydown', handleKeyDown);

    return () => {
      globalThis.removeEventListener('keydown', handleKeyDown);

      // Clear timeout on unmount
      if (lastKeyTimeoutRef.current !== null) {
        clearTimeout(lastKeyTimeoutRef.current);
      }
    };
  }, [isEnabled, handleKeyDown]);

  return {
    isEnabled,
    enableKeyboard,
    disableKeyboard,
    lastKey,
  };
}

/**
 * Keyboard Controls Reference Guide
 *
 * Playback:
 * - Space: Play/Pause
 * - Q: Focus Deck A
 * - W: Focus Deck B
 *
 * Stems (Deck A/B):
 * - 1: Toggle Vocals
 * - 2: Toggle Drums
 * - 3: Toggle Bass
 * - 4: Toggle Other
 *
 * Jog Control:
 * - →: Jog forward (+1 beat)
 * - ←: Jog backward (-1 beat)
 * - Shift + →: Precision jog forward (+0.1s)
 * - Shift + ←: Precision jog backward (-0.1s)
 *
 * Recording:
 * - Cmd/Ctrl + R: Start/Stop recording
 */
