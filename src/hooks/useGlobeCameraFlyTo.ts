import { useCallback } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";

/**
 * Converts lat/lng coordinates to 3D spherical coordinates
 */
export function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);

  return new THREE.Vector3(x, y, z);
}

/**
 * Hook for smooth camera fly-to animation on the globe
 * @param speed - Animation speed multiplier (default: 2)
 * @returns Function to trigger camera fly-to
 */
export function useGlobeCameraFlyTo(speed: number = 2) {
  const { camera } = useThree();

  const flyTo = useCallback(
    (lat: number, lng: number, distance: number = 2.5) => {
      const targetPos = latLngToVector3(lat, lng, distance);
      const lookAt = latLngToVector3(lat, lng, 1.01);

      // Use requestAnimationFrame for smooth animation
      let startTime: number | null = null;
      const duration = 1000; // 1 second animation
      const startPos = camera.position.clone();
      const startLookAt = new THREE.Vector3();
      camera.getWorldDirection(startLookAt);
      startLookAt.multiplyScalar(1).add(camera.position);

      const animate = (currentTime: number) => {
        if (!startTime) startTime = currentTime;
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function (ease-in-out)
        const eased = progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        // Interpolate camera position
        camera.position.lerpVectors(startPos, targetPos, eased);
        camera.lookAt(lookAt);

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    },
    [camera, speed]
  );

  return flyTo;
}

