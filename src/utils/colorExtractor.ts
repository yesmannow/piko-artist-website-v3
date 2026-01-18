/**
 * Extract dominant colors from an image
 * Returns RGB values for theming deck columns
 */

export interface DominantColors {
  primary: string; // Main color (RGB format)
  secondary: string; // Secondary color
  accent: string; // Accent color for highlights
  isDark: boolean; // Whether the primary color is dark
}

/**
 * Convert RGB to HSL for better color manipulation
 */
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return [h * 360, s * 100, l * 100];
}

/**
 * Check if a color is dark
 */
function isColorDark(r: number, g: number, b: number): boolean {
  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5;
}

/**
 * Extract dominant colors from an image URL
 */
export async function extractDominantColors(
  imageUrl: string,
): Promise<DominantColors> {
  return new Promise((resolve, reject) => {
    // Handle gradient fallbacks
    if (!imageUrl.startsWith("/") && !imageUrl.startsWith("http")) {
      // It's a gradient string like "from-purple-500 to-pink-500"
      const gradientColors = parseGradientString(imageUrl);
      resolve(gradientColors);
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        // Scale down for performance
        const size = 100;
        canvas.width = size;
        canvas.height = size;

        ctx.drawImage(img, 0, 0, size, size);
        const imageData = ctx.getImageData(0, 0, size, size);
        const pixels = imageData.data;

        // Color quantization - find dominant colors
        const colorMap = new Map<string, number>();

        for (let i = 0; i < pixels.length; i += 4) {
          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];
          const a = pixels[i + 3];

          // Skip transparent pixels
          if (a < 128) continue;

          // Quantize to reduce color space (group similar colors)
          const qR = Math.floor(r / 32) * 32;
          const qG = Math.floor(g / 32) * 32;
          const qB = Math.floor(b / 32) * 32;

          const key = `${qR},${qG},${qB}`;
          colorMap.set(key, (colorMap.get(key) || 0) + 1);
        }

        // Sort by frequency
        const sortedColors = Array.from(colorMap.entries())
          .sort((a, b) => b[1] - a[1])
          .map(([color]) => color.split(",").map(Number));

        if (sortedColors.length === 0) {
          // Fallback to default colors
          resolve({
            primary: "rgb(0, 217, 255)",
            secondary: "rgb(0, 150, 200)",
            accent: "rgb(0, 255, 200)",
            isDark: false,
          });
          return;
        }

        // Get top 3 colors
        const [r1, g1, b1] = sortedColors[0] || [0, 217, 255];
        const [r2, g2, b2] = sortedColors[1] || [0, 150, 200];
        const [r3, g3, b3] = sortedColors[2] || [0, 255, 200];

        const primary = `rgb(${r1}, ${g1}, ${b1})`;
        const secondary = `rgb(${r2}, ${g2}, ${b2})`;
        const accent = `rgb(${r3}, ${g3}, ${b3})`;
        const isDark = isColorDark(r1, g1, b1);

        resolve({
          primary,
          secondary,
          accent,
          isDark,
        });
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      // Fallback to default colors on error
      resolve({
        primary: "rgb(0, 217, 255)",
        secondary: "rgb(0, 150, 200)",
        accent: "rgb(0, 255, 200)",
        isDark: false,
      });
    };

    img.src = imageUrl;
  });
}

/**
 * Parse Tailwind gradient string to RGB colors
 */
function parseGradientString(gradientStr: string): DominantColors {
  // Map of common Tailwind colors to RGB
  const colorMap: Record<string, [number, number, number]> = {
    "purple-500": [168, 85, 247],
    "pink-500": [236, 72, 153],
    "blue-500": [59, 130, 246],
    "cyan-500": [6, 182, 212],
    "green-500": [34, 197, 94],
    "yellow-500": [234, 179, 8],
    "red-500": [239, 68, 68],
    "orange-500": [249, 115, 22],
    "indigo-500": [99, 102, 241],
    "violet-500": [139, 92, 246],
  };

  // Extract color names from gradient string
  const matches = gradientStr.match(
    /(purple|pink|blue|cyan|green|yellow|red|orange|indigo|violet)-\d+/g,
  );

  if (matches && matches.length > 0) {
    const [r, g, b] = colorMap[matches[0]] || [0, 217, 255];
    const [r2, g2, b2] = colorMap[matches[1]] ||
      colorMap[matches[0]] || [0, 150, 200];

    return {
      primary: `rgb(${r}, ${g}, ${b})`,
      secondary: `rgb(${r2}, ${g2}, ${b2})`,
      accent: `rgb(${Math.min(255, r + 50)}, ${Math.min(255, g + 50)}, ${Math.min(255, b + 50)})`,
      isDark: isColorDark(r, g, b),
    };
  }

  // Default fallback
  return {
    primary: "rgb(0, 217, 255)",
    secondary: "rgb(0, 150, 200)",
    accent: "rgb(0, 255, 200)",
    isDark: false,
  };
}

/**
 * Generate a lighter/darker shade of a color
 */
export function adjustColorBrightness(rgb: string, percent: number): string {
  const match = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/.exec(rgb);
  if (!match) return rgb;

  let [, r, g, b] = match.map(Number);

  r = Math.min(255, Math.max(0, r + (r * percent) / 100));
  g = Math.min(255, Math.max(0, g + (g * percent) / 100));
  b = Math.min(255, Math.max(0, b + (b * percent) / 100));

  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}
