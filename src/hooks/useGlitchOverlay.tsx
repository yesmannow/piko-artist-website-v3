import { useMemo } from "react";

/**
 * Hook that returns scanline SVG element for VHS/CRT effects
 */
export function useGlitchOverlay() {
  const scanlineSVG = useMemo(
    () => (
      <svg
        className="absolute inset-0 pointer-events-none w-full h-full"
        style={{ mixBlendMode: "screen", opacity: 0.3 }}
      >
        <defs>
          <pattern id="scanlines" x="0" y="0" width="100%" height="4" patternUnits="userSpaceOnUse">
            <rect x="0" y="0" width="100%" height="2" fill="rgba(0, 255, 0, 0.1)" />
            <rect x="0" y="2" width="100%" height="2" fill="transparent" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#scanlines)" />
      </svg>
    ),
    []
  );

  return scanlineSVG;
}

