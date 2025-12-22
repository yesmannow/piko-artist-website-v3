# Piko Artist Website v3

A modern artist portfolio website built with Next.js 15 and optimized for Cloudflare Pages deployment.

## Features

- ⚡ Next.js 15 with App Router and TypeScript
- 🎨 TailwindCSS + shadcn/ui components
- 🎬 Framer Motion animations
- 🎵 Wavesurfer.js audio player with R2 storage
- 📺 YouTube video embeds
- ☁️ Cloudflare Pages deployment with R2 bindings

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Runtime**: @opennextjs/cloudflare
- **UI**: TailwindCSS, shadcn/ui, Framer Motion, Lenis
- **Audio**: wavesurfer.js
- **Node**: >=20 <21

## Getting Started

### Prerequisites

- Node.js 20.x (specified in `.node-version`)
- npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

### Build

```bash
# Standard Next.js build
npm run build

# Cloudflare Pages build
npm run cf:build
```

### Validation

```bash
# Check Node version
node -v  # Should be 20.x

# Run builds
npm run build
npm run cf:build
```

## Project Structure

```
src/
├── app/
│   ├── page.tsx          # Home page with hero
│   ├── music/            # Music page with audio player
│   ├── videos/           # Video gallery
│   ├── about/            # About page
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles
├── components/
│   ├── Player.tsx        # Wavesurfer audio player
│   ├── VideoGrid.tsx     # YouTube video grid
│   ├── SectionHeader.tsx # Reusable section header
│   └── ImageGallery.tsx  # Image gallery component
└── lib/
    └── utils.ts          # Utility functions
```

## Configuration Files

- `next.config.mjs` - Next.js configuration
- `open-next.config.ts` - OpenNext Cloudflare configuration
- `wrangler.jsonc` - Cloudflare Workers/Pages configuration
- `tailwind.config.ts` - TailwindCSS configuration
- `components.json` - shadcn/ui configuration
- `tsconfig.json` - TypeScript configuration

## Cloudflare R2 Setup

The site uses Cloudflare R2 for audio storage:

1. Create an R2 bucket named `piko-audio-assets`
2. Upload audio files to the bucket
3. Update the R2 binding in `wrangler.jsonc`

## Deployment

Deploy to Cloudflare Pages:

```bash
npm run cf:build
npx wrangler pages deploy .open-next/worker.js
```

## Scripts

- `dev` - Start development server with Turbopack
- `build` - Build production Next.js app
- `cf:build` - Build for Cloudflare Pages
- `verify:output` - Verify Cloudflare build output
- `start` - Start production server
- `lint` - Run ESLint

## License

MIT
