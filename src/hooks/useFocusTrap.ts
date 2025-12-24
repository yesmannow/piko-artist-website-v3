import { useEffect, useRef } from "react";

/**
 * Hook for trapping focus within a container (e.g., modal, drawer)
 * @param isActive - Whether the focus trap should be active
 * @param containerRef - Ref to the container element
 */
export function useFocusTrap(isActive: boolean, containerRef: React.RefObject<HTMLElement | null>) {
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;

    // Store the previously focused element
    previousActiveElement.current = document.activeElement as HTMLElement;

    // Get all focusable elements within the container
    const getFocusableElements = (): HTMLElement[] => {
      const focusableSelectors = [
        'a[href]',
        'button:not([disabled])',
        'textarea:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
      ].join(', ');

      return Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors))
        .filter((el) => {
          // Filter out hidden elements
          const style = window.getComputedStyle(el);
          return style.display !== 'none' && style.visibility !== 'hidden';
        });
    };

    const focusableElements = getFocusableElements();

    if (focusableElements.length === 0) return;

    // Focus the first element
    focusableElements[0]?.focus();

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);

      if (e.shiftKey) {
        // Shift + Tab: move backwards
        if (currentIndex === 0) {
          e.preventDefault();
          focusableElements[focusableElements.length - 1]?.focus();
        }
      } else {
        // Tab: move forwards
        if (currentIndex === focusableElements.length - 1) {
          e.preventDefault();
          focusableElements[0]?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);

    return () => {
      container.removeEventListener('keydown', handleTabKey);
      // Restore focus to previous element when trap is deactivated
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [isActive, containerRef]);
}

