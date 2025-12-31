"use client";

import * as THREE from 'three'

import { shaderMaterial } from '@react-three/drei'

import { extend, ReactThreeFiber } from '@react-three/fiber'



// This creates a declarative <holographicMaterial /> component

const HolographicMaterial = shaderMaterial(

  {

    uTime: 0,

    uColor: new THREE.Color('#00ffff'), // Cyan default

    uAudio: 0.0, // Audio reactivity (0.0 to 1.0)

    uScanlineFreq: 50.0,

    uFresnelPower: 2.0,

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

    uniform float uScanlineFreq;

    uniform float uFresnelPower;



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



      // 2. Scanlines (Moving Horizontal Lines)

      // Uses Sine wave modulated by time

      float scanline = sin(vPosition.y * uScanlineFreq - uTime * 2.0);

      // Make scanlines thinner and sharper

      scanline = smoothstep(0.4, 0.6, scanline);



      // 3. Audio Reactivity (Pulse)

      // Modulates brightness based on audio input

      float pulse = uAudio * 0.5;



      // 4. Combine Forces

      // Base color + Fresnel edge + Pulse

      vec3 finalColor = uColor + (fresnel * 2.0) + (pulse * uColor);



      // Calculate Alpha

      // Center is transparent, edges are opaque, scanlines add visibility

      float alpha = fresnel + (scanline * 0.1) + (pulse * 0.2);



      // Clamp alpha to avoid glitches

      alpha = clamp(alpha, 0.0, 1.0);



      gl_FragColor = vec4(finalColor, alpha);

    }

  `

)



// Extend R3F to recognize the new component

extend({ HolographicMaterial })



// TypeScript support for the new element

declare global {

  namespace JSX {

    interface IntrinsicElements {

      holographicMaterial: ReactThreeFiber.Object3DNode<THREE.ShaderMaterial, typeof HolographicMaterial> & {

        uTime?: number

        uColor?: THREE.Color

        uAudio?: number

        uScanlineFreq?: number

        uFresnelPower?: number

      }

    }

  }

}



export { HolographicMaterial }

