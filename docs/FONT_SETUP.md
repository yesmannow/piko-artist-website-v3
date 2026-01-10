# Font Setup Guide - Self-Hosted Fonts

## Overview

This project uses self-hosted fonts to eliminate build-time external dependencies. Fonts are stored in `public/fonts/` and loaded via `next/font/local`.

## Required Fonts

The following Google Fonts are used:

1. **Permanent Marker** (weight: 400) - Graffiti font for accents & logos
2. **Sedgwick Ave** (weight: 400) - Tag font for subtitles & artistic elements
3. **Anton** (weight: 400) - Header font (flyer style)
4. **Barlow Condensed** (weights: 400, 700) - Industrial font for lists, dates, tracks
5. **Inter** (weights: 400, 500, 600, 700, 800, 900) - Cinematic sans-serif for headlines
6. **Lexend** (weights: 400, 500, 600, 700, 800, 900) - Luxury sans-serif alternative

## Setup Methods

### Option 1: Automated Download Script (Recommended)

Run the download script:

```bash
npm run download:fonts
```

This script:
- Fetches font CSS from Google Fonts API
- Extracts WOFF2 URLs
- Downloads all required font files to `public/fonts/`
- Names files according to the expected format

### Option 2: Manual Download via Google Webfonts Helper

1. Visit [Google Webfonts Helper](https://gwfh.mranftl.com/fonts)
2. Search for each font family
3. Select the required weights
4. Download WOFF2 files only
5. Rename files to match expected format:
   - `permanent-marker-400.woff2`
   - `sedgwick-ave-400.woff2`
   - `anton-400.woff2`
   - `barlow-condensed-400.woff2`
   - `barlow-condensed-700.woff2`
   - `inter-400.woff2` through `inter-900.woff2`
   - `lexend-400.woff2` through `lexend-900.woff2`
6. Place all files in `public/fonts/`

### Option 3: Direct Google Fonts CDN URLs

You can manually download fonts from Google Fonts CDN:

1. Visit Google Fonts and select each font
2. Use browser DevTools to inspect network requests
3. Find the WOFF2 URLs in the CSS response
4. Download each file and place in `public/fonts/`

## File Naming Convention

Files must follow this pattern:
- `{family-name-lowercase-dashed}-{weight}.woff2`

Examples:
- `permanent-marker-400.woff2`
- `barlow-condensed-700.woff2`
- `inter-600.woff2`

## Verification

After downloading fonts, verify they exist:

```bash
ls public/fonts/
```

You should see all required font files listed above.

## Build Verification

The build will fail if fonts are missing. Ensure all fonts are downloaded before running:

```bash
npm run build
```

## Troubleshooting

### Build fails with "Cannot find module" or font loading errors

- Verify all font files exist in `public/fonts/`
- Check file names match exactly (case-sensitive)
- Ensure files are valid WOFF2 format
- Check file paths in `src/app/layout.tsx` are correct

### Fonts not displaying correctly

- Clear browser cache
- Verify font files are not corrupted
- Check browser console for loading errors
- Ensure CSS variables are correctly set in `tailwind.config.ts`

## Migration from Google Fonts

If you previously used `next/font/google`, the migration is complete when:

1. ✅ All font files are in `public/fonts/`
2. ✅ `src/app/layout.tsx` uses `next/font/local`
3. ✅ Build completes without external font requests
4. ✅ Fonts display correctly in the browser

## Benefits of Self-Hosting

- ✅ No build-time external dependencies
- ✅ Faster builds (no network requests)
- ✅ Better privacy (no requests to Google)
- ✅ Works offline
- ✅ Consistent font loading (no CDN variability)
