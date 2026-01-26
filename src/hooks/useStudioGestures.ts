"use client";

import { useEffect, useRef, RefObject } from "react";

interface UseStudioGesturesOptions {
  onSwipe?: (direction: "left" | "right" | "up" | "down") => void;
  onLongPress?: () => void;
  onPinch?: (scale: number) => void;
  threshold?: number; // Minimum distance for swipe (default: 50px)
  longPressDelay?: number; // Long press delay in ms (default: 500ms)
  elementRef?: RefObject<HTMLElement | null>; // Optional element to attach gestures to
}

/**
 * Hook for handling touch gestures on mobile devices
 * Supports swipe, long press, and pinch gestures
 * If elementRef is provided, gestures are scoped to that element; otherwise, uses window
 */
export function useStudioGestures({
  onSwipe,
  onLongPress,
  onPinch,
  threshold = 50,
  longPressDelay = 500,
  elementRef,
}: UseStudioGesturesOptions) {
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const initialDistanceRef = useRef<number | null>(null);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        touchStartRef.current = {
          x: touch.clientX,
          y: touch.clientY,
          time: Date.now(),
        };

        // Start long press timer
        if (onLongPress) {
          longPressTimerRef.current = setTimeout(() => {
            onLongPress();
            touchStartRef.current = null;
          }, longPressDelay);
        }
      } else if (e.touches.length === 2 && onPinch) {
        // Pinch gesture
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const distance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
        initialDistanceRef.current = distance;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      // Cancel long press if user moves
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }

      if (e.touches.length === 2 && onPinch && initialDistanceRef.current !== null) {
        // Update pinch scale
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const currentDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
        const scale = currentDistance / initialDistanceRef.current;
        onPinch(scale);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      // Cancel long press timer
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }

      if (touchStartRef.current && e.changedTouches.length === 1 && onSwipe) {
        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - touchStartRef.current.x;
        const deltaY = touch.clientY - touchStartRef.current.y;
        const deltaTime = Date.now() - touchStartRef.current.time;
        const distance = Math.hypot(deltaX, deltaY);

        // Only trigger swipe if distance exceeds threshold and time is reasonable
        if (distance > threshold && deltaTime < 500) {
          if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Horizontal swipe
            onSwipe(deltaX > 0 ? "right" : "left");
          } else {
            // Vertical swipe
            onSwipe(deltaY > 0 ? "down" : "up");
          }
        }
      }

      touchStartRef.current = null;
      initialDistanceRef.current = null;
    };

    const handleTouchCancel = () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      touchStartRef.current = null;
      initialDistanceRef.current = null;
    };

    // Attach to element or window for gesture handling
    const target = elementRef?.current || window;

    target.addEventListener("touchstart", handleTouchStart as EventListener, { passive: true });
    target.addEventListener("touchmove", handleTouchMove as EventListener, { passive: true });
    target.addEventListener("touchend", handleTouchEnd as EventListener, { passive: true });
    target.addEventListener("touchcancel", handleTouchCancel as EventListener, { passive: true });

    return () => {
      target.removeEventListener("touchstart", handleTouchStart as EventListener);
      target.removeEventListener("touchmove", handleTouchMove as EventListener);
      target.removeEventListener("touchend", handleTouchEnd as EventListener);
      target.removeEventListener("touchcancel", handleTouchCancel as EventListener);
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, [onSwipe, onLongPress, onPinch, threshold, longPressDelay, elementRef]);
}
