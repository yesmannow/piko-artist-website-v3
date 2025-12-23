// @ts-ignore - tailwindcss types are available but may not resolve with bundler moduleResolution
import type { Config } from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';

const config: Config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        // Graffiti fonts (Keep for accents only)
        graffiti: ["var(--font-permanent-marker)", "cursive"],
        tag: ["var(--font-sedgwick-ave)", "cursive"],
        // NEW: "Flyer" style for big headers (Replaces Impact)
        header: ["var(--font-anton)", "sans-serif"],
        // NEW: "Industrial" style for lists, tracks, and dates
        industrial: ["var(--font-barlow)", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // The New "Street" Palette - Using HSL values from CSS variables
        "spray-magenta": "hsl(var(--spray-magenta))",
        "toxic-lime": "hsl(var(--toxic-lime))",
        "safety-orange": "hsl(var(--safety-orange))",
        "concrete": "#2a2a2a",
        "tape-gray": "#888888",
        // Legacy neon colors (kept for backward compatibility, mapped to new palette)
        neon: {
          pink: "hsl(var(--spray-magenta))",
          green: "hsl(var(--toxic-lime))",
        },
        "neon-pink": "hsl(var(--spray-magenta))",
        "neon-green": "hsl(var(--toxic-lime))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        hard: "4px 4px 0px 0px rgba(0,0,0,1)",
      },
      backgroundImage: {
        noise: "url('/textures/noise.png')",
        "concrete-wall": "url('/images/bg/concrete-dark.jpg')",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;