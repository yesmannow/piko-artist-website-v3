import * as THREE from "three";
import * as React from "react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      holographicMaterial: {
        uTime?: number;
        uColor?: THREE.Color | string;
        uAudio?: number;
        uBrushedMetalFreq?: number;
        uFresnelPower?: number;
        uImpactFlash?: number;
        transparent?: boolean;
        depthWrite?: boolean;
        side?: number;
        metalness?: number;
        roughness?: number;
        ref?: React.Ref<THREE.ShaderMaterial>;
      };
    }
  }
}
