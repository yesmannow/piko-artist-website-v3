# Piko Artist Website v3

A modern artist portfolio website built with Next.js 15 and optimized for Vercel deployment.

## Features

- ⚡ Next.js 15 with App Router and TypeScript
- 🎨 TailwindCSS + shadcn/ui components
- 🎬 Framer Motion animations
- 🎵 Wavesurfer.js audio player
- 📺 YouTube video embeds
- ☁️ Vercel deployment ready
- 🧭 Modern navigation with smooth scrolling and scroll effects

## Tech Stack

- **Framework**: Next.js 15.5.9 (App Router)
- **Deployment**: Vercel
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
# Production build (includes worker compilation)
npm run build

# Compile workers separately
npm run build:workers

# Verify workers are compiled
npm run check:workers
```

**Note:** Workers are automatically compiled during `npm run build`. See [docs/WORKER_BUILD_PROCESS.md](docs/WORKER_BUILD_PROCESS.md) for details.

### Validation

```bash
# Check Node version
node -v  # Should be 20.x

# Run build
npm run build

# Type check
npx tsc --noEmit

# Lint
npm run lint
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
│   ├── Navbar.tsx        # Top navigation with scroll effects
│   ├── MobileNav.tsx     # Bottom mobile navigation
│   ├── Player.tsx        # Wavesurfer audio player
│   ├── VideoGallery.tsx  # YouTube video gallery (used on home page)
│   ├── SectionHeader.tsx # Reusable section header
│   └── ImageGallery.tsx  # Image gallery component
└── lib/
    └── utils.ts          # Utility functions
```

## Configuration Files

- `next.config.mjs` - Next.js configuration
- `tailwind.config.ts` - TailwindCSS configuration
- `postcss.config.mjs` - PostCSS configuration
- `components.json` - shadcn/ui configuration
- `tsconfig.json` - TypeScript configuration

## Environment Variables

For email functionality, configure these in Vercel Dashboard:

- `EMAIL_USER` - Gmail account email
- `EMAIL_PASS` - Gmail app-specific password (generate at https://myaccount.google.com/apppasswords)
- `RECIPIENT_EMAIL` - Optional, defaults to `Manospintadas420@gmail.com`

See `VERCEL_DEPLOYMENT_FINAL_AUDIT.md` for complete deployment instructions.

## Deployment

### Vercel Deployment

1. Push code to Git repository
2. Import project in Vercel Dashboard
3. Configure environment variables (see above)
4. Deploy automatically on push

**Build Command**: `npm run build`
**Node Version**: 20.x
**Output Directory**: `.next` (default)

## Scripts

- `dev` - Start development server with Turbopack
- `build` - Build production Next.js app (uses `scripts/build.js`)
- `start` - Start production server
- `lint` - Run ESLint
- `check:case` - Check import path case sensitivity

## License

MIT
