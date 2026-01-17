"use client";

import { useEffect, RefObject } from "react";
import * as THREE from "three";

/**
 * useSceneCleanup - Reusable hook for Three.js memory management
 *
 * Traverses a Three.js scene and disposes of all WebGL resources
 * (geometries, materials, textures) when a component unmounts.
 *
 * This prevents memory leaks in WebGL contexts, especially important
 * for mobile devices with limited memory.
 *
 * @param sceneRef - A ref to a THREE.Scene or THREE.Object3D
 *
 * @example
 * ```tsx
 * const sceneRef = useRef<THREE.Scene>(null);
 * useSceneCleanup(sceneRef);
 * ```
 */
export function useSceneCleanup(
  sceneRef: RefObject<THREE.Scene | THREE.Object3D | null>,
) {
  useEffect(() => {
    return () => {
      if (!sceneRef.current) return;

      const scene = sceneRef.current;

      // Traverse the scene graph and dispose of all resources
      scene.traverse((object) => {
        // Dispose geometries
        if (
          object instanceof THREE.Mesh ||
          object instanceof THREE.Line ||
          object instanceof THREE.Points
        ) {
          if (object.geometry) {
            object.geometry.dispose();
          }
        }

        // Dispose materials
        if (
          object instanceof THREE.Mesh ||
          object instanceof THREE.Line ||
          object instanceof THREE.Points
        ) {
          if (object.material) {
            // Handle both single materials and material arrays
            const materials = Array.isArray(object.material)
              ? object.material
              : [object.material];

            materials.forEach((material) => {
              if (material instanceof THREE.Material) {
                // Dispose textures
                Object.keys(material).forEach((key) => {
                  const value = (material as any)[key];
                  if (value && value instanceof THREE.Texture) {
                    value.dispose();
                  }
                });

                // Dispose material
                material.dispose();
              }
            });
          }
        }

        // Dispose render targets (for post-processing)
        if (object instanceof THREE.Mesh && (object as any).renderTarget) {
          const renderTarget = (object as any).renderTarget;
          if (renderTarget instanceof THREE.WebGLRenderTarget) {
            renderTarget.dispose();
          }
        }
      });

      // Clear the scene
      if (scene instanceof THREE.Scene) {
        while (scene.children.length > 0) {
          scene.remove(scene.children[0]);
        }
      }
    };
  }, [sceneRef]);
}
