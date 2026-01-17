import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
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
        // Urban Syndicate Palette - Street-Elite Professional
        "midnight-black": "#050505",
        midnight: "#050505",
        "industrial-chrome": "#E0E0E0",
        chrome: "#E0E0E0",
        "safety-yellow": "#FFD700",
        // Legacy colors (backward compatibility - all map to Safety Yellow)
        "toxic-lime": "#ccff00", // Brand color: Toxic Lime
        "brushed-gold": "#FFD700", // Map to Safety Yellow
        "deep-onyx": "#050505",
        "charcoal-slate": "#1a1a1a",
        concrete: "#2a2a2a",
        "tape-gray": "#888888",
        "spray-magenta": "hsl(var(--spray-magenta))",
        "safety-orange": "hsl(var(--safety-orange))",
        neon: {
          pink: "hsl(var(--spray-magenta))",
          green: "#FFD700",
        },
        "neon-pink": "hsl(var(--spray-magenta))",
        "neon-green": "#FFD700",
      },
      borderRadius: {
        lg: "0px", // Brutalist: sharp corners
        md: "0px",
        sm: "0px",
        none: "0px",
      },
      skew: {
        urban: "-12deg", // Urban Syndicate skew angle
      },
      boxShadow: {
        hard: "4px 4px 0px 0px rgba(0,0,0,1)",
      },
      zIndex: {
        base: "0",
        nav: "50",
        player: "80",
        "player-overlay": "100",
        overlay: "200",
        modal: "300",
        toast: "400",
      },
      backgroundImage: {
        // Removed unused background images - using inline SVG patterns instead
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
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-100%)" },
        },
        glitch: {
          "0%, 100%": { transform: "translate(0)" },
          "20%": { transform: "translate(-2px, 2px)" },
          "40%": { transform: "translate(-2px, -2px)" },
          "60%": { transform: "translate(2px, 2px)" },
          "80%": { transform: "translate(2px, -2px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        marquee: "marquee 20s linear infinite",
        glitch: "glitch 0.3s ease-in-out",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
