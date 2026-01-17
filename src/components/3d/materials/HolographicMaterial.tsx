"use client";

import * as THREE from 'three'

import { shaderMaterial } from '@react-three/drei'

import { extend } from '@react-three/fiber'



// This creates a declarative <holographicMaterial /> component

const HolographicMaterial = shaderMaterial(

  {

    uTime: 0,

    uColor: new THREE.Color('#E0E0E0'), // Industrial Chrome default

    uAudio: 0.0, // Audio reactivity (0.0 to 1.0)

    uBrushedMetalFreq: 150.0, // Higher frequency for sharper, more reflective grooves

    uFresnelPower: 3.0, // Higher power for more intense edge reflections

    uImpactFlash: 0.0, // Blinding flash intensity (0.0 to 1.0)

  },

  // Vertex Shader

  `

    varying vec3 vNormal;

    varying vec3 vPosition;

    varying vec2 vUv;

    varying vec3 vViewPosition;



    void main() {

      vNormal = normalize(normalMatrix * normal);

      vPosition = position;

      vUv = uv;



      // Calculate view position for Fresnel

      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

      vViewPosition = -mvPosition.xyz;



      gl_Position = projectionMatrix * mvPosition;

    }

  `,

  // Fragment Shader

  `

    uniform float uTime;

    uniform vec3 uColor;

    uniform float uAudio;

    uniform float uBrushedMetalFreq;

    uniform float uFresnelPower;

    uniform float uImpactFlash;



    varying vec3 vNormal;

    varying vec3 vPosition;

    varying vec3 vViewPosition;

    varying vec2 vUv;



    void main() {

      // 1. Fresnel Effect (Edge Glow)

      // Calculates how "perpendicular" the surface is to the camera

      vec3 viewDir = normalize(vViewPosition);

      vec3 normal = normalize(vNormal);

      float fresnel = pow(1.0 - abs(dot(normal, viewDir)), uFresnelPower);



      // 2. Chrome Plate - Sharp Reflective Grooves

      // Creates sharp circular groove pattern (milled aluminum platter)

      vec2 center = vec2(0.0, 0.0);

      float dist = length(vPosition.xy - center);

      // Sharp, high-frequency grooves for reflective surface

      float groove = sin(dist * uBrushedMetalFreq - uTime * 0.2);

      groove = abs(groove); // Sharp peaks for reflective highlights

      groove = pow(groove, 0.3) * 0.4; // Sharper, more defined grooves



      // Radial brushed metal texture (milling marks)

      float brushedMetal = sin(vPosition.y * uBrushedMetalFreq * 0.8 + vPosition.x * 50.0 - uTime * 0.3);

      brushedMetal = abs(brushedMetal);

      brushedMetal = pow(brushedMetal, 0.2) * 0.3; // Sharp, reflective milling marks



      // Combine groove and brushed metal for chrome plate texture

      float chromeTexture = groove + brushedMetal;



      // 3. Audio Reactivity (Pulse)

      float pulse = uAudio * 0.4;



      // 4. Impact Flash (Blinding Silver/White)

      vec3 flashColor = vec3(1.0, 1.0, 1.0); // Pure white flash

      float flashIntensity = uImpactFlash * 2.0; // Intense flash



      // 5. Combine Forces - High-Polish Chrome

      // Base chrome color with intense Fresnel reflections

      vec3 chromeBase = uColor * (1.0 + fresnel * 3.0); // High specular highlights

      // Add chrome texture (grooves catch light)

      chromeBase += chromeTexture * vec3(1.2, 1.2, 1.2); // Brighten grooves

      // Audio pulse adds subtle brightness

      chromeBase += pulse * vec3(0.3, 0.3, 0.3);

      // Impact flash (blinding white)

      vec3 finalColor = mix(chromeBase, flashColor, flashIntensity);



      // Calculate Alpha

      // Chrome plate is mostly opaque with subtle edge transparency

      float alpha = 0.95 + (fresnel * 0.05) + (chromeTexture * 0.1) + (pulse * 0.1) + (flashIntensity * 0.3);



      // Clamp alpha to avoid glitches

      alpha = clamp(alpha, 0.8, 1.0);



      gl_FragColor = vec4(finalColor, alpha);

    }

  `

)



// Extend R3F to recognize the new component

extend({ HolographicMaterial })



// TypeScript support is in src/types/holographic-material.d.ts



export { HolographicMaterial }

