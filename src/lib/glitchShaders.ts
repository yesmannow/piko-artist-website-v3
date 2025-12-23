/**
 * Optional fragment shaders for advanced glitch effects
 * Can be used with WebGL/Three.js for more complex visualizations
 */

export const glitchFragmentShader = `
  uniform float time;
  uniform float bass;
  uniform float mid;
  uniform vec2 resolution;

  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;

    // Horizontal tearing based on bass
    float tear = sin(uv.y * 10.0 + time * 2.0) * bass * 0.1;
    uv.x += tear;

    // Brightness jitter based on mid
    float jitter = random(uv + time) * mid * 0.1;

    // Scanline effect
    float scanline = sin(uv.y * resolution.y * 0.5) * 0.5 + 0.5;
    scanline = pow(scanline, 10.0);

    gl_FragColor = vec4(scanline + jitter, scanline + jitter, scanline + jitter, 1.0);
  }
`;

export const crtFragmentShader = `
  uniform float time;
  uniform float overall;
  uniform vec2 resolution;

  void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;

    // CRT curvature
    vec2 center = uv - 0.5;
    float dist = length(center);
    uv = center * (1.0 + dist * 0.1) + 0.5;

    // Scanline
    float scanline = sin(uv.y * resolution.y * 0.5) * 0.5 + 0.5;
    scanline = pow(scanline, 20.0);

    // Glow pulse based on audio
    float glow = sin(time * 2.0) * overall * 0.2 + 0.8;

    gl_FragColor = vec4(scanline * glow, scanline * glow, scanline * glow, 1.0);
  }
`;

