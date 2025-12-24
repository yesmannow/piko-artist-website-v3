import { useMemo } from "react";
import { Event } from "@/lib/events";
import * as THREE from "three";
import { toZonedTime } from "date-fns-tz";

/**
 * Calculates ambient light color and position based on event timezone
 * Returns day/night cycle simulation using actual timezone calculations
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

    try {
      // Get current time in the event's timezone
      const now = new Date();
      const zonedTime = toZonedTime(now, event.timezone);
      const hour = zonedTime.getHours();

      // Calculate time of day with smooth transitions
      // Dawn: 5-7, Day: 7-18, Dusk: 18-20, Night: 20-5
      let intensity: number;
      let color: THREE.Color;

      if (hour >= 7 && hour < 18) {
        // Daytime - bright warm light
        intensity = 0.7;
        color = new THREE.Color(1, 0.95, 0.9); // Warm daylight
      } else if (hour >= 5 && hour < 7) {
        // Dawn - transition from night to day
        const dawnProgress = (hour - 5) / 2; // 0 to 1
        intensity = 0.3 + dawnProgress * 0.4; // 0.3 to 0.7
        color = new THREE.Color(
          0.7 + dawnProgress * 0.3,
          0.8 + dawnProgress * 0.15,
          1 - dawnProgress * 0.1
        );
      } else if (hour >= 18 && hour < 20) {
        // Dusk - transition from day to night
        const duskProgress = (hour - 18) / 2; // 0 to 1
        intensity = 0.7 - duskProgress * 0.4; // 0.7 to 0.3
        color = new THREE.Color(
          1 - duskProgress * 0.3,
          0.95 - duskProgress * 0.15,
          0.9 + duskProgress * 0.1
        );
      } else {
        // Nighttime - dim cool light
        intensity = 0.3;
        color = new THREE.Color(0.7, 0.8, 1); // Cool moonlight
      }

      // Light position based on time of day (simplified sun position)
      const position = hour >= 6 && hour < 20
        ? new THREE.Vector3(10, 10, 10) // Day position
        : new THREE.Vector3(-5, 5, -5); // Night position

      return { intensity, color, position };
    } catch (error) {
      // Fallback if timezone is invalid
      console.warn(`Invalid timezone: ${event.timezone}`, error);
      return {
        intensity: 0.5,
        color: new THREE.Color(1, 1, 1),
        position: new THREE.Vector3(0, 0, 0),
      };
    }
  }, [event]);
}

