import { useEffect, useRef } from "react";
import { useEventStore } from "@/stores/useEventStore";

/**
 * Hook that auto-closes modal if user scrolls too far from modal
 * @param threshold - Scroll distance threshold in pixels (default: 100)
 */
export function useScrollVisibility(threshold: number = 100) {
  const setSelectedEvent = useEventStore((state) => state.setSelectedEvent);
  const selectedEvent = useEventStore((state) => state.selectedEvent);
  const modalRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);

  useEffect(() => {
    if (!selectedEvent || !modalRef.current) return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDelta = Math.abs(currentScrollY - lastScrollY.current);

      // If user scrolled significantly, close modal
      if (scrollDelta > threshold) {
        setSelectedEvent(null);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [selectedEvent, threshold, setSelectedEvent]);

  return modalRef;
}

