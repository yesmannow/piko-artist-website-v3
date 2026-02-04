import { useState, useEffect, useRef } from 'react';

/**
 * Phase 5: Mobile Landscape Detection Hook
 *
 * Detects mobile landscape orientation for adaptive layouts.
 * - Debounces to avoid keyboard popup flicker
 * - Ignores changes while inputs are focused
 * - Uses matchMedia for accurate orientation detection
 */

interface UseMobileLandscapeResult {
  isMobile: boolean;
  isLandscape: boolean;
  isMobileLandscape: boolean;
}

export function useMobileLandscape(debounceMs: number = 300): UseMobileLandscapeResult {
  const [state, setState] = useState<UseMobileLandscapeResult>({
    isMobile: false,
    isLandscape: false,
    isMobileLandscape: false,
  });

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (globalThis.window === undefined) return;

    const checkLayout = () => {
      // Check if input/textarea/select/contentEditable is focused
      const activeEl = document.activeElement as HTMLElement | null;
      const isInputFocused = activeEl && (
        activeEl.tagName === 'INPUT' ||
        activeEl.tagName === 'TEXTAREA' ||
        activeEl.tagName === 'SELECT' ||
        activeEl.isContentEditable
      );

      // Skip update if input is focused (prevents keyboard popup causing layout shift)
      if (isInputFocused) return;

      const width = globalThis.window.innerWidth;
      const height = globalThis.window.innerHeight;
      const isMobile = width < 768;
      const isLandscape = width > height;
      const isMobileLandscape = isMobile && isLandscape;

      setState({ isMobile, isLandscape, isMobileLandscape });
    };

    const debouncedCheck = () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(checkLayout, debounceMs);
    };

    // Initial check
    checkLayout();

    // Listen for resize and orientation changes
    globalThis.window.addEventListener('resize', debouncedCheck);
    globalThis.window.addEventListener('orientationchange', debouncedCheck);

    // Listen for focus/blur to allow updates when inputs lose focus
    globalThis.window.addEventListener('focus', checkLayout, true);
    globalThis.window.addEventListener('blur', checkLayout, true);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      globalThis.window.removeEventListener('resize', debouncedCheck);
      globalThis.window.removeEventListener('orientationchange', debouncedCheck);
      globalThis.window.removeEventListener('focus', checkLayout, true);
      globalThis.window.removeEventListener('blur', checkLayout, true);
    };
  }, [debounceMs]);

  return state;
}
