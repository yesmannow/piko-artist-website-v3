# Studio DJ Environment Variables

This document lists all environment variables required for the Studio DJ mixer to function properly.

## Required Variables

### Cloudflare R2 (Audio Storage)

These variables are required for loading tracks from R2 storage:

- `R2_ACCOUNT_ID` - Your Cloudflare account ID (found in R2 dashboard)
- `R2_ACCESS_KEY_ID` - R2 API token access key ID
- `R2_SECRET_ACCESS_KEY` - R2 API token secret access key
- `R2_BUCKET_NAME` - Name of your R2 bucket (default: `piko-media`)

**Note**: These are loaded lazily at runtime. The build will succeed without them, but track loading will fail if they're missing.

### Optional Variables

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL (if using Supabase features)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key (if using Supabase features)

## Local Development

For local development, create a `.env.local` file in the project root:

```bash
# Cloudflare R2 Configuration
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=piko-media
```

## Vercel Deployment

Set these variables in Vercel Dashboard → Project Settings → Environment Variables:

1. Add variables for **Production**, **Preview**, and **Development** environments
2. Ensure all R2 variables are set before deploying
3. The build will succeed without them, but runtime track loading requires them

## Safe Fallbacks

The application is designed to handle missing environment variables gracefully:

- **Build Time**: R2 client initialization is lazy, so builds won't fail
- **Runtime**: Track loading will show errors in console if R2 vars are missing
- **UI**: Library will display tracks but loading will fail with user-friendly error messages

## Testing Without R2

To test the UI without R2:

1. The studio interface will render normally
2. Track library will show tracks from `piko-tracks.json`
3. Clicking "LOAD" will fail silently (check console for errors)
4. All other features (FX, mixer, timeline) will work with mock data
