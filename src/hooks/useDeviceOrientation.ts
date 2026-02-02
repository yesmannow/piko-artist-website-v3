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
    if (typeof globalThis === 'undefined') return;

    const nav = (globalThis as unknown as { navigator?: Navigator }).navigator;
    const isIOS = nav ? /iPad|iPhone|iPod/.test(nav.userAgent) : false;
  const isSupported = (globalThis as unknown as any).DeviceOrientationEvent !== undefined || (isIOS && (globalThis as unknown as any).DeviceOrientationEvent !== undefined);

    setIsSupported(isSupported);

    if (!isSupported) return;

    const handleOrientation = (event: DeviceOrientationEvent) => {
      // iOS uses different property names
  const alpha = event.alpha ?? ((event as unknown as { webkitCompassHeading?: number }).webkitCompassHeading ?? null);
      const beta = event.beta ?? null;
      const gamma = event.gamma ?? null;

      setOrientation({ alpha, beta, gamma });

      // Normalize gamma (left/right tilt) and beta (forward/back tilt) to -1 to 1 range
      // Gamma: -90 to 90 -> -1 to 1
      // Beta: -180 to 180 -> -1 to 1 (clamped to reasonable range)
  const normalizedX = gamma === null ? 0 : Math.max(-1, Math.min(1, gamma / 90));
  const normalizedY = beta === null ? 0 : Math.max(-1, Math.min(1, (beta - 90) / 90));

      setNormalized({ x: normalizedX, y: normalizedY });
    };

    // Request permission on iOS 13+
      if (isIOS && typeof (DeviceOrientationEvent as unknown as any).requestPermission === 'function') {
      (DeviceOrientationEvent as unknown as any)
        .requestPermission()
        .then((response: string) => {
          if (response === 'granted') {
            (globalThis as unknown as Window).addEventListener('deviceorientation', handleOrientation);
          }
        })
        .catch(() => {
          // Permission denied or error
        });
    } else {
      (globalThis as unknown as Window).addEventListener('deviceorientation', handleOrientation);
    }

    return () => {
      (globalThis as unknown as Window).removeEventListener('deviceorientation', handleOrientation);
    };
  }, []);

  return { normalized, isSupported, raw: orientation };
}

