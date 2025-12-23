import { useMemo } from "react";
import { Event } from "@/lib/events";
import * as THREE from "three";

/**
 * Calculates ambient light color and position based on event timezone
 * Returns simplified day/night cycle simulation
 */
export function useEventTimezoneAmbientLight(event: Event | null) {
  return useMemo(() => {
    if (!event?.timezone) {
      return {
        intensity: 0.5,
        color: new THREE.Color(1, 1, 1),
        position: new THREE.Vector3(0, 0, 0),
      };
    }

    // Simplified day/night calculation based on current hour in timezone
    // In production, you'd use Luxon to get actual time in that timezone
    const now = new Date();
    const hour = now.getHours();

    // Simulate day (6-20) vs night (20-6)
    const isDay = hour >= 6 && hour < 20;
    const intensity = isDay ? 0.6 : 0.3;

    // Adjust color temperature: warmer during day, cooler at night
    const color = isDay
      ? new THREE.Color(1, 0.95, 0.9) // Warm daylight
      : new THREE.Color(0.7, 0.8, 1); // Cool moonlight

    // Light position based on timezone (simplified - would use actual sun position)
    const position = isDay
      ? new THREE.Vector3(10, 10, 10)
      : new THREE.Vector3(-5, 5, -5);

    return { intensity, color, position };
  }, [event]);
}

