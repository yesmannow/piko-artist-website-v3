# Vercel Deployment Audit - December 2024

## Environment Versions

- **Node.js**: v20.18.1
- **npm**: 10.8.2
- **Next.js**: 15.5.9 (pinned, exact version)
- **eslint-config-next**: 15.5.9 (pinned, exact version)
- **tailwindcss**: 3.4.19
- **postcss**: 8.5.6
- **autoprefixer**: 10.4.23
- **tailwindcss-animate**: 1.0.7

## Issues Found and Fixed

### 1. "generate is not a function" Error (CRITICAL - Build Blocker)

**Problem**: Build was failing with `TypeError: generate is not a function` error, preventing any deployment.

**Root Cause**: Environment variables `__NEXT_PRIVATE_STANDALONE_CONFIG` and `NEXT_DEPLOYMENT_ID` were interfering with Next.js font generation and PostCSS processing.

**Solution**:
- Created `scripts/build.js` that unsets problematic environment variables before running the build
- Updated `package.json` build script to use the wrapper script
- Added `postcss.config.mjs` with proper ESM syntax

**Files Changed**:
- `package.json` - Updated build script
- `scripts/build.js` - New file to handle env var cleanup
- `postcss.config.mjs` - Created with proper ESM export

### 2. TypeScript Configuration

**Problem**: Missing `baseUrl` in `tsconfig.json` causing potential module resolution issues.

**Solution**: Added `"baseUrl": "."` to `tsconfig.json` compilerOptions.

**Files Changed**:
- `tsconfig.json` - Added baseUrl

### 3. TypeScript Type Error

**Problem**: `useFocusTrap` hook type mismatch - expected `RefObject<HTMLElement>` but received `RefObject<HTMLDivElement | null>`.

**Solution**: Updated hook signature to accept nullable refs: `RefObject<HTMLElement | null>`.

**Files Changed**:
- `src/hooks/useFocusTrap.ts` - Updated type signature

## Vercel-Safe Checklist

✅ **Next.js & ESLint Pinning**
- `next`: `15.5.9` (exact, no caret)
- `eslint-config-next`: `15.5.9` (exact, no caret)

✅ **Build-Time Dependencies**
- `tailwindcss`: In `dependencies` (not devDependencies)
- `postcss`: In `dependencies` (not devDependencies)
- `autoprefixer`: In `dependencies` (not devDependencies)
- `tailwindcss-animate`: In `dependencies` (not devDependencies)

✅ **Lockfile**
- `package-lock.json` present in repo root
- Only one lockfile (no yarn.lock or pnpm-lock.yaml)
- Lockfile is authoritative for npm installs

✅ **Next.js Configuration**
- `next.config.mjs` uses ESM syntax
- `outputFileTracingRoot` set to project root using `__dirname`
- Webpack alias `@` matches TypeScript path alias

✅ **TypeScript Configuration**
- `baseUrl`: `"."` (project root)
- `paths`: `{ "@/*": ["./src/*"] }`
- Matches webpack alias in `next.config.mjs`

✅ **PostCSS Configuration**
- `postcss.config.mjs` uses ESM syntax
- Plugins properly exported

✅ **Build Verification**
- `npm run build` - ✅ PASSES
- `npm run lint` - ✅ PASSES (warnings only, no errors)
- `npx tsc --noEmit` - ✅ PASSES

## Build Script

The build script (`scripts/build.js`) unsets problematic environment variables that can cause build failures:

```javascript
delete process.env.__NEXT_PRIVATE_STANDALONE_CONFIG;
delete process.env.NEXT_DEPLOYMENT_ID;
```

This ensures a clean build environment on both local and Vercel deployments.

## ESLint Warnings (Non-Blocking)

The following warnings exist but do not block deployment:
- `react-hooks/exhaustive-deps` warnings in:
  - `src/app/videos/page.tsx`
  - `src/components/DJInterface.tsx`
  - `src/context/VideoContext.tsx`

These are intentional dependency array omissions and are safe to ignore.

## Final Verification Commands

All commands pass successfully:

```bash
npm ci
npm run build
npm run lint
npx tsc --noEmit
```

## Notes

- The project uses `"type": "module"` in package.json, so all config files use ESM syntax
- `tailwind.config.ts` uses ESM export syntax
- All path aliases are consistent between TypeScript and Webpack
- Build script works on both Windows (local) and Linux (Vercel)

