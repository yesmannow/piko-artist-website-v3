# Deployment Guide - Piko Studio V2

## Phase 11: Deployment Prep & Asset Generation - COMPLETE ✅

### Pre-Deployment Checklist

#### ✅ Task 1: Dependencies Installed

```bash
npm install idb-keyval
```

**Status:** Complete - Package installed successfully

#### ✅ Task 2: TypeScript Build Error Fixed

**Issue:** `Type 'Uint8Array<ArrayBuffer> | null' must have a '[Symbol.iterator]()' method`

**Fix Applied:** `src/engine/MIDIManager.ts`

```typescript
// Before (destructuring failed)
const [status, data1, data2] = event.data;

// After (array access with null check)
if (!event.data || event.data.length < 3) return;
const status = event.data[0];
const data1 = event.data[1];
const data2 = event.data[2];
```

#### ✅ Task 3: PWA Icons

**Status:** Icon exists at `public/icon.png`
**Manifest:** Correctly configured for 192x192 and 512x512 sizes

#### ✅ Task 4: Vercel Configuration

**File Created:** `vercel.json`

**Security Headers:**

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`

**Service Worker Headers:**

- `Cache-Control: public, max-age=0, must-revalidate`
- `Service-Worker-Allowed: /`

**WASM/Worker Headers:**

- `Cross-Origin-Embedder-Policy: require-corp`
- `Cross-Origin-Opener-Policy: same-origin`

**URL Rewrites:**

- `/studio` → `/studio-v2` (convenience redirect)

---

## Deployment Steps

### Option 1: Vercel CLI (Recommended)

1. **Install Vercel CLI**

   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**

   ```bash
   vercel login
   ```

3. **Deploy to Production**

   ```bash
   vercel --prod
   ```

4. **Follow Prompts**
   - Set up and deploy: Yes
   - Which scope: [Your account]
   - Link to existing project: No
   - Project name: piko-artist-website-v3
   - Directory: ./
   - Override settings: No

### Option 2: Vercel Dashboard

1. **Push to GitHub**

   ```bash
   git add .
   git commit -m "Production ready - Phase 11 complete"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to https://vercel.com/new
   - Import your GitHub repository
   - Configure project:
     - Framework Preset: Next.js
     - Root Directory: ./
     - Build Command: `npm run build`
     - Output Directory: .next
     - Install Command: `npm install`

3. **Environment Variables**
   - Add any required environment variables
   - Example: `NODE_ENV=production`

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete

---

## Build Verification

### Run Production Build Locally

```bash
npm run build
```

**Expected Output:**

```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages
✓ Finalizing page optimization
```

**Build Artifacts:**

- `.next/` directory created
- Static pages generated
- Service worker compiled
- Optimized bundles created

### Test Production Build

```bash
npm run start
```

Then visit: http://localhost:3000/studio-v2

---

## Post-Deployment Verification

### Critical Tests

1. **PWA Installation**
   - [ ] Visit site on mobile
   - [ ] See "Install App" prompt
   - [ ] Install to home screen
   - [ ] Launch from home screen
   - [ ] Verify standalone mode (no URL bar)

2. **Audio Engine**
   - [ ] Click "START SESSION"
   - [ ] AudioEngine initializes
   - [ ] No console errors
   - [ ] Audio context active

3. **Track Loading**
   - [ ] Load track from library
   - [ ] Waveform generates
   - [ ] BPM detected
   - [ ] Beatgrid displays

4. **Playback**
   - [ ] Play/pause works
   - [ ] Volume control works
   - [ ] No audio glitches
   - [ ] Sync works

5. **MIDI (if available)**
   - [ ] MIDI device detected
   - [ ] Mappings work
   - [ ] Learn mode works
   - [ ] Mappings persist

6. **Settings**
   - [ ] Settings modal opens
   - [ ] All tabs work
   - [ ] Settings persist

7. **Error Handling**
   - [ ] Error boundary works
   - [ ] Reload button works
   - [ ] Graceful degradation

### Performance Checks

1. **Lighthouse Audit**
   - Performance: Target 90+
   - Accessibility: Target 95+
   - Best Practices: Target 95+
   - SEO: Target 90+
   - PWA: Target 100

2. **Core Web Vitals**
   - LCP (Largest Contentful Paint): < 2.5s
   - FID (First Input Delay): < 100ms
   - CLS (Cumulative Layout Shift): < 0.1

3. **Bundle Size**
   - First Load JS: Target < 200KB
   - Route-specific: Target < 100KB per route

---

## Domain Configuration

### Custom Domain Setup

1. **Add Domain in Vercel**
   - Go to Project Settings → Domains
   - Add your custom domain
   - Follow DNS configuration instructions

2. **DNS Records**

   ```
   Type: A
   Name: @
   Value: 76.76.21.21

   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

3. **SSL Certificate**
   - Vercel automatically provisions SSL
   - Wait for DNS propagation (up to 48 hours)
   - Verify HTTPS works

---

## Environment Variables

### Production Environment

Add these in Vercel Dashboard → Settings → Environment Variables:

```env
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_API_URL=https://your-domain.com/api
```

### Optional Variables

```env
# Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Error Tracking
SENTRY_DSN=https://...

# Feature Flags
NEXT_PUBLIC_ENABLE_MIDI=true
NEXT_PUBLIC_ENABLE_RECORDING=false
```

---

## Monitoring & Analytics

### Vercel Analytics

1. **Enable in Dashboard**
   - Go to Project → Analytics
   - Enable Web Analytics
   - Enable Speed Insights

2. **View Metrics**
   - Real User Monitoring (RUM)
   - Core Web Vitals
   - Page load times
   - Geographic distribution

### Error Tracking (Optional)

**Sentry Integration:**

1. **Install Sentry**

   ```bash
   npm install @sentry/nextjs
   ```

2. **Configure**

   ```bash
   npx @sentry/wizard@latest -i nextjs
   ```

3. **Update Error Boundary**
   ```typescript
   // In StudioErrorBoundary.tsx
   if (process.env.NODE_ENV === "production") {
     Sentry.captureException(error, { contexts: { react: errorInfo } });
   }
   ```

---

## Rollback Procedure

### If Deployment Fails

1. **Check Build Logs**
   - Vercel Dashboard → Deployments → [Failed Build]
   - Review error messages
   - Fix issues locally
   - Redeploy

2. **Rollback to Previous Version**
   - Vercel Dashboard → Deployments
   - Find last successful deployment
   - Click "..." → "Promote to Production"

3. **Emergency Rollback**
   ```bash
   vercel rollback
   ```

---

## Maintenance

### Regular Updates

1. **Dependencies**

   ```bash
   npm outdated
   npm update
   npm audit fix
   ```

2. **Next.js Updates**

   ```bash
   npm install next@latest react@latest react-dom@latest
   ```

3. **Security Patches**
   - Monitor GitHub Dependabot alerts
   - Apply security updates promptly

### Performance Monitoring

1. **Weekly Checks**
   - Review Vercel Analytics
   - Check error rates
   - Monitor Core Web Vitals

2. **Monthly Audits**
   - Run Lighthouse audit
   - Review bundle sizes
   - Check for unused dependencies

---

## Troubleshooting

### Common Issues

#### 1. Build Fails with TypeScript Errors

**Solution:**

```bash
npm run build
# Fix errors shown in output
# Commit and redeploy
```

#### 2. Service Worker Not Updating

**Solution:**

- Clear browser cache
- Unregister old service worker
- Hard refresh (Ctrl+Shift+R)

#### 3. MIDI Not Working

**Cause:** WebMIDI only works over HTTPS
**Solution:** Ensure site is deployed with SSL

#### 4. Audio Not Playing on iOS

**Cause:** Autoplay policy
**Solution:** Verify "START SESSION" button is clicked

#### 5. PWA Not Installing

**Cause:** Missing manifest or icons
**Solution:** Verify manifest.json and icon.png exist

---

## Success Criteria

### Deployment is Successful When:

- ✅ Build completes without errors
- ✅ Site loads on production URL
- ✅ PWA installs on mobile devices
- ✅ Audio engine initializes
- ✅ All features work as expected
- ✅ No console errors
- ✅ Lighthouse score > 90
- ✅ Core Web Vitals pass
- ✅ HTTPS enabled
- ✅ Service worker active

---

## Support & Resources

### Documentation

- Next.js: https://nextjs.org/docs
- Vercel: https://vercel.com/docs
- Web Audio API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API

### Community

- Next.js Discord: https://nextjs.org/discord
- Vercel Community: https://github.com/vercel/vercel/discussions

### Contact

- GitHub Issues: [Your repo]/issues
- Email: [Your email]

---

**Deployment Status:** ✅ READY FOR PRODUCTION

**Last Updated:** Phase 11 Complete
**Next Steps:** Deploy to Vercel and run post-deployment tests
