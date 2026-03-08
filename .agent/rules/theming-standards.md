---
description: Piko Artist Studio UI and Theming Standards
---

# Theming Standards (2026 Intelligence UI)

- **Liquid Glass Aesthetic**: All UI panels and overlays must strictly adhere to the "Liquid Glass" design language. 
  - Required Tailwind modifiers: `bg-obsidian-900/80` (or similar opacity), `backdrop-blur-[20px]`, and `border border-white/10`. Flat opaque backgrounds are forbidden in the Studio viewer.
- **Strict Color Tokens**:
  - **Neon Blue (`#00f2ff`)**: Primary accent color, typically mapped to Deck A, active filters, and primary CTAs.
  - **Rose (`#f43f5e`)**: Secondary accent color, mapped to Deck B, destructive actions, or peak audio limits.
- **Typography**: Utilize the exact font variables defined in `layout.tsx` (e.g., `--font-inter` for technical metadata, `--font-barlow` for track rows, `--font-permanent-marker` for specific graffiti flair).
