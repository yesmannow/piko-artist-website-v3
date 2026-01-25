// Liquid Obsidian Fragment Shader
// Phase II: Core Architecture
// 
// This shader creates the "Liquid Obsidian" visual effect
// that pulses and morphs in sync with the audio

precision highp float;

uniform float uTime;
uniform float uAudioEnergy;
uniform vec3 uPrimaryColor;
uniform vec3 uSecondaryColor;
uniform float uDistortAmount;

varying vec2 vUv;

// Simplex noise function (simplified)
float noise(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec2 uv = vUv;
  
  // Create liquid distortion based on audio energy
  float distort = sin(uv.x * 10.0 + uTime) * cos(uv.y * 10.0 + uTime) * uDistortAmount;
  uv += distort * uAudioEnergy * 0.1;
  
  // Pulsing gradient based on audio
  float pulse = sin(uTime * 2.0 + uv.x) * 0.5 + 0.5;
  vec3 color = mix(uPrimaryColor, uSecondaryColor, pulse * uAudioEnergy);
  
  // Add noise for texture
  float n = noise(uv * 20.0 + uTime * 0.1);
  color += n * 0.1;
  
  gl_FragColor = vec4(color, 1.0);
}
