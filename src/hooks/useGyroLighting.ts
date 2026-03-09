"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface GyroData {
  x: number; // Normalized tilt (-1 to 1) for X axis
  y: number; // Normalized tilt (-1 to 1) for Y axis
  isAvailable: boolean;
  requestAccess: () => Promise<boolean>;
}

/**
 * useGyroLighting - Expert-level gyro-lighting hook
 *
 * Abstracts complex iOS permission handling and maps device tilt to normalized
 * coordinate system (-1 to 1) specifically tuned for 3D lighting scenes.
 *
 * Uses refs to avoid 60fps re-renders and smooth interpolation for natural movement.
 *
 * @param intensity - Multiplier for gyro sensitivity (default: 1.0)
 * @returns GyroData with normalized x/y values and permission controls
 */
export function useGyroLighting(intensity: number = 1.0): GyroData {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);

  // Use Refs for values to avoid re-rendering the React tree 60fps
  // These are read directly by the useFrame loop in Three.js
  const targetX = useRef(0);
  const targetY = useRef(0);

  // Exposed state for the UI (throttled updates could be added here if needed)
  const [values, setValues] = useState({ x: 0, y: 0 });

  const handleOrientation = useCallback(
    (event: DeviceOrientationEvent) => {
      // Beta: Front-to-back tilt [-180, 180]
      // Gamma: Left-to-right tilt [-90, 90]
      const beta = event.beta || 0;
      const gamma = event.gamma || 0;

      // Normalize and clamp to avoid extreme lighting angles
      // We dampen the values to simulate weight
      const normX = Math.min(Math.max(gamma / 45, -1), 1) * intensity;
      const normY = Math.min(Math.max(beta / 45, -1), 1) * intensity;

      targetX.current = normX;
      targetY.current = normY;

      // Optional: Update state for UI debugging (remove for pure performance)
      // setValues({ x: normX, y: normY });
    },
    [intensity]
  );

  const requestAccess = async () => {
    if (typeof (DeviceOrientationEvent as any).requestPermission === "function") {
      try {
        const permission = await (DeviceOrientationEvent as any).requestPermission();
        if (permission === "granted") {
          setPermissionGranted(true);
          return true;
        }
      } catch (e) {
        console.error("Gyro permission denied", e);
      }
      return false;
    } else {
      // Non-iOS 13+ devices
      setPermissionGranted(true);
      return true;
    }
  };

  useEffect(() => {
    if (permissionGranted) {
      window.addEventListener("deviceorientation", handleOrientation);
      setIsAvailable(true);
    }
    return () => {
      window.removeEventListener("deviceorientation", handleOrientation);
    };
  }, [permissionGranted, handleOrientation]);

  // Hook into the animation frame to interpolate values smoothly
  // This essentially creates a "spring" physics effect for the light
  useEffect(() => {
    let frameId: number;
    const smoothFactor = 0.1; // Lower = heavier/slower movement

    const loop = () => {
      setValues((prev) => ({
        x: prev.x + (targetX.current - prev.x) * smoothFactor,
        y: prev.y + (targetY.current - prev.y) * smoothFactor,
      }));
      frameId = requestAnimationFrame(loop);
    };

    if (permissionGranted) {
      loop();
    }

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [permissionGranted]);

  return {
    x: values.x,
    y: values.y,
    isAvailable,
    requestAccess,
  };
}

