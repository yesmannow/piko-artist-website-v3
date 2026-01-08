# Vercel Deployment Checklist

## Pre-Deployment Verification ✅

### Build & Compilation
- [x] `npm run build` completes successfully
- [x] `npx tsc --noEmit` passes with no errors
- [x] All 8 routes generate successfully
- [x] No blocking TypeScript errors
- [x] No blocking ESLint errors

### Configuration
- [x] `package.json` has Node version: `>=20 <21`
- [x] `next.config.mjs` is valid
- [x] `tsconfig.json` is properly configured
- [x] `.vercelignore` excludes dev files

### Environment Variables
- [x] Variables documented in README.md
- [x] Required variables identified:
  - `EMAIL_USER` (required)
  - `EMAIL_PASS` (required)
  - `RECIPIENT_EMAIL` (optional)

---

## Deployment Steps

### 1. Prepare Repository
```bash
# Ensure all changes are committed
git status
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

### 2. Vercel Setup
1. Go to https://vercel.com/new
2. Import Git repository
3. Vercel auto-detects Next.js settings

### 3. Configure Environment Variables
In Vercel Dashboard → Settings → Environment Variables:

**Add these for Production, Preview, and Development:**

| Variable | Value | Notes |
|----------|-------|-------|
| `EMAIL_USER` | Your Gmail address | For sending emails |
| `EMAIL_PASS` | Gmail app password | Generate at https://myaccount.google.com/apppasswords |
| `RECIPIENT_EMAIL` | Recipient email | Optional, defaults to Manospintadas420@gmail.com |

### 4. Deploy
- Click "Deploy" button
- Wait for build to complete (~2-3 minutes)
- Verify deployment URL

---

## Post-Deployment Verification

### Functional Tests
- [ ] Homepage loads correctly
- [ ] Music page and audio player work
- [ ] Videos page loads
- [ ] Events page loads
- [ ] Studio page loads (largest bundle)
- [ ] Contact form submits successfully
- [ ] Booking form submits successfully
- [ ] PWA installs on mobile
- [ ] Navigation works (desktop & mobile)

### Performance Tests
- [ ] Run Lighthouse audit (aim for 90+ scores)
- [ ] Check Core Web Vitals
- [ ] Test on mobile devices
- [ ] Test on slow connection

### Cross-Browser Tests
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari (desktop)
- [ ] Safari (iOS)
- [ ] Chrome (Android)

---

## Quick Commands

```bash
# Local build test
npm run build

# Type check
npx tsc --noEmit

# Start production server locally
npm start

# Development server
npm run dev

# Lint check
npm run lint
```

---

## Troubleshooting

### Build Fails on Vercel
1. Check Vercel build logs for specific error
2. Verify environment variables are set
3. Ensure Node version matches (20.x)
4. Try building locally first

### Email Forms Don't Work
1. Verify `EMAIL_USER` and `EMAIL_PASS` are set in Vercel
2. Check Gmail app password is correct
3. Review Vercel Function Logs for errors

### Large Bundle Size Warning
- Studio page is 390 kB (acceptable for feature-rich page)
- Consider dynamic imports if needed

---

## Status: ✅ READY FOR DEPLOYMENT

All critical checks passed. Deploy with confidence!

**Last Audit**: January 8, 2026  
**Build Status**: SUCCESS  
**TypeScript**: PASS  
**Routes**: 8/8 GENERATED
