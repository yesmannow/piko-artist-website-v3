"use client";

import { useState, useEffect } from "react";

interface DeviceOrientation {
  alpha: number | null; // Z-axis rotation (0-360)
  beta: number | null; // X-axis rotation (-180 to 180)
  gamma: number | null; // Y-axis rotation (-90 to 90)
}

/**
 * Hook for accessing device orientation (gyroscope) data
 * Maps device tilt to normalized values for 3D lighting
 *
 * @returns Normalized orientation values: { x: -1 to 1, y: -1 to 1 }
 */
export function useDeviceOrientation() {
  const [orientation, setOrientation] = useState<DeviceOrientation>({
    alpha: null,
    beta: null,
    gamma: null,
  });
  const [normalized, setNormalized] = useState({ x: 0, y: 0 });
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if DeviceOrientationEvent is supported
    if (typeof window === "undefined") return;

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSupported =
      "DeviceOrientationEvent" in window ||
      (isIOS && "DeviceOrientationEvent" in window);

    setIsSupported(isSupported);

    if (!isSupported) return;

    const handleOrientation = (event: DeviceOrientationEvent) => {
      // iOS uses different property names
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const alpha = event.alpha ?? (event as any).webkitCompassHeading ?? null;
      const beta = event.beta ?? null;
      const gamma = event.gamma ?? null;

      setOrientation({ alpha, beta, gamma });

      // Normalize gamma (left/right tilt) and beta (forward/back tilt) to -1 to 1 range
      // Gamma: -90 to 90 -> -1 to 1
      // Beta: -180 to 180 -> -1 to 1 (clamped to reasonable range)
      const normalizedX = gamma !== null ? Math.max(-1, Math.min(1, gamma / 90)) : 0;
      const normalizedY = beta !== null ? Math.max(-1, Math.min(1, (beta - 90) / 90)) : 0;

      setNormalized({ x: normalizedX, y: normalizedY });
    };

    // Request permission on iOS 13+
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (isIOS && typeof (DeviceOrientationEvent as any).requestPermission === "function") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (DeviceOrientationEvent as any)
        .requestPermission()
        .then((response: string) => {
          if (response === "granted") {
            window.addEventListener("deviceorientation", handleOrientation);
          }
        })
        .catch(() => {
          // Permission denied or error
        });
    } else {
      window.addEventListener("deviceorientation", handleOrientation);
    }

    return () => {
      window.removeEventListener("deviceorientation", handleOrientation);
    };
  }, []);

  return { normalized, isSupported, raw: orientation };
}

