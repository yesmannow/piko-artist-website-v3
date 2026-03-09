"use client";

import { useCallback, useRef } from 'react';

/**
 * Gesture Event Handlers
 */
export interface GestureCallbacks {
  onDrag?: (deltaX: number, deltaY: number, event: PointerEvent) => void;
  onDragStart?: (event: PointerEvent) => void;
  onDragEnd?: (event: PointerEvent) => void;
  onVelocity?: (velocityX: number, velocityY: number) => void; // For virtual inertia
}

/**
 * useGestures - Hook for Pointer Events-based gesture handling
 *
 * Provides unified mouse and touch input handling using Pointer Events API.
 * Supports drag tracking with setPointerCapture for accurate tracking even
 * when pointer leaves element bounds.
 *
 * Calculates velocity for virtual inertia effects.
 */
export function useGestures(callbacks: GestureCallbacks) {
  const isDraggingRef = useRef(false);
  const lastPositionRef = useRef({ x: 0, y: 0 });
  const lastTimeRef = useRef(0);
  const velocityRef = useRef({ x: 0, y: 0 });
  const pointerIdRef = useRef<number | null>(null);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isDraggingRef.current = true;
    lastPositionRef.current = { x: e.clientX, y: e.clientY };
    lastTimeRef.current = Date.now();
    velocityRef.current = { x: 0, y: 0 };
    pointerIdRef.current = e.pointerId;

    // Capture pointer to track even if it leaves element bounds
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    callbacks.onDragStart?.(e.nativeEvent);
  }, [callbacks]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingRef.current || pointerIdRef.current !== e.pointerId) {
      return;
    }

    const now = Date.now();
    const deltaTime = (now - lastTimeRef.current) / 1000; // Convert to seconds
    const deltaX = e.clientX - lastPositionRef.current.x;
    const deltaY = e.clientY - lastPositionRef.current.y;

    // Calculate velocity (pixels per second)
    if (deltaTime > 0) {
      velocityRef.current = {
        x: deltaX / deltaTime,
        y: deltaY / deltaTime,
      };
      callbacks.onVelocity?.(velocityRef.current.x, velocityRef.current.y);
    }

    // Update position
    lastPositionRef.current = { x: e.clientX, y: e.clientY };
    lastTimeRef.current = now;

    // Call drag callback
    callbacks.onDrag?.(deltaX, deltaY, e.nativeEvent);
  }, [callbacks]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDraggingRef.current || pointerIdRef.current !== e.pointerId) {
      return;
    }

    isDraggingRef.current = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    pointerIdRef.current = null;

    callbacks.onDragEnd?.(e.nativeEvent);
  }, [callbacks]);

  const handlePointerCancel = useCallback((e: React.PointerEvent) => {
    if (pointerIdRef.current === e.pointerId) {
      isDraggingRef.current = false;
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      pointerIdRef.current = null;
      callbacks.onDragEnd?.(e.nativeEvent);
    }
  }, [callbacks]);

  return {
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerUp,
    onPointerCancel: handlePointerCancel,
    getVelocity: () => velocityRef.current,
  };
}
