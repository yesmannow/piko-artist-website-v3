# Build Notes

## Vercel-Only Build Configuration

This project is configured exclusively for **Vercel deployment**. All Cloudflare/OpenNext configurations have been removed.

### Key Configuration Details

- **Deployment Platform**: Vercel only
- **Next.js Version**: Pinned to `15.1.0` (exact version, no caret)
- **Node Version**: `>=20 <21` (as specified in `package.json` engines)

### Build Scripts

The project uses only the standard Next.js scripts:
- `dev` - Development server with Turbopack
- `build` - Production build
- `start` - Production server
- `lint` - ESLint checking

**No Cloudflare/OpenNext scripts** (`cf:build`, `pages:build`, `verify:output`) are present.

### Vercel Project Settings

When configuring this project in Vercel:

1. **Node Version**: Set to `20.x` to match `package.json` engines
2. **Build Command**: `npm run build` (default)
3. **Output Directory**: `.next` (default)
4. **Include files outside root directory in the Build Step**: Should be **OFF** to avoid picking up stray lockfiles from parent directories

### Workspace Root

The `next.config.mjs` includes `outputFileTracingRoot` to ensure Next.js uses the correct repository root for file tracing, preventing issues with multiple lockfiles in parent directories.

### Dependencies

- No `@opennextjs/cloudflare` or `@cloudflare/next-on-pages` dependencies
- All dependencies are Vercel-compatible
- Next.js is pinned to prevent automatic upgrades

### TypeScript Configuration

- All TypeScript errors are resolved
- AudioReactiveVisualizer uses proper `GradientOptions` typing from `audiomotion-analyzer`

