import { useState, useEffect, RefObject } from "react";

interface ParallaxOptions {
  intensity?: number;
  tiltIntensity?: number;
}

/**
 * Hook for mouse parallax effect on elements
 * Returns transform values for floating/tilting effect
 */
export function useMouseParallax<T extends HTMLElement = HTMLDivElement>(
  ref: RefObject<T | null>,
  options: ParallaxOptions = {}
): { x: number; y: number; rotateX: number; rotateY: number } {
  const { intensity = 0.05, tiltIntensity = 5 } = options;
  const [transform, setTransform] = useState({ x: 0, y: 0, rotateX: 0, rotateY: 0 });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = (e.clientX - centerX) * intensity;
      const deltaY = (e.clientY - centerY) * intensity;

      // Calculate rotation based on distance from center
      const rotateY = ((e.clientX - centerX) / rect.width) * tiltIntensity;
      const rotateX = -((e.clientY - centerY) / rect.height) * tiltIntensity;

      setTransform({
        x: deltaX,
        y: deltaY,
        rotateX,
        rotateY,
      });
    };

    const handleMouseLeave = () => {
      // Smooth return to center
      setTransform({ x: 0, y: 0, rotateX: 0, rotateY: 0 });
    };

    element.addEventListener("mousemove", handleMouseMove);
    element.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      element.removeEventListener("mousemove", handleMouseMove);
      element.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [ref, intensity, tiltIntensity]);

  return transform;
}

