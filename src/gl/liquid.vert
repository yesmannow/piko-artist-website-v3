// Liquid Obsidian Vertex Shader
// Phase II: Core Architecture

precision highp float;

uniform float uTime;
uniform float uAudioEnergy;

varying vec2 vUv;

void main() {
  vUv = uv;
  
  // Pass through position with subtle wave deformation
  vec3 pos = position;
  pos.z += sin(position.x * 2.0 + uTime) * uAudioEnergy * 0.1;
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
